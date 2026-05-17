import { NextRequest, NextResponse } from "next/server";
import {
  findAutomationForCommentWithReason,
  findAutomationForDM,
  findAutomationById,
  isDuplicate,
  createMessageLog,
  upsertLead,
  createAutomationEvent,
  createWebhookEvent,
  updateWebhookEvent,
  mergeWebhookEventPayload,
  createChatHistory,
  getChatHistory,
  trackResponse,
} from "@/actions/webhook/queries";
import { verifyMetaSignature } from "@/lib/webhook-signature";
import { matchKeywordWithMode } from "@/lib/matching";
import {
  formatSafeMetaError,
  getSafeMetaError,
  sendDm,
  sendCommentReply,
  sendMediaComment,
} from "@/lib/fetch";
import {
  sendInstagramCommentPrivateReply,
  formatPrivateReplyError,
} from "@/lib/instagram-dm";
import { resolveTemplate } from "@/lib/template";
import { resolveIntegrationSendToken, tokenResolutionDiagnostics } from "@/lib/send-token";
import { openai } from "@/lib/openai";

const WEBHOOK_RATE_LIMIT_WINDOW_MS = 60_000;
const WEBHOOK_RATE_LIMIT_MAX = 120;
const SEND_RETRY_ATTEMPTS = 2;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

