import { client } from "@/lib/prisma";
import {
  formatReplyRate,
  getPeriodRange,
  percentChange,
  type ChangeSummary,
  type DashboardMetrics,
  type DashboardPeriod,
  type DashboardPeriodRange,
  type DateRange,
} from "@/lib/dashboard-metrics";

const REAL_COMMENT_TYPES = ["REAL_COMMENT_EVENT", "COMMENT_WEBHOOK_RECEIVED", "COMMENT_RECEIVED"] as const;

export type UserFacingMetrics = DashboardMetrics;

export type UserFacingStatsComparison = {
  period: DashboardPeriodRange;
  current: UserFacingMetrics;
  previous: UserFacingMetrics;
  changes: {
    commentsReceived: ChangeSummary;
    commentsMatched: ChangeSummary;
    publicRepliesSent: ChangeSummary;
    staticRepliesUsed: ChangeSummary;
    leadsCaptured: ChangeSummary;
  };
};

function rangeWhere(range?: DateRange) {
  if (!range?.gte && !range?.lt) return {};
  return { createdAt: { ...(range.gte ? { gte: range.gte } : {}), ...(range.lt ? { lt: range.lt } : {}) } };
}

function uniqueCount<T>(rows: T[], getKey: (row: T) => string | null | undefined) {
  const keys = new Set<string>();
  let fallback = 0;
  for (const row of rows) {
    const key = getKey(row);
    if (key) keys.add(key);
    else fallback += 1;
  }
  return keys.size + fallback;
}

function metaRecord(meta: unknown): Record<string, unknown> {
  return meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as Record<string, unknown>) : {};
}

function sourceCommentId(row: { commentId?: string | null; meta?: unknown }) {
  const meta = metaRecord(row.meta);
  return firstString([meta.sourceCommentId, row.commentId]);
}

function publicReplyId(row: { commentId?: string | null; meta?: unknown }) {
  const meta = metaRecord(row.meta);
  return firstString([meta.publicReplyCommentId]);
}

function firstString(values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function getUserFacingMetrics(userId: string, range?: DateRange): Promise<UserFacingMetrics> {
  const byUserAutomation = {
    automation: { userId },
    ...rangeWhere(range),
  };

  const [
    commentRows,
    matchedRows,
    publicReplyLogs,
    publicReplyEvents,
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
    client.webhookEvent.findMany({
      where: {
        automation: { userId },
        eventType: { in: [...REAL_COMMENT_TYPES] },
        commentId: { not: null },
        ...rangeWhere(range),
      },
      select: { id: true, commentId: true },
    }),
    client.automationEvent.findMany({
      where: { ...byUserAutomation, eventType: "KEYWORD_MATCHED" },
      select: { id: true, commentId: true, meta: true },
    }),
    client.messageLog.findMany({
      where: { ...byUserAutomation, messageType: "COMMENT_REPLY", status: "SENT" },
      select: { id: true, commentId: true },
    }),
    client.automationEvent.findMany({
      where: { ...byUserAutomation, eventType: "PUBLIC_REPLY_SENT" },
      select: { id: true, commentId: true, meta: true },
    }),
    client.messageLog.count({
      where: { ...byUserAutomation, messageType: "DM", status: "SENT" },
    }),
    client.messageLog.count({
      where: { ...byUserAutomation, messageType: "DM", status: "FAILED" },
    }),
    client.messageLog.count({
      where: { ...byUserAutomation, messageType: "DM", status: "SKIPPED" },
    }),
    client.automationEvent.findMany({
      where: { ...byUserAutomation, eventType: "DM_SKIPPED" },
      select: { id: true, commentId: true, meta: true },
    }),
    client.lead.count({ where: { automation: { userId }, ...rangeWhere(range) } }),
    client.automation.count({ where: { userId, active: true } }),
    client.integrations.count({ where: { userId } }),
    client.webhookEvent.findFirst({
      where: {
        automation: { userId },
        eventType: { in: [...REAL_COMMENT_TYPES] },
        commentId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    client.messageLog.findFirst({
      where: { ...byUserAutomation, messageType: "COMMENT_REPLY", status: "SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    client.automationEvent.findFirst({
      where: { ...byUserAutomation, eventType: "PUBLIC_REPLY_SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    client.messageLog.findFirst({
      where: { ...byUserAutomation, messageType: "DM", status: "SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const commentsReceived = uniqueCount(commentRows, (row) => row.commentId);
  const commentsMatched = uniqueCount(matchedRows, sourceCommentId);
  const publicRepliesSent =
    publicReplyLogs.length > 0
      ? uniqueCount(publicReplyLogs, (row) => row.commentId)
      : uniqueCount(publicReplyEvents.filter((row) => publicReplyId(row)), publicReplyId);
  const dmsSkipped = dmsSkippedLogs + (dmsSkippedLogs > 0 ? 0 : uniqueCount(dmsSkippedEvents, sourceCommentId));
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
    dmsSkipped,
    leadsCaptured,
    replyRate: formatReplyRate(commentsMatched, publicRepliesSent),
    staticRepliesUsed,
    aiRepliesUsed: 0,
    activeCampaigns,
    connectedAccounts,
    lastRealCommentAt: lastRealComment?.createdAt ?? null,
    lastPublicReplyAt,
    lastDmAt: lastDm?.createdAt ?? null,
  };
}

export async function getUserFacingStats(
  userId: string,
  period: DashboardPeriod,
  now = new Date()
): Promise<UserFacingStatsComparison> {
  const periodRange = getPeriodRange(period, now);
  const [current, previous] = await Promise.all([
    getUserFacingMetrics(userId, { gte: periodRange.currentStart, lt: periodRange.currentEnd }),
    getUserFacingMetrics(userId, { gte: periodRange.previousStart, lt: periodRange.previousEnd }),
  ]);

  return {
    period: periodRange,
    current,
    previous,
    changes: {
      commentsReceived: percentChange(current.commentsReceived, previous.commentsReceived),
      commentsMatched: percentChange(current.commentsMatched, previous.commentsMatched),
      publicRepliesSent: percentChange(current.publicRepliesSent, previous.publicRepliesSent),
      staticRepliesUsed: percentChange(current.staticRepliesUsed, previous.staticRepliesUsed),
      leadsCaptured: percentChange(current.leadsCaptured, previous.leadsCaptured),
    },
  };
}
