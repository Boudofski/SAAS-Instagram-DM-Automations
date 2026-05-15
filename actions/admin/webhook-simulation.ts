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

export async function simulateCommentWebhook(formData: FormData) {
  await requireOwnerAdmin();

  const igAccountId = String(formData.get("igAccountId") ?? "").trim();
  const mediaId = String(formData.get("mediaId") ?? "").trim() || "SIMULATED_MEDIA";
  const commentId = String(formData.get("commentId") ?? "").trim() || `sim_${Date.now()}`;
  const commenterId = String(formData.get("commenterId") ?? "").trim() || "simulated_commenter";
  const text = String(formData.get("text") ?? "").trim() || "ai";

  if (!igAccountId) {
    return;
  }

  const webhookEvent = await createWebhookEvent({
    eventType: "REAL_COMMENT_EVENT",
    field: "comments",
    igAccountId,
    igUserId: commenterId,
    mediaId,
    commentId,
    payload: {
      simulation: true,
      object: "instagram",
      entryId: igAccountId,
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
      igAccountId,
    },
  });

  const match = await findAutomationForCommentWithReason(mediaId, igAccountId);
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
