import { client } from "@/lib/prisma";
import { canSendStaticReply } from "@/actions/usage/queries";
import { createMessageLog, recordOutboundInboxMessage, trackResponse } from "@/actions/webhook/queries";
import { resolveIntegrationSendToken } from "@/lib/send-token";
import { sendInstagramDirectResponse } from "@/lib/instagram-dm";
import { readLinkButtons } from "@/lib/link-buttons";
import { followUpEligible, MESSAGING_WINDOW_MS, messagingWindowOpen, parseEmailReply } from "./automation-engagement-settings";

export async function followUpSchedulerReady(now = new Date()) {
  const heartbeat = await client.automationSchedulerHeartbeat.findUnique({ where: { id: "follow-ups" } });
  return Boolean(heartbeat && now.getTime() >= heartbeat.lastRunAt.getTime() && now.getTime() - heartbeat.lastRunAt.getTime() < 20 * 60_000);
}

export async function cancelPendingFollowUps(integrationId: string, recipientIgId: string, inboundAt: Date) {
  await client.automationEngagementJob.updateMany({
    where: { recipientIgId, kind: "FOLLOW_UP", status: "PENDING", inboundAt: { lt: inboundAt }, automation: { integrationId } },
    data: { status: "CANCELLED" },
  });
}

export async function takeEmailReply(integrationId: string, recipientIgId: string, text: string, inboundAt: Date, messageMid?: string) {
  if (!messagingWindowOpen(inboundAt)) return null;
  if (messageMid && await client.automationEngagementJob.findFirst({ where: { replyMessageId: messageMid, recipientIgId, automation: { integrationId } }, select: { id: true } })) return { kind: "waiting" as const };
  const pending = await client.automationEngagementJob.findFirst({
    where: { recipientIgId, kind: "EMAIL", status: "WAITING", expiresAt: { gt: new Date() }, createdAt: { lte: inboundAt },
      automation: { integrationId, active: true, archivedAt: null, sendPrivateDm: true, listener: { emailCaptureEnabled: true }, User: { status: { not: "SUSPENDED" } }, integration: { status: "CONNECTED", reconnectRequired: false, planLocked: false } } },
    orderBy: { createdAt: "desc" },
  });
  if (!pending) return null;
  const reply = parseEmailReply(text);
  if (reply.kind === "invalid") return { kind: "waiting" as const };
  const claimed = await client.automationEngagementJob.updateMany({ where: { id: pending.id, status: "WAITING" }, data: { status: reply.kind === "stop" ? "CANCELLED" : "PROCESSING", replyMessageId: messageMid } });
  if (!claimed.count || reply.kind === "stop") return { kind: "waiting" as const };
  if (reply.kind === "email") {
    // No marketing subscription is inferred from supplying an email in a DM.
    await client.lead.upsert({
      where: { automationId_igUserId: { automationId: pending.automationId, igUserId: recipientIgId } },
      create: { automationId: pending.automationId, igUserId: recipientIgId, email: reply.email, emailCollectedAt: new Date() },
      update: { email: reply.email, emailCollectedAt: new Date() },
    });
  }
  return { kind: "continue" as const, jobId: pending.id, automationId: pending.automationId, flowId: pending.flowId };
}

export async function beginEmailRequest(automationId: string, recipientIgId: string, flowId: string, inboundAt: Date) {
  const existingLead = await client.lead.findUnique({ where: { automationId_igUserId: { automationId, igUserId: recipientIgId } }, select: { email: true } });
  if (existingLead?.email) return { kind: "complete" as const };
  const existing = await client.automationEngagementJob.findUnique({ where: { automationId_recipientIgId_flowId_kind: { automationId, recipientIgId, flowId, kind: "EMAIL" } } });
  if (existing) return { kind: existing.status === "COMPLETED" ? "complete" as const : "waiting" as const };
  try {
    const job = await client.automationEngagementJob.create({ data: { automationId, recipientIgId, flowId, kind: "EMAIL", dueAt: new Date(), inboundAt, expiresAt: new Date(inboundAt.getTime() + MESSAGING_WINDOW_MS) } });
    // Only the newest request for this account owns the next email reply.
    const automation = await client.automation.findUniqueOrThrow({ where: { id: automationId }, select: { integrationId: true } });
    await client.automationEngagementJob.updateMany({ where: { id: { not: job.id }, recipientIgId, kind: "EMAIL", status: "WAITING", automation: { integrationId: automation.integrationId } }, data: { status: "CANCELLED" } });
    return { kind: "request" as const, jobId: job.id };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return { kind: "waiting" as const };
    throw error;
  }
}

export async function finishEngagementJob(id: string, status: "WAITING" | "COMPLETED" | "FAILED") {
  await client.automationEngagementJob.updateMany({ where: { id, status: { in: ["PENDING", "PROCESSING"] } }, data: { status } });
}

