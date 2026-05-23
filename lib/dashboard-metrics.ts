import { client } from "@/lib/prisma";

export const MATCHED_EVENT_TYPES = ["KEYWORD_MATCHED"] as const;
export const REAL_COMMENT_WEBHOOK_TYPES = ["REAL_COMMENT_EVENT", "COMMENT_WEBHOOK_RECEIVED"] as const;

type DateRange = {
  gte?: Date;
  lt?: Date;
};

export type DashboardMetrics = {
  commentsReceived: number;
  commentsMatched: number;
  publicRepliesSent: number;
  dmsSent: number;
  dmsFailed: number;
  dmsSkipped: number;
  leadsCaptured: number;
  replyRate: number;
  staticRepliesUsed: number;
  aiRepliesUsed: number;
  activeCampaigns: number;
  connectedAccounts: number;
  lastRealCommentAt: Date | null;
  lastPublicReplyAt: Date | null;
  lastDmAt: Date | null;
};

export type CampaignTableMetric = {
  automationId: string;
  runs: number;
  leads: number;
};

export function formatReplyRate(commentsMatched: number, repliesSent: number) {
  if (commentsMatched <= 0 || !Number.isFinite(commentsMatched) || !Number.isFinite(repliesSent)) return 0;
  return Math.min(100, Math.max(0, Math.round((repliesSent / commentsMatched) * 100)));
}

export function getDashboardGreeting(input: {
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  clerkId?: string | null;
}) {
  const name = [input.firstname, input.lastname].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (input.email) return input.email.split("@")[0] || "there";
  return "there";
}

function rangeWhere(range?: DateRange) {
  if (!range?.gte && !range?.lt) return {};
  return { createdAt: { ...(range.gte ? { gte: range.gte } : {}), ...(range.lt ? { lt: range.lt } : {}) } };
}

function automationUserWhere(userId: string, range?: DateRange) {
  return {
    automation: { userId },
    ...rangeWhere(range),
  };
}

