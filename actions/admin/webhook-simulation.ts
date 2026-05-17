"use server";

import {
  createWebhookEvent,
  findAutomationForCommentWithReason,
  mergeWebhookEventPayload,
} from "@/actions/webhook/queries";
import { requireOwnerAdmin } from "@/lib/admin";
import { normalizeMatchText, resolveCommentTriggerMatch } from "@/lib/matching";
import { revalidatePath } from "next/cache";
import { client } from "@/lib/prisma";

export async function simulateCommentWebhook(formData: FormData) {
  await requireOwnerAdmin();

  const automationId = String(formData.get("automationId") ?? "").trim();
  const mediaId = String(formData.get("mediaId") ?? "").trim() || "SIMULATED_MEDIA";
  const commentId = String(formData.get("commentId") ?? "").trim() || `sim_${Date.now()}`;
  const commenterId = String(formData.get("commenterId") ?? "").trim() || "simulated_commenter";
  const text = String(formData.get("commentText") ?? formData.get("text") ?? "").trim() || "ai";

  if (!automationId) {
    return;
  }

  const automation = await client.automation.findUnique({
    where: { id: automationId },
    include: {
      keywords: true,
      posts: true,
      listener: true,
      User: {
        select: {
          integrations: {
            select: {
              id: true,
              instagramId: true,
              webhookAccountId: true,
              pageId: true,
              businessId: true,
            },
          },
        },
      },
    },
  });

  if (!automation) return;

  const integration = automation.User?.integrations?.[0];
  const pageId =
    integration?.webhookAccountId ??
    integration?.instagramId ??
    integration?.businessId ??
    integration?.pageId ??
    "SIMULATED_ACCOUNT";

  const webhookEvent = await createWebhookEvent({
    eventSource: "SIMULATED_INTERNAL",
    eventType: "SIMULATED_COMMENT_MATCH_DECISION",
    field: "comments",
    igAccountId: pageId,
    igUserId: commenterId,
    mediaId,
    commentId,
    payload: {
      simulation: true,
      object: "page",
      entryId: pageId,
      field: "comments",
      changesCount: 1,
      hasValue: true,
      valueKeys: ["id", "media", "from", "text"],
      hasMediaId: true,
      hasCommentId: true,
      hasFromId: true,
      hasText: true,
      mediaId,
      commentId,
      pageId,
      automationId,
      rawCommentText: text,
      normalizedCommentText: normalizeMatchText(text),
    },
  });

  const match = await findAutomationForCommentWithReason(mediaId, pageId);
  const matchingCandidate = match.automations.find((candidate) => candidate.id === automation.id);
  const matchedKeyword = matchingCandidate ? resolveCommentTriggerMatch({
    text,
    keywords: automation.keywords,
    mode: automation.matchingMode,
    triggerMode: automation.triggerMode,
  }) : null;
  const noMatchReason = !matchingCandidate
    ? match.failureReason ?? "no_active_automation_for_media"
    : !matchedKeyword
      ? "no_keyword_match"
      : undefined;

  await mergeWebhookEventPayload(webhookEvent.id, {
    simulationSafeMode: true,
    sendsRealDm: false,
    automationId: automation.id,
    mediaMatching: match.diagnostics,
    simulationResult: matchedKeyword ? "trigger_matched" : noMatchReason,
    integrationMatched: Boolean((match.diagnostics as any).matchingIntegrationFound),
    postMatched: Boolean(matchingCandidate),
    triggerMatched: Boolean(matchedKeyword),
    matchedKeyword,
    noMatchReason,
    triggerMatching: {
      automationId: automation.id,
      automationName: automation.name,
      automationActive: automation.active,
      triggerMode: automation.triggerMode,
      matchingMode: automation.matchingMode,
      storedKeywords: automation.keywords.map((keyword) => keyword.word),
      normalizedKeywords: automation.keywords.map((keyword) => normalizeMatchText(keyword.word)),
      storedPostIds: automation.posts.map((post) => post.postid),
      matchedKeyword,
      noMatchReason,
    },
  });

  revalidatePath("/admin");
}

export async function replaySavedWebhookEvent(formData: FormData) {
  await requireOwnerAdmin();

  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) return;

  const event = await client.webhookEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      eventSource: true,
      igAccountId: true,
      mediaId: true,
      commentId: true,
      igUserId: true,
      automationId: true,
      payload: true,
    },
  });

  if (!event || event.eventSource !== "META_REAL" || !event.automationId) return;

  const payload =
    event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
      ? (event.payload as Record<string, unknown>)
      : {};

  const replayForm = new FormData();
  replayForm.set("automationId", event.automationId);
  replayForm.set("mediaId", event.mediaId ?? String(payload.mediaId ?? "REPLAY_MEDIA"));
  replayForm.set("commentId", event.commentId ?? `replay_${event.id}`);
  replayForm.set("commenterId", event.igUserId ?? String(payload.fromId ?? "replay_commenter"));
  replayForm.set("commentText", String(payload.rawCommentText ?? payload.commentText ?? payload.text ?? "ai"));

  await simulateCommentWebhook(replayForm);
}
