"use server";

import {
  createAutomationEvent,
  createMessageLog,
  createWebhookEvent,
  findAutomationForCommentWithReason,
  mergeWebhookEventPayload,
  upsertLead,
} from "@/actions/webhook/queries";
import { requireOwnerAdmin } from "@/lib/admin";
import { matchKeywordWithMode } from "@/lib/matching";
import { revalidatePath } from "next/cache";
import { client } from "@/lib/prisma";

export async function simulateCommentWebhook(formData: FormData) {
  await requireOwnerAdmin();

  const pageId = String(formData.get("igAccountId") ?? "").trim();
  const mediaId = String(formData.get("mediaId") ?? "").trim() || "SIMULATED_MEDIA";
  const commentId = String(formData.get("commentId") ?? "").trim() || `sim_${Date.now()}`;
  const commenterId = String(formData.get("commenterId") ?? "").trim() || "simulated_commenter";
  const text = String(formData.get("text") ?? "").trim() || "ai";

  if (!pageId) {
    return;
  }

  const webhookEvent = await createWebhookEvent({
    eventSource: "SIMULATED_INTERNAL",
    eventType: "SIMULATED_COMMENT_EVENT",
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
    },
  });

  const match = await findAutomationForCommentWithReason(mediaId, pageId);
  await mergeWebhookEventPayload(webhookEvent.id, {
    mediaMatching: match.diagnostics,
  });

  if (!match.automation?.listener) {
    await mergeWebhookEventPayload(webhookEvent.id, {
      simulationResult: match.failureReason ?? "no_active_automation_for_media",
    });
    revalidatePath("/admin");
    return;
  }

  const automation = match.automation;
  await createAutomationEvent({
    automationId: automation.id,
    eventType: "WEBHOOK_RECEIVED",
    igUserId: commenterId,
    mediaId,
    commentId,
    meta: { simulation: true },
  });

  const matchedKeyword = matchKeywordWithMode(
    text,
    automation.keywords,
    automation.matchingMode
  );

  if (!matchedKeyword) {
    await createAutomationEvent({
      automationId: automation.id,
      eventType: "NO_MATCH",
      igUserId: commenterId,
      mediaId,
      commentId,
      keyword: text.slice(0, 100),
      meta: { simulation: true },
    });
    await mergeWebhookEventPayload(webhookEvent.id, {
      automationId: automation.id,
      simulationResult: "no_keyword_match",
    });
    revalidatePath("/admin");
    return;
  }

  await createAutomationEvent({
    automationId: automation.id,
    eventType: "KEYWORD_MATCHED",
    igUserId: commenterId,
    mediaId,
    commentId,
    keyword: matchedKeyword,
    meta: { simulation: true },
  });
  await upsertLead({
    automationId: automation.id,
    igUserId: commenterId,
    igUsername: "simulation",
    commentText: text,
    mediaId,
  });
  await createMessageLog({
    automationId: automation.id,
    recipientIgId: commenterId,
    mediaId,
    commentId,
    messageType: "DM",
    status: "FAILED",
    errorMessage: "simulation_no_meta_send",
  });
  await mergeWebhookEventPayload(webhookEvent.id, {
    automationId: automation.id,
    simulationResult: "dm_failed",
    matchedKeyword,
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
      payload: true,
    },
  });

  if (!event || event.eventSource !== "META_REAL") return;

  const payload =
    event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
      ? (event.payload as Record<string, unknown>)
      : {};

  const replayForm = new FormData();
  replayForm.set("igAccountId", event.igAccountId ?? String(payload.entryId ?? ""));
  replayForm.set("mediaId", event.mediaId ?? String(payload.mediaId ?? "REPLAY_MEDIA"));
  replayForm.set("commentId", event.commentId ?? `replay_${event.id}`);
  replayForm.set("commenterId", event.igUserId ?? String(payload.fromId ?? "replay_commenter"));
  replayForm.set("text", String(payload.commentText ?? payload.text ?? "ai"));

  await simulateCommentWebhook(replayForm);
}
