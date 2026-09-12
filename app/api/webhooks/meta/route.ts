import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createHash } from "crypto";
import {
  findAutomationForCommentWithReason,
  findAutomationForDM,
  findAutomationForStory,
  findAutomationById,
  findPendingCommentDmActionForText,
  findIntegrationForWebhookAccount,
  isDuplicate,
  hasDeliveredFinalPayload,
  hasProcessedCommentWebhook,
  hasAp3kGeneratedCommentId,
  countRecentPublicReplies,
  countRecentSelfCommentSkips,
  pauseAutomationForLoopGuard,
  createMessageLog,
  upsertLead,
  createAutomationEvent,
  createWebhookEvent,
  updateWebhookEvent,
  mergeWebhookEventPayload,
  trackResponse,
  upsertInboundInboxMessage,
  recordOutboundInboxMessage,
} from "@/actions/webhook/queries";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { verifyMetaSignature } from "@/lib/webhook-signature";
import { normalizeMatchText, resolveCommentTriggerMatch } from "@/lib/matching";
import {
  formatSafeMetaError,
  getSafeMetaError,
  sendCommentReply,
  sendMediaComment,
  deleteInstagramComment,
} from "@/lib/fetch";
import {
  sendInstagramCommentPrivateReply,
  sendInstagramDirectResponse,
  getInstagramRecipientProfile,
  formatPrivateReplyError,
} from "@/lib/instagram-dm";
import {
  followRequestActionPayload,
  openingDmActionPayload,
  parseCommentDmActionPayload,
  resolveFollowRequestButtonText,
  resolveFollowRequestDmText,
  resolveOpeningDmButtonText,
  resolveOpeningDmText,
  type CommentDmAction,
} from "@/lib/comment-dm-flow";
import { resolveTemplate } from "@/lib/template";
import { resolveIntegrationSendToken, tokenResolutionDiagnostics } from "@/lib/send-token";
import {
  canSendStaticReply,
  completeAiReplyReservation,
  releaseAiReplyReservation,
  reserveAiReplyQuota,
} from "@/actions/usage/queries";
import { generateAiCommentDecision, generateAiDmReply, getAiWorkspaceRuntimeConfig } from "@/lib/ai-reply";
import {
  parseMessagingItem,
  classifyStoryInteraction,
  INBOUND_MESSAGE_NO_AUTOMATION,
  INBOUND_MESSAGE_ECHO_SKIPPED,
  INBOUND_SYSTEM_EVENT_SKIPPED,
} from "@/lib/instagram-message-event";
import { readLegacyQuickReplies, readLinkButtons } from "@/lib/link-buttons";
import { ensureInstagramButtonCallbacks } from "@/lib/instagram-postback-subscription";
import {
  cleanupWebhookRateLimitBuckets,
  consumeWebhookAccountRateLimit,
} from "@/lib/webhook-rate-limit";

export const maxDuration = 60;

const WEBHOOK_ROUTE_VERSION = "2026-05-tenant-diagnostics-v2";

const WEBHOOK_RATE_LIMIT_WINDOW_MS = 60_000;
const WEBHOOK_RATE_LIMIT_MAX = 120;
const WEBHOOK_RATE_LIMIT_MAX_BUCKETS = 5_000;
const WEBHOOK_MAX_BODY_BYTES = 1024 * 1024;
const SEND_RETRY_ATTEMPTS = 2;
const LOOP_GUARD_MEDIA_WINDOW_MS = 10 * 60 * 1000;
const LOOP_GUARD_AUTOMATION_WINDOW_MS = 60 * 60 * 1000;
const MAX_PUBLIC_REPLIES_PER_AUTOMATION_MEDIA_10M = 5;
const MAX_PUBLIC_REPLIES_PER_AUTOMATION_HOUR = 50;
// ANY_COMMENT campaigns only: pause if self-comment skip rate exceeds this within 10 min.
const SELF_COMMENT_PAUSE_THRESHOLD = 3;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
let nextRateLimitCleanupAt = 0;
const PUBLIC_REPLY_SENT_REASON = "PUBLIC_REPLY_SENT";
const PUBLIC_REPLY_SKIPPED_SELF_COMMENT = "PUBLIC_REPLY_SKIPPED_SELF_COMMENT";
const PUBLIC_REPLY_SKIPPED_DUPLICATE_COMMENT = "PUBLIC_REPLY_SKIPPED_DUPLICATE_COMMENT";
const PUBLIC_REPLY_SKIPPED_AP3K_GENERATED_REPLY = "PUBLIC_REPLY_SKIPPED_AP3K_GENERATED_REPLY";
const PUBLIC_REPLY_SKIPPED_KEYWORD_MISMATCH = "PUBLIC_REPLY_SKIPPED_KEYWORD_MISMATCH";
const PUBLIC_REPLY_SKIPPED_MEDIA_MISMATCH = "PUBLIC_REPLY_SKIPPED_MEDIA_MISMATCH";
const PUBLIC_REPLY_FAILED_META_API = "PUBLIC_REPLY_FAILED_META_API";
const PUBLIC_REPLY_FAILED_RATE_LIMIT = "PUBLIC_REPLY_FAILED_RATE_LIMIT";
const PUBLIC_REPLY_FAILED_UNKNOWN = "PUBLIC_REPLY_FAILED_UNKNOWN";