export async function getUserDashboardMetrics(userId: string, range?: DateRange): Promise<DashboardMetrics> {
  const whereByUser = automationUserWhere(userId, range);
  const webhookWhere = {
    automation: { userId },
    eventType: { in: [...REAL_COMMENT_WEBHOOK_TYPES] },
    ...rangeWhere(range),
  };

  const [
    commentsReceived,
    commentsMatched,
    publicReplyLogs,
    publicReplyFallbackEvents,
    dmsSent,
    dmsFailed,
    dmsSkippedLogs,
    dmsSkippedEvents,
    leadsCaptured,
    activeCampaigns,
    connectedAccounts,
    lastRealComment,
    lastPublicReplyLog,
    lastPublicReplyEvent,
    lastDm,
  ] = await Promise.all([
    client.webhookEvent.count({ where: webhookWhere }),
    client.automationEvent.count({
      where: { ...whereByUser, eventType: { in: [...MATCHED_EVENT_TYPES] } },
    }),
    client.messageLog.count({
      where: { ...whereByUser, messageType: "COMMENT_REPLY", status: "SENT" },
    }),
    client.automationEvent.count({
      where: { ...whereByUser, eventType: "PUBLIC_REPLY_SENT" },
    }),
    client.messageLog.count({
      where: { ...whereByUser, messageType: "DM", status: "SENT" },
    }),
    client.messageLog.count({
      where: { ...whereByUser, messageType: "DM", status: "FAILED" },
    }),
    client.messageLog.count({
      where: { ...whereByUser, messageType: "DM", status: "SKIPPED" },
    }),
    client.automationEvent.count({
      where: { ...whereByUser, eventType: "DM_SKIPPED" },
    }),
    client.lead.count({ where: { automation: { userId }, ...rangeWhere(range) } }),
    client.automation.count({ where: { userId, active: true } }),
    client.integrations.count({ where: { userId } }),
    client.webhookEvent.findFirst({
      where: webhookWhere,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    client.messageLog.findFirst({
      where: { ...whereByUser, messageType: "COMMENT_REPLY", status: "SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    client.automationEvent.findFirst({
      where: { ...whereByUser, eventType: "PUBLIC_REPLY_SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    client.messageLog.findFirst({
      where: { ...whereByUser, messageType: "DM", status: "SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const publicRepliesSent = publicReplyLogs + (publicReplyLogs > 0 ? 0 : publicReplyFallbackEvents);
  const staticRepliesUsed = publicRepliesSent + dmsSent;
  const lastPublicReplyAt =
    lastPublicReplyLog?.createdAt && lastPublicReplyEvent?.createdAt
      ? lastPublicReplyLog.createdAt > lastPublicReplyEvent.createdAt
        ? lastPublicReplyLog.createdAt
        : lastPublicReplyEvent.createdAt
      : lastPublicReplyLog?.createdAt ?? lastPublicReplyEvent?.createdAt ?? null;

  return {
    commentsReceived,
    commentsMatched,
    publicRepliesSent,
    dmsSent,
    dmsFailed,
    dmsSkipped: dmsSkippedLogs + (dmsSkippedLogs > 0 ? 0 : dmsSkippedEvents),
    leadsCaptured,
    replyRate: formatReplyRate(commentsMatched, publicRepliesSent + dmsSent),
    staticRepliesUsed,
    aiRepliesUsed: 0,
    activeCampaigns,
    connectedAccounts,
    lastRealCommentAt: lastRealComment?.createdAt ?? null,
    lastPublicReplyAt,
    lastDmAt: lastDm?.createdAt ?? null,
  };
}

export async function getCampaignTableMetrics(userId: string): Promise<Record<string, CampaignTableMetric>> {
  const [runs, leads] = await Promise.all([
    client.automationEvent.groupBy({
      by: ["automationId"],
      where: {
        automation: { userId },
        eventType: { in: [...MATCHED_EVENT_TYPES] },
      },
      _count: { _all: true },
    }),
    client.lead.groupBy({
      by: ["automationId"],
      where: { automation: { userId } },
      _count: { _all: true },
    }),
  ]);

  const metrics: Record<string, CampaignTableMetric> = {};
  for (const row of runs) {
    metrics[row.automationId] = {
      automationId: row.automationId,
      runs: row._count._all,
      leads: 0,
    };
  }
  for (const row of leads) {
    metrics[row.automationId] = {
      automationId: row.automationId,
      runs: metrics[row.automationId]?.runs ?? 0,
      leads: row._count._all,
    };
  }
  return metrics;
}

export async function getUserUsageSummary(userId: string, range: DateRange) {
  return getUserDashboardMetrics(userId, range);
}

export async function getIntegrationHealth(userId: string) {
  const integration = await client.integrations.findFirst({
    where: { userId },
    select: {
      instagramId: true,
      pageId: true,
      webhookAccountId: true,
      createdAt: true,
      webhookSubscriptionLastAttemptedAt: true,
    },
  });

  const accountIds = [
    integration?.pageId,
    integration?.instagramId,
    integration?.webhookAccountId,
  ].filter(Boolean) as string[];

  const where = {
    eventType: { in: [...REAL_COMMENT_WEBHOOK_TYPES] },
    OR: [
      { automation: { userId } },
      ...(accountIds.length > 0 ? [{ igAccountId: { in: accountIds } }] : []),
    ],
  };

  const lastRealComment = await client.webhookEvent.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    select: { eventType: true, status: true, field: true, errorMessage: true, createdAt: true },
  });

  return {
    lastRealComment,
    commentDeliveryActive: Boolean(lastRealComment),
  };
}

export async function getCampaignDetailMetrics(automationId: string, userId: string) {
  const [runs, leads, publicRepliesSent, dmsSent, dmsFailed, dmsSkipped] = await Promise.all([
    client.automationEvent.count({
      where: { automationId, automation: { userId }, eventType: { in: [...MATCHED_EVENT_TYPES] } },
    }),
    client.lead.count({ where: { automationId, automation: { userId } } }),
    client.messageLog.count({
      where: { automationId, automation: { userId }, messageType: "COMMENT_REPLY", status: "SENT" },
    }),
    client.messageLog.count({
      where: { automationId, automation: { userId }, messageType: "DM", status: "SENT" },
    }),
    client.messageLog.count({
      where: { automationId, automation: { userId }, messageType: "DM", status: "FAILED" },
    }),
    client.messageLog.count({
      where: { automationId, automation: { userId }, messageType: "DM", status: "SKIPPED" },
    }),
  ]);

  return {
    automationId,
    runs,
    leads,
    publicRepliesSent,
    dmsSent,
    dmsFailed,
    dmsSkipped,
    replyRate: formatReplyRate(runs, publicRepliesSent + dmsSent),
  };
}