export async function scheduleFollowUp(automationId: string, recipientIgId: string, flowId: string, inboundAt: Date, delayMinutes: number) {
  if (!messagingWindowOpen(inboundAt) || !await followUpSchedulerReady()) return;
  const dueAt = new Date(Date.now() + delayMinutes * 60_000);
  const expiresAt = new Date(inboundAt.getTime() + MESSAGING_WINDOW_MS);
  if (dueAt >= expiresAt) return;
  await client.automationEngagementJob.upsert({
    where: { automationId_recipientIgId_flowId_kind: { automationId, recipientIgId, flowId, kind: "FOLLOW_UP" } },
    create: { automationId, recipientIgId, flowId, kind: "FOLLOW_UP", inboundAt, dueAt, expiresAt }, update: {},
  });
}

export async function processAutomationFollowUps(now = new Date()) {
  await client.automationSchedulerHeartbeat.upsert({ where: { id: "follow-ups" }, create: { id: "follow-ups", lastRunAt: now }, update: { lastRunAt: now } });
  await client.automationEngagementJob.updateMany({ where: { status: { in: ["PENDING", "WAITING"] }, expiresAt: { lte: now } }, data: { status: "CANCELLED" } });
  // A crash after claiming may have happened after Meta accepted the send.
  // Never retry an ambiguous send; fail closed to prevent duplicate reminders.
  await client.automationEngagementJob.updateMany({ where: { status: "PROCESSING", updatedAt: { lt: new Date(now.getTime() - 10 * 60_000) } }, data: { status: "FAILED" } });
  const jobs = await client.automationEngagementJob.findMany({ where: { kind: "FOLLOW_UP", status: "PENDING", dueAt: { lte: now }, expiresAt: { gt: now } }, orderBy: { dueAt: "asc" }, take: 20 });
  let sent = 0;
  for (const job of jobs) {
    const claimed = await client.automationEngagementJob.updateMany({ where: { id: job.id, status: "PENDING" }, data: { status: "PROCESSING" } });
    if (!claimed.count) continue;
    try {
      const automation = await client.automation.findUnique({ where: { id: job.automationId }, include: { listener: true, integration: true, User: { select: { status: true } } } });
      const integration = automation?.integration;
      const listener = automation?.listener;
      const conversation = integration ? await client.conversation.findUnique({ where: { integrationId_recipientIgId: { integrationId: integration.id, recipientIgId: job.recipientIgId } }, select: { lastInboundAt: true, lastMessageAt: true } }) : null;
      const allowed = automation?.active && !automation.archivedAt && automation.sendPrivateDm && automation.User?.status !== "SUSPENDED"
        && listener?.followUpEnabled && listener.followUpMessage?.trim() && integration?.status === "CONNECTED" && !integration.reconnectRequired && !integration.planLocked
        && followUpEligible({ ...job, latestInboundAt: conversation?.lastInboundAt ?? null }, now);
      if (!allowed || !automation?.userId || !integration?.instagramId || !listener) {
        await client.automationEngagementJob.update({ where: { id: job.id }, data: { status: "CANCELLED" } }); continue;
      }
      // A human or another automation already replied after the original delivery.
      const newerOutbound = await client.inboxMessage.findFirst({ where: { conversation: { integrationId: integration.id, recipientIgId: job.recipientIgId }, direction: "OUTBOUND", createdAt: { gt: job.createdAt } }, select: { id: true } });
      const token = resolveIntegrationSendToken(integration);
      if (newerOutbound || !token.ok || !messagingWindowOpen(job.inboundAt) || !(await canSendStaticReply(automation.userId)).ok) {
        await client.automationEngagementJob.update({ where: { id: job.id }, data: { status: "CANCELLED" } }); continue;
      }
      const result = await sendInstagramDirectResponse({ token: token.token, igBusinessAccountId: integration.instagramId, recipientId: job.recipientIgId, automationId: automation.id, message: listener.followUpMessage!, responseFormat: "LINK", linkButtons: readLinkButtons(listener.quickReplies, listener.ctaButtonTitle, listener.ctaLink) });
      // Persist terminal state before secondary bookkeeping.
      await finishEngagementJob(job.id, result.ok ? "COMPLETED" : "FAILED");
      await createMessageLog({ automationId: automation.id, recipientIgId: job.recipientIgId, commentId: job.flowId, messageType: "DM", status: result.ok ? "SENT" : "FAILED", errorMessage: result.ok ? "follow_up_dm_sent" : "follow_up_dm_failed" });
      if (result.ok) {
        sent++;
        await trackResponse(automation.id, "DM");
        await recordOutboundInboxMessage({ userId: automation.userId, integrationId: integration.id, recipientIgId: job.recipientIgId, automationId: automation.id, content: listener.followUpMessage!, metaMessageId: result.messageIds[0] });
      }
    } catch {
      await finishEngagementJob(job.id, "FAILED");
      console.warn("[automation-follow-up] job failed", { jobId: job.id });
    }
  }
  // This table holds operational state, not a permanent recipient history.
  await client.automationEngagementJob.deleteMany({ where: { status: { in: ["COMPLETED", "FAILED", "CANCELLED"] }, updatedAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60_000) } } });
  return { checked: jobs.length, sent };
}