// ---------------------------------------------------------------------------
// GET — Meta webhook verification challenge
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const rateKey = getRateLimitKey(req);
  if (isRateLimited(`GET:${rateKey}`)) {
    console.warn("[webhook] GET verification rate limited", { rateKey });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

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
  return NextResponse.json({ error: "webhook_verification_failed" }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Process Instagram comment and DM events
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // PHASE 1 — absolute first-line logging
  console.log("AP3K_WEBHOOK_POST_ENTERED", {
    timestamp: new Date().toISOString(),
    method: req.method,
    contentType: req.headers.get("content-type"),
    userAgent: req.headers.get("user-agent"),
    hasSignature: req.headers.has("x-hub-signature-256"),
    routeVersion: WEBHOOK_ROUTE_VERSION,
  });

  try {
    const bodyRead = await readBodyWithLimit(req, WEBHOOK_MAX_BODY_BYTES);
    if (!bodyRead.ok) {
      console.warn("[webhook] request body rejected", {
        reason: bodyRead.reason,
        bytesRead: bodyRead.bytesRead,
        maxBytes: WEBHOOK_MAX_BODY_BYTES,
      });
      return NextResponse.json({ received: false, error: bodyRead.reason }, { status: 413 });
    }

    const rawBody = bodyRead.rawBody;
    const signature = req.headers.get("x-hub-signature-256");

    const signatureResult = verifyMetaSignature(rawBody, signature);
    const requestMeta = getRequestMetadata(req, signature, signatureResult.verified);

    if (!signatureResult.verified) {
      console.warn("[webhook] signature verification failed", {
        routeVersion: WEBHOOK_ROUTE_VERSION,
        reason: signatureResult.reason,
        hasSignature: Boolean(signature),
        triedSecretCount: signatureResult.triedSecretCount,
        rawBodyLength: rawBody.length,
        rawBodySha256Short: signatureResult.rawBodySha256Short,
      });
      return ok();
    }

    const parsedBody = parseJsonSafely(rawBody);
    console.log("[webhook] POST received", {
      ...requestMeta,
      routeVersion: WEBHOOK_ROUTE_VERSION,
      signatureReason: signatureResult.reason,
      payloadObject: parsedBody.ok ? parsedBody.body?.object : undefined,
    });

    if (!parsedBody.ok) {
      await createWebhookEvent({
        eventType: "PAYLOAD_INVALID",
        eventSource: "META_REAL",
        status: "FAILED",
        errorMessage: "invalid_json_payload",
        payload: {
          routeVersion: WEBHOOK_ROUTE_VERSION,
          ...safeWebhookMetadata(undefined, true, undefined, undefined, requestMeta),
          parseError: parsedBody.error,
        },
      });
      return ok();
    }

    const body = parsedBody.body;
    const isDryRun = body.dryRun === true || body.source === "INTERNAL_SELF_TEST";

    try {
      const firstEntry = Array.isArray(body?.entry) ? body.entry[0] : undefined;
      await createWebhookEvent({
        eventType: isDryRun ? "INTERNAL_SELF_TEST" : "WEBHOOK_POST_RECEIVED_RAW",
        eventSource: isDryRun ? "SIMULATED_INTERNAL" : "META_REAL",
        status: isDryRun ? "PROCESSED" : "RECEIVED",
        igAccountId: firstEntry?.id,
        payload: {
          routeVersion: WEBHOOK_ROUTE_VERSION,
          signatureVerified: true,
          dryRun: isDryRun,
          rawBodyLength: rawBody.length,
          rawBodyBytes: bodyRead.bytesRead,
          object: body?.object,
          entryId: firstEntry?.id,
          entryCount: Array.isArray(body?.entry) ? body.entry.length : 0,
          changesCount: Array.isArray(firstEntry?.changes) ? firstEntry.changes.length : 0,
        },
      });
    } catch {
      // Non-critical diagnostics
    }

    // Self-test payloads that are not smoke tests just return early
    if (body.source === "INTERNAL_SELF_TEST" && !body.smokeTest) {
      return ok();
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];
    if (entries.length === 0) {
      await createWebhookEvent({
        eventType: classifyWebhookEnvelope(body),
        eventSource: "META_REAL",
        status: "IGNORED",
        field: "none",
        payload: {
          routeVersion: WEBHOOK_ROUTE_VERSION,
          ...safeWebhookMetadata(
            body,
            signatureResult.verified,
            undefined,
            undefined,
            requestMeta
          ),
        },
      });
      return ok();
    }

    if (!isDryRun) {
      try {
        const rateLimit = await consumeWebhookAccountRateLimit(
          entries.map((entry: any) => String(entry?.id ?? ""))
        );
        if (!rateLimit.allowed) {
          console.warn("[webhook] account rate limited", {
            accountCount: entries.length,
            highestCount: rateLimit.highestCount,
            limit: rateLimit.limit,
          });
          await createWebhookEvent({
            eventType: "WEBHOOK_ACCOUNT_RATE_LIMITED",
            eventSource: "META_REAL",
            status: "IGNORED",
            igAccountId: entries[0]?.id,
            payload: {
              routeVersion: WEBHOOK_ROUTE_VERSION,
              highestCount: rateLimit.highestCount,
              limit: rateLimit.limit,
            },
          }).catch(() => undefined);
          return ok();
        }
      } catch (error) {
        // Fail open when the limiter store is unavailable. Delivery and usage
        // enforcement remain safer than silently dropping a legitimate event.
        console.error("AP3K_WEBHOOK_RATE_LIMIT_ERROR", {
          message: error instanceof Error ? error.message : String(error),
          routeVersion: WEBHOOK_ROUTE_VERSION,
        });
      }
    }

    // Meta expects a fast acknowledgement. Keep all delivery work alive after
    // the response so configured 3–30 second delays never invite webhook
    // retries or duplicate replies.
    const backgroundProcessing = Promise.all([
      ...entries.map((entry: any) =>
        processEntry(entry, body, signatureResult.verified, requestMeta)
      ),
      cleanupWebhookRateLimitBuckets().catch(() => 0),
    ]).catch(async (error) => {
      console.error("AP3K_WEBHOOK_BACKGROUND_ERROR", {
        message: error instanceof Error ? error.message : String(error),
        routeVersion: WEBHOOK_ROUTE_VERSION,
      });
      await createWebhookEvent({
        eventType: "WEBHOOK_BACKGROUND_ERROR",
        eventSource: "META_REAL",
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : String(error),
        payload: { routeVersion: WEBHOOK_ROUTE_VERSION },
      }).catch(() => undefined);
    });

    if (process.env.VERCEL === "1") {
      waitUntil(backgroundProcessing);
    } else {
      await backgroundProcessing;
    }

    return ok();
  } catch (error) {
    // PHASE 3 — Add route error capture
    console.error("AP3K_WEBHOOK_ROUTE_ERROR", {
      message: error instanceof Error ? error.message : String(error),
      routeVersion: WEBHOOK_ROUTE_VERSION,
    });
    try {
      await createWebhookEvent({
        eventType: "WEBHOOK_ROUTE_ERROR",
        eventSource: "META_REAL",
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : String(error),
        payload: {
          routeVersion: WEBHOOK_ROUTE_VERSION,
          stack: error instanceof Error ? error.stack?.split("\n")[0] : undefined,
        },
      });
    } catch {
      // Non-critical
    }
    // Never return 5xx to Meta — always acknowledge receipt
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
      const valueIgAccountId: string | undefined =
        change.instagram_id ??
        change.ig_id ??
        change.account_id ??
        change.media?.owner?.id ??
        change.media?.owner_id ??
        undefined;

      await createWebhookEvent({
        eventType: "COMMENT_WEBHOOK_RECEIVED",
        eventSource: "META_REAL",
        field: changeItem.field,
        igAccountId: pageId,
        igUserId: commenterId,
        mediaId,
        commentId,
        status: "RECEIVED",
        payload: {
          entryId: entry?.id,
          igAccountId: pageId,
          valueIgAccountId,
          mediaId,
          commentId,
          commenterId,
          commenterUsername,
          hasCommentText: Boolean(commentText),
          object: envelope?.object,
          changesCount: changes.length,
        },
      });

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
          commenterUsername,
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
        console.warn("[webhook] Instagram comment parse failed — missing fields", {
          field: changeItem.field,
          missing,
          valueKeys: change ? Object.keys(change) : [],
        });
        await updateWebhookEvent(webhookEvent.id, {
          eventType: "COMMENT_PARSE_FAILED",
          status: "IGNORED",
          errorMessage: `missing_required_comment_fields:${missing}`,
          processedAt: new Date(),
        });
        continue;
      }

      const commentDiagnostics = {
        object: envelope?.object,
        field: changeItem.field,
        entryId: entry?.id,
        mediaId,
        commentId,
        commenterId,
        rawCommentText: commentText,
        normalizedCommentText: normalizeMatchText(commentText),
        commenterUsername,
      };

      // 1. Find active automations for this post, then select by trigger.
      const match = await findAutomationForCommentWithReason(mediaId, pageId, {
        object: envelope?.object,
        igAccountId: valueIgAccountId,
        commentText,
      });
      const candidateAutomations = match.automations?.length
        ? match.automations
        : match.automation
          ? [match.automation]
          : [];
      const triggerDecisions = candidateAutomations.map((candidate) => {
        const matchedKeyword = resolveCommentTriggerMatch({
          text: commentText,
          keywords: candidate.keywords,
          mode: candidate.matchingMode,
          triggerMode: candidate.triggerMode,
        });
        return { automation: candidate, matchedKeyword };
      });
      const selectedDecision = triggerDecisions.find((decision) => Boolean(decision.matchedKeyword));
      const automation = selectedDecision?.automation ?? candidateAutomations[0] ?? null;
      const matchedKeyword = selectedDecision?.matchedKeyword ?? null;
      const triggerDiagnostics = {
        ...commentDiagnostics,
        matchedIntegrationId:
          match.diagnostics && typeof match.diagnostics === "object"
            ? (match.diagnostics as any).matchedIntegrationId
            : undefined,
        matchedAutomationIds: candidateAutomations.map((candidate) => candidate.id),
        triggerDecisions: triggerDecisions.map(({ automation: candidate, matchedKeyword }) => ({
          automationId: candidate.id,
          automationName: candidate.name,
          automationActive: candidate.active,
          triggerMode: candidate.triggerMode,
          matchingMode: candidate.matchingMode,
          storedKeywords: candidate.keywords.map((keyword) => keyword.word),
          normalizedKeywords: candidate.keywords.map((keyword) => normalizeMatchText(keyword.word)),
          storedPostIds: candidate.posts?.map((post) => post.postid) ?? [],
          matchedKeyword,
          noMatchReason: matchedKeyword ? undefined : "no_keyword_match",
        })),
      };
      await mergeWebhookEventPayload(webhookEvent.id, {
        mediaMatching: match.diagnostics,
        triggerMatching: triggerDiagnostics,
      });
      if (!automation?.listener) {
        const failureReason = match.failureReason ?? "no_active_automation_for_media";
        const publicReplySkipReason = failureReason === "keyword_mismatch"
          ? PUBLIC_REPLY_SKIPPED_KEYWORD_MISMATCH
          : failureReason === "no_active_automation_for_media"
            ? PUBLIC_REPLY_SKIPPED_MEDIA_MISMATCH
            : failureReason;
        const wouldHaveMatchedCampaign = failureReason === "keyword_mismatch";
        const matchedIntegrationId =
          match.diagnostics && typeof match.diagnostics === "object"
            ? (match.diagnostics as any).matchedIntegrationId
            : undefined;
        const matchedOwnerUserId =
          match.diagnostics && typeof match.diagnostics === "object"
            ? (match.diagnostics as any).matchedIntegrationOwnerUserId
            : undefined;
        await createWebhookEvent({
          eventType: match.failureReason === "no_matching_integration"
            ? "INTEGRATION_MATCH_FAILED"
            : match.failureReason === "ambiguous"
              ? "AMBIGUOUS_INTEGRATION_MATCH"
              : "AUTOMATION_MATCH_FAILED",
          eventSource: "META_REAL",
          field: changeItem.field,
          igAccountId: pageId,
          igUserId: commenterId,
          mediaId,
          commentId,
          status: "IGNORED",
          errorMessage: publicReplySkipReason,
          payload: {
            entryId: entry?.id,
            igAccountId: pageId,
            mediaId,
            commentId,
            commenterId,
            commenterUsername,
            commentTextPresent: Boolean(commentText),
            commentText: commentText.slice(0, 180),
            integrationId: matchedIntegrationId,
            ownerUserId: matchedOwnerUserId,
            reason: publicReplySkipReason,
            matchFailureReason: failureReason,
            wouldHaveMatchedCampaign,
            whyNoPublicReply: publicReplySkipReason,
            diagnostics: match.diagnostics,
          },
        });
        console.log("[webhook] automation match failed", {
          mediaId,
          pageId,
          failureReason,
        });
        await updateWebhookEvent(webhookEvent.id, {
          status: "IGNORED",
          errorMessage: publicReplySkipReason,
          processedAt: new Date(),
        });
        continue;
      }

      const matchedIntegrationId =
        match.diagnostics && typeof match.diagnostics === "object"
          ? (match.diagnostics as any).matchedIntegrationId
          : undefined;
      const integrationRaw = selectIntegrationForWebhook(
        automation.User?.integrations,
        pageId,
        matchedIntegrationId
      );
      const selfComment = getSelfCommentReason({
        commenterId,
        commenterUsername,
        igAccountId: pageId,
        integration: integrationRaw,
        diagnostics: match.diagnostics,
      });
      if (selfComment) {
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "IGNORED",
          errorMessage: PUBLIC_REPLY_SKIPPED_SELF_COMMENT,
          processedAt: new Date(),
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "SELF_COMMENT_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          meta: {
            reason: PUBLIC_REPLY_SKIPPED_SELF_COMMENT,
            legacyReason: "self_comment_author",
            wouldHaveMatchedCampaign: Boolean(matchedKeyword),
            whyNoPublicReply: PUBLIC_REPLY_SKIPPED_SELF_COMMENT,
            matchedBy: selfComment,
            commenterId,
            commenterUsername,
            igAccountId: pageId,
            integrationId: integrationRaw?.id,
            integrationInstagramId: integrationRaw?.instagramId,
            integrationWebhookAccountId: integrationRaw?.webhookAccountId,
            integrationUsername: integrationRaw?.instagramUsername,
            commentId,
            mediaId,
          },
        });

        // Any Comment campaigns can loop if the account owner comments on their own post.
        // Pause only when self-comment skips accumulate past the threshold within 10 min.
        // Skip this in App Review Mode (self-comments are expected during reviewer testing).
        // Keyword campaigns are intentional; never pause them for self-comment activity.
        if (automation.triggerMode === "ANY_COMMENT" && !isAppReviewMode()) {
   mmentText && "comment_text",
        ].filter(Boolean).join(",");
        console.warn("[webhook] Instagram comment parse failed — missing fields", {
          field: changeItem.field,
          missing,
          valueKeys: change ? Object.keys(change) : [],
        });
        await updateWebhookEvent(webhookEvent.id, {
          eventType: "COMMENT_PARSE_FAILED",
          status: "IGNORED",
          errorMessage: `missing_required_comment_fields:${missing}`,
          processedAt: new Date(),
        });
        continue;
      }

      const commentDiagnostics = {
        object: envelope?.object,
        field: changeItem.field,
        entryId: entry?.id,
        mediaId,
        commentId,
        commenterId,
        rawCommentText: commentText,
        normalizedCommentText: normalizeMatchText(commentText),
        commenterUsername,
      };

      // 1. Find active automations for this post, then select by trigger.
      const match = await findAutomationForCommentWithReason(mediaId, pageId, {
        object: envelope?.object,
        igAccountId: valueIgAccountId,
        commentText,
      });
      const candidateAutomations = match.automations?.length
        ? match.automations
        : match.automation
          ? [match.automation]
          : [];
      const triggerDecisions = candidateAutomations.map((candidate) => {
        const matchedKeyword = resolveCommentTriggerMatch({
          text: commentText,
          keywords: candidate.keywords,
          mode: candidate.matchingMode,
          triggerMode: candidate.triggerMode,
        });
        return { automation: candidate, matchedKeyword };
      });
      const selectedDecision = triggerDecisions.find((decision) => Boolean(decision.matchedKeyword));
      const automation = selectedDecision?.automation ?? candidateAutomations[0] ?? null;
      const matchedKeyword = selectedDecision?.matchedKeyword ?? null;
      const triggerDiagnostics = {
        ...commentDiagnostics,
        matchedIntegrationId:
          match.diagnostics && typeof match.diagnostics === "object"
            ? (match.diagnostics as any).matchedIntegrationId
            : undefined,
        matchedAutomationIds: candidateAutomations.map((candidate) => candidate.id),
        triggerDecisions: triggerDecisions.map(({ automation: candidate, matchedKeyword }) => ({
          automationId: candidate.id,
          automationName: candidate.name,
          automationActive: candidate.active,
          triggerMode: candidate.triggerMode,
          matchingMode: candidate.matchingMode,
          storedKeywords: candidate.keywords.map((keyword) => keyword.word),
          normalizedKeywords: candidate.keywords.map((keyword) => normalizeMatchText(keyword.word)),
          storedPostIds: candidate.posts?.map((post) => post.postid) ?? [],
          matchedKeyword,
          noMatchReason: matchedKeyword ? undefined : "no_keyword_match",
        })),
      };
      await mergeWebhookEventPayload(webhookEvent.id, {
        mediaMatching: match.diagnostics,
        triggerMatching: triggerDiagnostics,
      });
      if (!automation?.listener) {
        const failureReason = match.failureReason ?? "no_active_automation_for_media";
        const publicReplySkipReason = failureReason === "keyword_mismatch"
          ? PUBLIC_REPLY_SKIPPED_KEYWORD_MISMATCH
          : failureReason === "no_active_automation_for_media"
            ? PUBLIC_REPLY_SKIPPED_MEDIA_MISMATCH
            : failureReason;
        const wouldHaveMatchedCampaign = failureReason === "keyword_mismatch";
        const matchedIntegrationId =
          match.diagnostics && typeof match.diagnostics === "object"
            ? (match.diagnostics as any).matchedIntegrationId
            : undefined;
        const matchedOwnerUserId =
          match.diagnostics && typeof match.diagnostics === "object"
            ? (match.diagnostics as any).matchedIntegrationOwnerUserId
            : undefined;
        await createWebhookEvent({
          eventType: match.failureReason === "no_matching_integration"
            ? "INTEGRATION_MATCH_FAILED"
            : match.failureReason === "ambiguous"
              ? "AMBIGUOUS_INTEGRATION_MATCH"
              : "AUTOMATION_MATCH_FAILED",
          eventSource: "META_REAL",
          field: changeItem.field,
          igAccountId: pageId,
          igUserId: commenterId,
          mediaId,
          commentId,
          status: "IGNORED",
          errorMessage: publicReplySkipReason,
          payload: {
            entryId: entry?.id,
            igAccountId: pageId,
            mediaId,
            commentId,
            commenterId,
            commenterUsername,
            commentTextPresent: Boolean(commentText),
            commentText: commentText.slice(0, 180),
            integrationId: matchedIntegrationId,
            ownerUserId: matchedOwnerUserId,
            reason: publicReplySkipReason,
            matchFailureReason: failureReason,
            wouldHaveMatchedCampaign,
            whyNoPublicReply: publicReplySkipReason,
            diagnostics: match.diagnostics,
          },
        });
        console.log("[webhook] automation match failed", {
          mediaId,
          pageId,
          failureReason,
        });
        await updateWebhookEvent(webhookEvent.id, {
          status: "IGNORED",
          errorMessage: publicReplySkipReason,
          processedAt: new Date(),
        });
        continue;
      }

      const matchedIntegrationId =
        match.diagnostics && typeof match.diagnostics === "object"
          ? (match.diagnostics as any).matchedIntegrationId
          : undefined;
      const integrationRaw = selectIntegrationForWebhook(
        automation.User?.integrations,
        pageId,
        matchedIntegrationId
      );
      const selfComment = getSelfCommentReason({
        commenterId,
        commenterUsername,
        igAccountId: pageId,
        integration: integrationRaw,
        diagnostics: match.diagnostics,
      });
      if (selfComment) {
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "IGNORED",
          errorMessage: PUBLIC_REPLY_SKIPPED_SELF_COMMENT,
          processedAt: new Date(),
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "SELF_COMMENT_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          meta: {
            reason: PUBLIC_REPLY_SKIPPED_SELF_COMMENT,
            legacyReason: "self_comment_author",
            wouldHaveMatchedCampaign: Boolean(matchedKeyword),
            whyNoPublicReply: PUBLIC_REPLY_SKIPPED_SELF_COMMENT,
            matchedBy: selfComment,
            commenterId,
            commenterUsername,
            igAccountId: pageId,
            integrationId: integrationRaw?.id,
            integrationInstagramId: integrationRaw?.instagramId,
            integrationWebhookAccountId: integrationRaw?.webhookAccountId,
            integrationUsername: integrationRaw?.instagramUsername,
            commentId,
            mediaId,
          },
        });

        // Any Comment campaigns can loop if the account owner comments on their own post.
        // Pause only when self-comment skips accumulate past the threshold within 10 min.
        // Skip this in App Review Mode (self-comments are expected during reviewer testing).
        // Keyword campaigns are intentional; never pause them for self-comment activity.
        if (automation.triggerMode === "ANY_COMMENT" && !isAppReviewMode()) {
          const recentSelfCommentSkips = await countRecentSelfCommentSkips(
            automation.id,
            new Date(Date.now() - LOOP_GUARD_MEDIA_WINDOW_MS)
          );
          if (recentSelfCommentSkips >= SELF_COMMENT_PAUSE_THRESHOLD) {
            await pauseAutomationForLoopGuard(automation.id);
            await createAutomationEvent({
              automationId: automation.id,
              eventType: "LOOP_GUARD_PAUSED_CAMPAIGN",
              igUserId: commenterId,
              mediaId,
              commentId,
              meta: {
                reason: "repeated_self_comment_skips",
                message: "Automation paused: repeated self-comment skips detected.",
                recentSelfCommentSkips,
              },
            });
          }
        }

        continue;
      }

      await updateWebhookEvent(webhookEvent.id, {
        automationId: automation.id,
        status: "PROCESSING",
      });

      if (await hasAp3kGeneratedCommentId(automation.id, commentId)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "COMMENT_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          meta: {
            reason: PUBLIC_REPLY_SKIPPED_AP3K_GENERATED_REPLY,
            legacyReason: "ap3k_generated_comment",
            wouldHaveMatchedCampaign: Boolean(matchedKeyword),
            whyNoPublicReply: PUBLIC_REPLY_SKIPPED_AP3K_GENERATED_REPLY,
            commenterId,
            commenterUsername,
            igAccountId: pageId,
            integrationId: integrationRaw?.id,
            integrationInstagramId: integrationRaw?.instagramId,
            commentId,
            mediaId,
          },
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "IGNORED",
          errorMessage: PUBLIC_REPLY_SKIPPED_AP3K_GENERATED_REPLY,
          processedAt: new Date(),
        });
        continue;
      }

      if (await hasProcessedCommentWebhook(automation.id, commentId, webhookEvent.id)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DUPLICATE_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword ?? undefined,
          meta: {
            reason: PUBLIC_REPLY_SKIPPED_DUPLICATE_COMMENT,
            legacyReason: "duplicate_comment_webhook",
            wouldHaveMatchedCampaign: Boolean(matchedKeyword),
            whyNoPublicReply: PUBLIC_REPLY_SKIPPED_DUPLICATE_COMMENT,
            commenterId,
            commenterUsername,
            igAccountId: pageId,
            commentId,
            mediaId,
          },
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "IGNORED",
          errorMessage: PUBLIC_REPLY_SKIPPED_DUPLICATE_COMMENT,
          processedAt: new Date(),
        });
        continue;
      }

      await createAutomationEvent({
        automationId: automation.id,
        eventType: "WEBHOOK_RECEIVED",
        igUserId: commenterId,
        mediaId,
        commentId,
        meta: {
          ...commentDiagnostics,
          dryRun: envelope.dryRun,
          automationId: automation.id,
          automationName: automation.name,
          automationActive: automation.active,
          triggerMode: automation.triggerMode,
          matchingMode: automation.matchingMode,
          storedKeywords: automation.keywords.map((keyword) => keyword.word),
          normalizedKeywords: automation.keywords.map((keyword) => normalizeMatchText(keyword.word)),
          storedPostIds: automation.posts?.map((post) => post.postid) ?? [],
          commenterUsername,
          commentText,
        },
      });

      if (!matchedKeyword) {
        console.log(`[webhook] automation match: none (automationId=${automation.id} mode=${automation.matchingMode})`);
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "NO_MATCH",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: commentText.slice(0, 100),
          meta: {
            ...commentDiagnostics,
            dryRun: envelope.dryRun,
            automationId: automation.id,
            automationName: automation.name,
            automationActive: automation.active,
            triggerMode: automation.triggerMode,
            matchingMode: automation.matchingMode,
            storedKeywords: automation.keywords.map((keyword) => keyword.word),
            normalizedKeywords: automation.keywords.map((keyword) => normalizeMatchText(keyword.word)),
            storedPostIds: automation.posts?.map((post) => post.postid) ?? [],
            noMatchReason: "no_keyword_match",
            reason: PUBLIC_REPLY_SKIPPED_KEYWORD_MISMATCH,
            wouldHaveMatchedCampaign: false,
            whyNoPublicReply: PUBLIC_REPLY_SKIPPED_KEYWORD_MISMATCH,
            commenterUsername,
            commentText,
          },
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "PROCESSED",
          errorMessage: PUBLIC_REPLY_SKIPPED_KEYWORD_MISMATCH,
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
        meta: {
          ...commentDiagnostics,
          dryRun: envelope.dryRun,
          automationId: automation.id,
          automationName: automation.name,
          triggerMode: automation.triggerMode,
          matchingMode: automation.matchingMode,
          commenterUsername,
          commentText,
        },
      });

      // 3. Log comment received
      await createAutomationEvent({
        automationId: automation.id,
        eventType: "COMMENT_RECEIVED",
        igUserId: commenterId,
        mediaId,
        commentId,
        keyword: matchedKeyword,
        meta: {
          commenterUsername,
          commentText,
          dryRun: envelope.dryRun,
        },
      });

      if (envelope.dryRun) {
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "PROCESSED",
          errorMessage: "dry_run_skipped_actions",
          processedAt: new Date(),
        });
        continue;
      }

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
          meta: {
            reason: PUBLIC_REPLY_SKIPPED_DUPLICATE_COMMENT,
            legacyReason: "duplicate_comment_webhook",
            wouldHaveMatchedCampaign: true,
            whyNoPublicReply: PUBLIC_REPLY_SKIPPED_DUPLICATE_COMMENT,
          },
        });
        await updateWebhookEvent(webhookEvent.id, {
          automationId: automation.id,
          status: "PROCESSED",
          errorMessage: PUBLIC_REPLY_SKIPPED_DUPLICATE_COMMENT,
          processedAt: new Date(),
        });
        continue;
      }

      const listener = automation.listener;
      const replyVariants = [
        listener.commentReply,
        listener.commentReply2,
        listener.commentReply3,
      ].filter(Boolean) as string[];
      const aiReplyEnabled = listener.aiReplyEnabled === true;
      const publicReplyEnabled = aiReplyEnabled || replyVariants.length > 0;
      const privateDmEnabled = automation.sendPrivateDm !== false;

      if (!publicReplyEnabled) {
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "COMMENT_REPLY",
          status: "SKIPPED",
          errorMessage: "public_reply_disabled",
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "COMMENT_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
          meta: {
            reason: "public_reply_disabled",
            publicReplyEnabled: false,
            wouldHaveMatchedCampaign: true,
            whyNoPublicReply: "publi