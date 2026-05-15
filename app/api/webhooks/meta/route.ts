import { NextRequest, NextResponse } from "next/server";
import {
  findAutomationForComment,
  findAutomationForDM,
  findAutomationById,
  isDuplicate,
  createMessageLog,
  upsertLead,
  createAutomationEvent,
  createWebhookEvent,
  updateWebhookEvent,
  createChatHistory,
  getChatHistory,
  trackResponse,
} from "@/actions/webhook/queries";
import { createHmac, timingSafeEqual } from "crypto";
import { matchKeywordWithMode } from "@/lib/matching";
import {
  formatSafeMetaError,
  getSafeMetaError,
  sendDm,
  sendPrivateMessage,
  sendCommentReply,
} from "@/lib/fetch";
import { resolveTemplate } from "@/lib/template";
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
    return new NextResponse(challenge, { status: 200 });
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
    const signatureResult = verifyMetaSignature(rawBody, signature);
    console.log("[webhook] signature verification", signatureResult);

    if (!signatureResult.verified) {
      try {
        await createWebhookEvent({
          eventType: "SIGNATURE_VERIFICATION_FAILED",
          status: "FAILED",
          errorMessage: signatureResult.reason,
          payload: {
            hasSignature: Boolean(signature),
            hasAppSecret: Boolean(process.env.META_APP_SECRET),
          },
        });
      } catch (error) {
        console.error("[webhook] failed to store signature failure", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const entries = Array.isArray(body.entry) ? body.entry : [];
    if (entries.length === 0) return ok();

    await Promise.all(entries.map(processEntry));

    return ok();
  } catch (error) {
    // Never return 5xx to Meta — always acknowledge receipt
    console.error("[webhook] unhandled error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return ok();
  }
}

async function processEntry(entry: any) {
  const igAccountId: string = entry.id;
  const changes = Array.isArray(entry.changes) ? entry.changes : [];
  const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];

  const field = changes[0]?.field ?? (messaging.length ? "messaging" : "unknown");
  console.log(`[webhook] POST field=${field} igAccountId=${igAccountId}`);

  for (const changeItem of changes) {

    // -----------------------------------------------------------------------
    // COMMENT EVENT
    // -----------------------------------------------------------------------
    if (changeItem.field === "comments") {
      const change = changeItem.value;
      const mediaId: string | undefined = change.media?.id;
      const commentId: string | undefined = change.id;
      const commenterId: string | undefined = change.from?.id;
      const commenterUsername: string | undefined = change.from?.username;
      const commentText: string = change.text ?? "";

      const webhookEvent = await createWebhookEvent({
        eventType: "COMMENT_WEBHOOK_RECEIVED",
        field: changeItem.field,
        igAccountId,
        igUserId: commenterId,
        mediaId,
        commentId,
        payload: {
          hasMediaId: Boolean(mediaId),
          hasCommentId: Boolean(commentId),
          hasCommenterId: Boolean(commenterId),
          hasText: Boolean(commentText),
        },
      });

      if (!mediaId || !commentId || !commenterId || !commentText) {
        await updateWebhookEvent(webhookEvent.id, {
          status: "IGNORED",
          errorMessage: "missing_required_comment_fields",
          processedAt: new Date(),
        });
        continue;
      }

      // 1. Find active automation for this post
      const automation = await findAutomationForComment(mediaId, igAccountId);
      if (!automation?.listener) {
        console.log(`[webhook] automation match: none (mediaId=${mediaId})`);
        await updateWebhookEvent(webhookEvent.id, {
          status: "IGNORED",
          errorMessage: "no_active_automation_for_media",
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
          errorMessage: "keyword_not_matched",
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

      const token = automation.User?.integrations?.[0]?.token;
      if (!token) {
        console.warn("[webhook] automation token missing", { automationId: automation.id });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "FAILED",
          errorMessage: "connected_instagram_token_missing",
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
        try {
          const replyResult = await withRetry(() => sendCommentReply(commentId, replyText, token));
          const sent = replyResult.status === 200;
          await createMessageLog({
            automationId: automation.id,
            recipientIgId: commenterId,
            mediaId,
            commentId,
            messageType: "COMMENT_REPLY",
            status: sent ? "SENT" : "FAILED",
          });
          await createAutomationEvent({
            automationId: automation.id,
            eventType: sent ? "PUBLIC_REPLY_SENT" : "PUBLIC_REPLY_FAILED",
            igUserId: commenterId,
            mediaId,
            commentId,
            keyword: matchedKeyword,
          });
        } catch (err) {
          const safeError = formatSafeMetaError(err);
          console.warn("[webhook] public reply failed", getSafeMetaError(err));
          await createMessageLog({
            automationId: automation.id,
            recipientIgId: commenterId,
            mediaId,
            commentId,
            messageType: "COMMENT_REPLY",
            status: "FAILED",
            errorMessage: safeError,
          });
          await createAutomationEvent({
            automationId: automation.id,
            eventType: "PUBLIC_REPLY_FAILED",
            igUserId: commenterId,
            mediaId,
            commentId,
            keyword: matchedKeyword,
            meta: { error: safeError },
          });
        }
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

      // 7. Send private DM (referenced to the comment)
      try {
        const dmResult = await withRetry(() =>
          sendPrivateMessage(igAccountId, commentId, dmMessageText, token)
        );
        const sent = dmResult.status === 200;
        console.log(`[webhook] ${sent ? "DM_SENT" : "DM_FAILED"} recipientId=${commenterId} automationId=${automation.id}`);
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: sent ? "SENT" : "FAILED",
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: sent ? "DM_SENT" : "DM_FAILED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
        });
        if (sent) {
          await upsertLead({
            automationId: automation.id,
            igUserId: commenterId,
            igUsername: commenterUsername,
            commentText,
            mediaId,
          });
          await trackResponse(automation.id, "DM");
        }
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: sent ? "PROCESSED" : "FAILED",
          errorMessage: sent ? undefined : "private_reply_not_accepted",
          processedAt: new Date(),
        });
      } catch (err) {
        const safeError = formatSafeMetaError(err);
        console.warn("[webhook] private reply failed", getSafeMetaError(err));
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: safeError,
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
          meta: { error: safeError },
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "FAILED",
          errorMessage: safeError,
          processedAt: new Date(),
        });
      }
      continue;
    } else {
      console.log("[webhook] unsupported change ignored", { field: changeItem.field });
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
        eventType: "DM_WEBHOOK_RECEIVED",
        field: "messaging",
        igAccountId,
        igUserId: senderId,
        payload: {
          hasSenderId: Boolean(senderId),
          hasText: Boolean(dmText),
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
      const result = await findAutomationForDM(dmText, igAccountId);

      if (!result) {
        console.log(`[webhook] DM no-match senderId=${senderId} — checking SMARTAI conversation`);
        // No keyword match — check for an ongoing SMARTAI conversation
        try {
          const chatHistory = await getChatHistory(igAccountId, senderId);
          if (chatHistory.history.length > 0 && chatHistory.automationId) {
            const automation = await findAutomationById(chatHistory.automationId);
            if (
              automation?.listener?.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO" &&
              process.env.OPENAI_API_KEY
            ) {
              const token = automation.User?.integrations?.[0]?.token;
              if (token) {
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
                    createChatHistory(automation.id, igAccountId, dmText, senderId),
                    createChatHistory(automation.id, igAccountId, aiText, senderId),
                  ]);
                  await withRetry(() => sendDm(igAccountId, senderId, aiText, token));
                }
              }
            }
          }
        } catch {
          // Continuation path is non-critical — swallow errors
        }
        await updateWebhookEvent(webhookEvent.id, {
          status: "PROCESSED",
          errorMessage: "keyword_not_matched",
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

      const token = automation.User?.integrations?.[0]?.token;
      if (!token || !automation.listener) {
        console.warn("[webhook] DM automation token or listener missing", {
          automationId: automation.id,
          hasToken: Boolean(token),
          hasListener: Boolean(automation.listener),
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "FAILED",
          errorMessage: "token_or_listener_missing",
          processedAt: new Date(),
        });
        continue;
      }

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
          await createChatHistory(automation.id, igAccountId, dmText, senderId);
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
          await createChatHistory(automation.id, igAccountId, dmMessageText, senderId);
        } catch {
          // SMARTAI unavailable — fall through with resolved prompt
        }
      }

      try {
        const dmResult = await withRetry(() => sendDm(igAccountId, senderId, dmMessageText, token));
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
          errorMessage: sent ? undefined : "dm_send_not_accepted",
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
          errorMessage: safeError,
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

function verifyMetaSignature(rawBody: string, signature: string | null) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return { verified: false, reason: "missing_app_secret" };
  }
  if (!signature?.startsWith("sha256=")) {
    return { verified: false, reason: "missing_or_invalid_signature_header" };
  }

  const expected = `sha256=${createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return { verified: false, reason: "signature_length_mismatch" };
  }

  const verified = timingSafeEqual(actualBuffer, expectedBuffer);
  return {
    verified,
    reason: verified ? "verified" : "signature_mismatch",
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