// ---------------------------------------------------------------------------
// GET — Meta webhook verification challenge
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const tokenMatch = token === process.env.META_VERIFY_TOKEN;
  console.log("[webhook] GET verify", {
    mode,
    token_match: tokenMatch,
    challenge_exists: Boolean(challenge),
    has_env_token: Boolean(process.env.META_VERIFY_TOKEN),
  });

  if (mode === "subscribe" && tokenMatch && challenge) {
    try {
      await createWebhookEvent({
        eventType: "WEBHOOK_VERIFY_GET",
        eventSource: "META_REAL",
        status: "PROCESSED",
        payload: {
          mode,
          tokenMatch,
          challengeExists: true,
        },
      });
    } catch {
      // Non-critical — never let DB logging break verification
    }
    return new NextResponse(challenge, { status: 200 });
  }
  try {
    await createWebhookEvent({
      eventType: "WEBHOOK_VERIFY_GET",
      eventSource: "META_REAL",
      status: "FAILED",
      errorMessage: "webhook_verification_failed",
      payload: {
        mode,
        tokenMatch,
        challengeExists: Boolean(challenge),
      },
    });
  } catch {
    // Non-critical
  }
  return NextResponse.json({ error: "webhook_verification_failed" }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Process Instagram comment and DM events
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const rateKey = getRateLimitKey(req);
  if (isRateLimited(rateKey)) {
    console.warn("[webhook] request rate limited", { rateKey });
    return NextResponse.json({ received: true, rate_limited: true }, { status: 200 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // Store raw receipt before any processing — proves the route is reachable
    try {
      const quickParse = parseJsonSafely(rawBody);
      const firstEntry = quickParse.ok && Array.isArray(quickParse.body?.entry)
        ? quickParse.body.entry[0]
        : undefined;
      const firstChange = firstEntry?.changes?.[0];
      const firstValue = firstChange?.value;
      await createWebhookEvent({
        eventType: "WEBHOOK_POST_RECEIVED_RAW",
        eventSource: "META_REAL",
        status: "RECEIVED",
        payload: {
          hasSignature: Boolean(signature),
          contentLength: rawBody.length,
          rawBodyLength: rawBody.length,
          receivedAt: new Date().toISOString(),
          userAgent: req.headers.get("user-agent") ?? undefined,
          object: quickParse.ok ? (quickParse.body?.object ?? undefined) : undefined,
          entryCount: quickParse.ok && Array.isArray(quickParse.body?.entry)
            ? quickParse.body.entry.length
            : undefined,
          firstEntryId: firstEntry?.id ?? undefined,
          firstField: firstChange?.field ?? undefined,
          hasValueText: Boolean(firstValue?.text ?? firstValue?.comment_text ?? firstValue?.message),
          hasValueMediaId: Boolean(firstValue?.media?.id ?? firstValue?.media_id),
        },
      });
    } catch {
      // Non-critical — never let raw receipt logging block processing
    }

    const signatureResult = verifyMetaSignature(rawBody, signature);
    const requestMeta = getRequestMetadata(req, signature, signatureResult.verified);
    const parsedBody = parseJsonSafely(rawBody);
    console.log("[webhook] POST received", {
      ...requestMeta,
      signatureReason: signatureResult.reason,
      payloadObject: parsedBody.ok ? parsedBody.body?.object : undefined,
    });

    if (!signatureResult.verified) {
      try {
        await createWebhookEvent({
          eventType: "SIGNATURE_FAILED",
          eventSource: "META_REAL",
          status: "FAILED",
          errorMessage: signatureResult.reason,
          payload: {
            hasSignature: Boolean(signature),
            signaturePrefix: "sha256",
            candidateSecretsConfigured: signatureResult.candidateSecretsConfigured,
            triedSecretCount: signatureResult.triedSecretCount,
            rawBodyLength: rawBody.length,
            rawBodySha256Short: signatureResult.rawBodySha256Short,
            object: parsedBody.ok ? (parsedBody.body?.object ?? undefined) : undefined,
            entryCount:
              parsedBody.ok && Array.isArray(parsedBody.body?.entry)
                ? parsedBody.body.entry.length
                : undefined,
          },
        });
      } catch (error) {
        console.error("[webhook] failed to store signature failure", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return ok();
    }

    if (!parsedBody.ok) {
      await createWebhookEvent({
        eventType: "PAYLOAD_INVALID",
        eventSource: "META_REAL",
        status: "FAILED",
        errorMessage: "invalid_json_payload",
        payload: {
          ...safeWebhookMetadata(undefined, true, undefined, undefined, requestMeta),
          parseError: parsedBody.error,
        },
      });
      return ok();
    }

    const body = parsedBody.body;

    // Self-test payloads must never trigger DM sends
    if (body.source === "INTERNAL_SELF_TEST") {
      await createWebhookEvent({
        eventType: "INTERNAL_SELF_TEST",
        eventSource: "SIMULATED_INTERNAL",
        status: "PROCESSED",
        igAccountId: Array.isArray(body.entry) ? body.entry[0]?.id : undefined,
        payload: { source: "INTERNAL_SELF_TEST", signatureValid: signatureResult.verified },
      });
      return ok();
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];
    if (entries.length === 0) {
      await createWebhookEvent({
        eventType: classifyWebhookEnvelope(body),
        eventSource: "META_REAL",
        status: "IGNORED",
        field: "none",
        payload: safeWebhookMetadata(
          body,
          signatureResult.verified,
          undefined,
          undefined,
          requestMeta
        ),
      });
      return ok();
    }

    await Promise.all(
      entries.map((entry: any) =>
        processEntry(entry, body, signatureResult.verified, requestMeta)
      )
    );

    return ok();
  } catch (error) {
    // Never return 5xx to Meta — always acknowledge receipt
    console.error("[webhook] unhandled error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return ok();
  }
}

async function processEntry(
  entry: any,
  envelope: any,
  signatureValid: boolean,
  requestMeta: ReturnType<typeof getRequestMetadata>
) {
  const pageId: string = entry.id;
  const changes = Array.isArray(entry.changes) ? entry.changes : [];
  const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];

  const field = changes[0]?.field ?? (messaging.length ? "messaging" : "unknown");
  console.log(`[webhook] POST field=${field} pageId=${pageId}`);

  if (changes.length === 0 && messaging.length === 0) {
    await createWebhookEvent({
      eventType: "PAYLOAD_INVALID",
      eventSource: "META_REAL",
      field,
      igAccountId: pageId,
      status: "IGNORED",
      errorMessage: "entry_without_changes_or_messaging",
      payload: safeWebhookMetadata(
        envelope,
        signatureValid,
        entry,
        undefined,
        requestMeta
      ),
    });
    return;
  }

  for (const changeItem of changes) {

    // -----------------------------------------------------------------------
    // COMMENT EVENT
    // -----------------------------------------------------------------------
    if (changeItem.field === "comments") {
      const change = changeItem.value;
      // Instagram webhook shapes vary by object type and API version — use all known paths
      const mediaId: string | undefined =
        change.media?.id ??
        change.media_id ??
        change.media?.media_id ??
        undefined;
      const commentId: string | undefined =
        change.id ??
        change.comment_id ??
        change.comment?.id ??
        undefined;
      const commenterId: string | undefined =
        change.from?.id ??
        change.user?.id ??
        change.sender?.id ??
        undefined;
      const commenterUsername: string | undefined =
        change.from?.username ??
        change.username ??
        change.user?.username ??
        undefined;
      const commentText: string =
        change.text ??
        change.comment_text ??
        change.message ??
        "";

      const webhookEvent = await createWebhookEvent({
        eventType: classifyCommentWebhook(envelope, entry, changeItem),
        eventSource: "META_REAL",
        field: changeItem.field,
        igAccountId: pageId,
        igUserId: commenterId,
        mediaId,
        commentId,
        payload: {
          ...safeWebhookMetadata(envelope, signatureValid, entry, changeItem, requestMeta),
          hasMediaId: Boolean(mediaId),
          hasCommentId: Boolean(commentId),
          hasCommenterId: Boolean(commenterId),
          hasCommentText: Boolean(commentText),
          appearsSynthetic: isSyntheticWebhook(envelope, entry, changeItem),
        },
      });

      if (!mediaId || !commentId || !commenterId || !commentText) {
        const missing = [
          !mediaId && "media_id",
          !commentId && "comment_id",
          !commenterId && "commenter_id",
          !commentText && "comment_text",
        ].filter(Boolean).join(",");
        await updateWebhookEvent(webhookEvent.id, {
          status: "IGNORED",
          errorMessage: `missing_required_comment_fields:${missing}`,
          processedAt: new Date(),
        });
        continue;
      }

      // 1. Find active automation for this post
      const match = await findAutomationForCommentWithReason(mediaId, pageId);
      const automation = match.automation;
      await mergeWebhookEventPayload(webhookEvent.id, {
        mediaMatching: match.diagnostics,
      });
      if (!automation?.listener) {
        const failureReason = match.failureReason ?? "no_active_automation_for_media";
        console.log("[webhook] automation match failed", {
          mediaId,
          pageId,
          failureReason,
        });
        await updateWebhookEvent(webhookEvent.id, {
          status: "IGNORED",
          errorMessage: failureReason,
          processedAt: new Date(),
        });
        continue;
      }

      await updateWebhookEvent(webhookEvent.id, {
        automationId: automation.id,
        status: "PROCESSING",
      });

      await createAutomationEvent({
        automationId: automation.id,
        eventType: "WEBHOOK_RECEIVED",
        igUserId: commenterId,
        mediaId,
        commentId,
      });

      // 2. Match keyword using this automation's matching mode
      const matchedKeyword = matchKeywordWithMode(
        commentText,
        automation.keywords,
        automation.matchingMode
      );

      if (!matchedKeyword) {
        console.log(`[webhook] automation match: none (automationId=${automation.id} mode=${automation.matchingMode})`);
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "NO_MATCH",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: commentText.slice(0, 100),
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "PROCESSED",
          errorMessage: "no_keyword_match",
          processedAt: new Date(),
        });
        continue;
      }

      console.log(`[webhook] automation match: ${automation.id} keyword="${matchedKeyword}"`);

      await createAutomationEvent({
        automationId: automation.id,
        eventType: "KEYWORD_MATCHED",
        igUserId: commenterId,
        mediaId,
        commentId,
        keyword: matchedKeyword,
      });

      // 3. Log comment received
      await createAutomationEvent({
        automationId: automation.id,
        eventType: "COMMENT_RECEIVED",
        igUserId: commenterId,
        mediaId,
        commentId,
        keyword: matchedKeyword,
      });
      await trackResponse(automation.id, "COMMENT");

      // 4. Duplicate check — skip if we already DM'd this person for this automation
      if (await isDuplicate(automation.id, commenterId, mediaId, commentId)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DUPLICATE_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "PROCESSED",
          errorMessage: "duplicate_skipped",
          processedAt: new Date(),
        });
        continue;
      }

      await upsertLead({
        automationId: automation.id,
        igUserId: commenterId,
        igUsername: commenterUsername,
        commentText,
        mediaId,
      });

      const integrationRaw = automation.User?.integrations?.[0];
      const tokenResolution = resolveIntegrationSendToken(integrationRaw);
      const instagramBusinessAccountId = integrationRaw?.instagramId;
      if (!tokenResolution.ok) {
        const diag = tokenResolutionDiagnostics(integrationRaw);
        console.warn("[webhook] automation token missing", {
          automationId: automation.id,
          reason: tokenResolution.reason,
          ...diag,
        });
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: "token_missing",
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "FAILED",
          errorMessage: "token_missing",
          processedAt: new Date(),
        });
        continue;
      }
      const token = tokenResolution.token;
      if (!instagramBusinessAccountId) {
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: "instagram_business_account_missing",
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "FAILED",
          errorMessage: "instagram_business_account_missing",
          processedAt: new Date(),
        });
        continue;
      }

      const listener = automation.listener;

      const templateVars = {
        username: commenterUsername ?? "",
        first_name: commenterUsername ?? "",
        keyword: matchedKeyword,
        link: listener.ctaLink ?? "",
      };

      // 5. Send public comment reply — pick a random non-empty variation
      // Primary: threaded reply via POST /{commentId}/replies (Advanced Access)
      // Fallback: top-level @mention comment via POST /{mediaId}/comments (Standard Access)
      const replyVariants = [
        listener.commentReply,
        listener.commentReply2,
        listener.commentReply3,
      ].filter(Boolean) as string[];
      const chosenReply =
        replyVariants.length > 0
          ? replyVariants[Math.floor(Math.random() * replyVariants.length)]
          : null;

      if (chosenReply) {
        const replyText = resolveTemplate(chosenReply, templateVars);
        let publicReplySent = false;
        let publicReplyEndpoint: "threaded_reply" | "mention_comment" = "threaded_reply";
        let publicReplyErrorMessage: string | undefined;

        try {
          // Primary: Advanced Access — true threaded reply linked to the comment
          const replyResult = await withRetry(() => sendCommentReply(commentId, replyText, token));
          publicReplySent = replyResult.status === 200;
        } catch (threadedErr) {
          const threadedError = formatSafeMetaError(threadedErr);
          console.warn("[webhook] threaded comment reply failed — trying Standard Access @mention fallback", {
            error: getSafeMetaError(threadedErr),
            hasCommenterUsername: Boolean(commenterUsername),
            hasMediaId: Boolean(mediaId),
          });

          // Fallback: Standard Access — top-level comment with @mention
          if (commenterUsername && mediaId) {
            publicReplyEndpoint = "mention_comment";
            const mentionText = `@${commenterUsername} ${replyText}`;
            try {
              const fallback = await withRetry(() => sendMediaComment(mediaId, mentionText, token));
              publicReplySent = fallback.status === 200;
            } catch (mentionErr) {
              publicReplyErrorMessage = `threaded=${threadedError} mention=${formatSafeMetaError(mentionErr)}`;
              console.warn("[webhook] Standard Access @mention fallback also failed", getSafeMetaError(mentionErr));
            }
          } else {
            publicReplyErrorMessage = threadedError;
          }
        }

        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "COMMENT_REPLY",
          status: publicReplySent ? "SENT" : "FAILED",
          errorMessage: publicReplyErrorMessage,
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: publicReplySent ? "PUBLIC_REPLY_SENT" : "PUBLIC_REPLY_FAILED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
          meta: { endpoint: publicReplyEndpoint, ...(publicReplyErrorMessage ? { error: publicReplyErrorMessage } : {}) },
        });
      }

      // 6. Build DM message — resolve template first, then optionally run through SMARTAI
      const isSmartAi =
        listener.listener === "SMARTAI" &&
        automation.User?.subscription?.plan === "PRO" &&
        !!process.env.OPENAI_API_KEY;

      let dmMessageText = resolveTemplate(listener.prompt, templateVars);

      if (isSmartAi) {
        try {
          const aiResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "assistant",
                content: `${dmMessageText}: Keep responses under 2 sentences`,
              },
            ],
          });
          dmMessageText = aiResp.choices[0].message.content ?? dmMessageText;
        } catch {
          // SMARTAI unavailable — fall through with the resolved prompt text
        }
      }

      // 7. Send private DM (private reply linked to the comment, with direct DM fallback)
      const dmResult = await sendInstagramCommentPrivateReply({
        token,
        igBusinessAccountId: instagramBusinessAccountId,
        commentId,
        commenterId,
        message: dmMessageText,
        ctaTitle: listener.ctaButtonTitle,
        ctaUrl: listener.ctaLink,
      });

      if (dmResult.ok) {
        console.log(`[webhook] DM_SENT recipientId=${commenterId} automationId=${automation.id} endpoint=${dmResult.endpoint} ctaMode=${dmResult.ctaMode}`);
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: "SENT",
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_SENT",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
          meta: { endpoint: dmResult.endpoint, ctaMode: dmResult.ctaMode },
        });
        await trackResponse(automation.id, "DM");
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "PROCESSED",
          errorMessage: "dm_sent",
          processedAt: new Date(),
        });
      } else {
        const errorMessage = formatPrivateReplyError(dmResult);
        console.warn(`[webhook] DM_FAILED recipientId=${commenterId} automationId=${automation.id} reason=${dmResult.reason} endpoint=${dmResult.endpoint}`);
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: "FAILED",
          errorMessage,
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
          meta: {
            reason: dmResult.reason,
            endpoint: dmResult.endpoint,
            metaError: dmResult.metaError,
            ctaMode: dmResult.ctaMode,
          },
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "FAILED",
          errorMessage: `dm_failed: ${errorMessage}`,
          processedAt: new Date(),
        });
      }
      continue;
    } else {
      console.log("[webhook] unsupported change ignored", { field: changeItem.field });
      await createWebhookEvent({
        eventType: "UNHANDLED_WEBHOOK",
        eventSource: "META_REAL",
        field: changeItem.field,
        igAccountId: pageId,
        status: "IGNORED",
        payload: safeWebhookMetadata(envelope, signatureValid, entry, changeItem, requestMeta),
      });
      continue;
    }
  }

  for (const messagingItem of messaging) {
    // -----------------------------------------------------------------------
    // DM EVENT
    // -----------------------------------------------------------------------
    if (messagingItem) {
      const senderId: string | undefined = messagingItem.sender?.id;
      const dmText: string = messagingItem.message?.text ?? "";

      const webhookEvent = await createWebhookEvent({
        eventType: "REAL_MESSAGE_EVENT",
        eventSource: "META_REAL",
        field: "messaging",
        igAccountId: pageId,
        igUserId: senderId,
        payload: {
          ...safeWebhookMetadata(envelope, signatureValid, entry, undefined, requestMeta),
          hasSenderId: Boolean(senderId),
          hasMessageText: Boolean(dmText),
        },
      });

      if (!senderId || !dmText) {
        await updateWebhookEvent(webhookEvent.id, {
          status: "IGNORED",
          errorMessage: "missing_required_dm_fields",
          processedAt: new Date(),
        });
        continue;
      }

      // 1. Try to match an automation by keyword
      const result = await findAutomationForDM(dmText, pageId);

      if (!result) {
        console.log(`[webhook] DM no-match senderId=${senderId} — checking SMARTAI conversation`);
        // No keyword match — check for an ongoing SMARTAI conversation
        try {
          const chatHistory = await getChatHistory(pageId, senderId);
          if (chatHistory.history.length > 0 && chatHistory.automationId) {
            const automation = await findAutomationById(chatHistory.automationId);
            if (
              automation?.listener?.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO" &&
              process.env.OPENAI_API_KEY
            ) {
              const smartAiResolution = resolveIntegrationSendToken(automation.User?.integrations?.[0]);
              const instagramBusinessAccountId = automation.User?.integrations?.[0]?.instagramId;
              if (smartAiResolution.ok && instagramBusinessAccountId) {
                const token = smartAiResolution.token;
                const aiResp = await openai.chat.completions.create({
                  model: "gpt-4o-mini",
                  messages: [
                    {
                      role: "assistant",
                      content: `${automation.listener.prompt}: Keep responses under 2 sentences`,
                    },
                    ...chatHistory.history,
                    { role: "user", content: dmText },
                  ],
                });
                const aiText = aiResp.choices[0].message.content;
                if (aiText) {
                  await Promise.all([
                    createChatHistory(automation.id, pageId, dmText, senderId),
                    createChatHistory(automation.id, pageId, aiText, senderId),
                  ]);
                  await withRetry(() => sendDm(instagramBusinessAccountId, senderId, aiText, token));
                }
              }
            }
          }
        } catch {
          // Continuation path is non-critical — swallow errors
        }
        await updateWebhookEvent(webhookEvent.id, {
          status: "PROCESSED",
          errorMessage: "no_keyword_match",
          processedAt: new Date(),
        });
        continue;
      }

      const { automation, matchedKeyword } = result;
      console.log(`[webhook] DM match: automationId=${automation.id} keyword="${matchedKeyword}"`);
      await updateWebhookEvent(webhookEvent.id, {
        automationId: automation.id,
        status: "PROCESSING",
      });

      // 2. Duplicate check
      if (await isDuplicate(automation.id, senderId)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DUPLICATE_SKIPPED",
          igUserId: senderId,
          keyword: matchedKeyword,
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "PROCESSED",
          errorMessage: "duplicate_skipped",
          processedAt: new Date(),
        });
        continue;
      }

      const dmIntegrationRaw = automation.User?.integrations?.[0];
      const dmTokenResolution = resolveIntegrationSendToken(dmIntegrationRaw);
      const instagramBusinessAccountId = dmIntegrationRaw?.instagramId;
      if (!dmTokenResolution.ok || !automation.listener || !instagramBusinessAccountId) {
        const diag = tokenResolutionDiagnostics(dmIntegrationRaw);
        console.warn("[webhook] DM automation token or listener missing", {
          automationId: automation.id,
          reason: dmTokenResolution.ok ? undefined : dmTokenResolution.reason,
          hasListener: Boolean(automation.listener),
          hasInstagramBusinessAccountId: Boolean(instagramBusinessAccountId),
          ...diag,
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "FAILED",
          errorMessage: !instagramBusinessAccountId
            ? "instagram_business_account_missing"
            : !automation.listener
              ? "listener_missing"
              : "token_missing",
          processedAt: new Date(),
        });
        continue;
      }
      const token = dmTokenResolution.token;

      const templateVars = {
        username: "",
        first_name: "",
        keyword: matchedKeyword,
        link: automation.listener.ctaLink ?? "",
      };

      const isSmartAi =
        automation.listener.listener === "SMARTAI" &&
        automation.User?.subscription?.plan === "PRO" &&
        !!process.env.OPENAI_API_KEY;

      let dmMessageText = resolveTemplate(automation.listener.prompt, templateVars);

      if (isSmartAi) {
        try {
          await createChatHistory(automation.id, pageId, dmText, senderId);
          const aiResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "assistant",
                content: `${dmMessageText}: Keep responses under 2 sentences`,
              },
            ],
          });
          dmMessageText = aiResp.choices[0].message.content ?? dmMessageText;
          await createChatHistory(automation.id, pageId, dmMessageText, senderId);
        } catch {
          // SMARTAI unavailable — fall through with resolved prompt
        }
      }

      try {
        const dmResult = await withRetry(() => sendDm(instagramBusinessAccountId, senderId, dmMessageText, token));
        const sent = dmResult.status === 200;
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: senderId,
          messageType: "DM",
          status: sent ? "SENT" : "FAILED",
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: sent ? "DM_SENT" : "DM_FAILED",
          igUserId: senderId,
          keyword: matchedKeyword,
        });
        if (sent) await trackResponse(automation.id, "DM");
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: sent ? "PROCESSED" : "FAILED",
          errorMessage: sent ? "dm_sent" : "dm_failed",
          processedAt: new Date(),
        });
      } catch (err) {
        const safeError = formatSafeMetaError(err);
        console.warn("[webhook] DM send failed", getSafeMetaError(err));
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: senderId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: safeError,
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: senderId,
          keyword: matchedKeyword,
          meta: { error: safeError },
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "FAILED",
          errorMessage: `dm_failed: ${safeError}`,
          processedAt: new Date(),
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function ok() {
  return NextResponse.json({ received: true }, { status: 200 });
}


function classifyWebhookEnvelope(body: any) {
  // Meta Test button sends entry.id="0" for both object=page and object=instagram
  if (body?.entry?.[0]?.id === "0") {
    return "META_TEST_EVENT";
  }

  if (body?.object && !Array.isArray(body?.entry)) {
    return "PAYLOAD_INVALID";
  }

  return "PAYLOAD_INVALID";
}

function classifyCommentWebhook(envelope: any, entry: any, changeItem: any) {
  return isSyntheticWebhook(envelope, entry, changeItem)
    ? "META_TEST_EVENT"
    : "REAL_COMMENT_EVENT";
}

function isSyntheticWebhook(_envelope: any, entry: any, changeItem?: any) {
  const value = changeItem?.value;
  // Synthetic IDs used by Meta Test button regardless of object type (page or instagram)
  return (
    entry?.id === "0" ||
    value?.id === "0" ||
    value?.from?.id === "0" ||
    value?.media?.id === "0" ||
    value?.media?.id === "123123123"
  );
}

function safeWebhookMetadata(
  envelope: any,
  signatureValid: boolean,
  entry?: any,
  changeItem?: any,
  requestMeta?: ReturnType<typeof getRequestMetadata>
) {
  const entries = Array.isArray(envelope?.entry) ? envelope.entry : [];
  const changes = Array.isArray(entry?.changes) ? entry.changes : [];
  const value = changeItem?.value;

  return {
    timestamp: new Date().toISOString(),
    headers: requestMeta,
    object: typeof envelope?.object === "string" ? envelope.object : undefined,
    entryId: entry?.id,
    field: changeItem?.field,
    entryCount: entries.length,
    changesCount: changes.length,
    hasValue: Boolean(value),
    valueKeys: value && typeof value === "object" ? Object.keys(value) : [],
    hasCommentId: Boolean(value?.id),
    hasMediaId: Boolean(value?.media?.id),
    hasFromId: Boolean(value?.from?.id),
    hasText: Boolean(value?.text),
    hasCommentText: Boolean(value?.text),
    commentId: value?.id,
    mediaId: value?.media?.id,
    fromId: value?.from?.id,
    igAccountId: entry?.id,
    appearsSynthetic: entry ? isSyntheticWebhook(envelope, entry, changeItem) : false,
    signatureValid,
    processingStatus: "RECEIVED",
  };
}

function parseJsonSafely(rawBody: string):
  | { ok: true; body: any }
  | { ok: false; error: string } {
  try {
    return { ok: true, body: JSON.parse(rawBody) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "unknown_parse_error",
    };
  }
}

function getRequestMetadata(
  req: NextRequest,
  signature: string | null,
  signatureValid: boolean
) {
  return {
    timestamp: new Date().toISOString(),
    hasXHubSignature256: Boolean(signature),
    userAgent: req.headers.get("user-agent") ?? undefined,
    signatureValid,
  };
}

function getRateLimitKey(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + WEBHOOK_RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  existing.count += 1;
  return existing.count > WEBHOOK_RATE_LIMIT_MAX;
}

async function withRetry<T>(operation: () => Promise<T>, attempts = SEND_RETRY_ATTEMPTS): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = getSafeMetaError(error).status;
      const shouldRetry = status === 429 || (typeof status === "number" && status >= 500);
      if (!shouldRetry || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }

  throw lastError;
}
