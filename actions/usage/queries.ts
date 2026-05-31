import { client } from "@/lib/prisma";
import {
  getCurrentUsagePeriod,
  getPlanLabel,
  getPlanLimits,
  makeUsageMetric,
  type ProductPlan,
  type UsageSummary,
} from "@/lib/plan-limits";

export async function getUserMonthlyUsage(userId: string, date = new Date()): Promise<UsageSummary> {
  const period = getCurrentUsagePeriod(date);
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      subscription: { select: { plan: true, usageResetAt: true } },
    },
  });

  const plan = (user?.subscription?.plan ?? "FREE") as ProductPlan;
  const limits = getPlanLimits(plan);

  const resetAt = user?.subscription?.usageResetAt;
  const effectiveStart = resetAt && resetAt > period.enforcementStart ? resetAt : period.enforcementStart;

  const [publicReplyLogs, dmLogs, activeCampaigns, connectedAccounts] = await Promise.all([
    client.messageLog.count({
      where: {
        status: "SENT",
        messageType: "COMMENT_REPLY",
        createdAt: { gte: effectiveStart, lt: period.monthEnd },
        automation: { userId },
      },
    }),
    client.messageLog.count({
      where: {
        status: "SENT",
        messageType: "DM",
        createdAt: { gte: effectiveStart, lt: period.monthEnd },
        automation: { userId },
      },
    }),
    client.automation.count({ where: { userId, active: true, archivedAt: null } }),
    client.integrations.count({ where: { userId, status: { not: "DISCONNECTED" } } }),
  ]);
  const [publicReplyEventFallback, dmEventFallback] = await Promise.all([
    publicReplyLogs > 0
      ? Promise.resolve(0)
      : client.automationEvent.count({
          where: {
            eventType: "PUBLIC_REPLY_SENT",
            createdAt: { gte: effectiveStart, lt: period.monthEnd },
            automation: { userId },
          },
        }),
    dmLogs > 0
      ? Promise.resolve(0)
      : client.automationEvent.count({
          where: {
            eventType: "DM_SENT",
            createdAt: { gte: effectiveStart, lt: period.monthEnd },
            automation: { userId },
          },
        }),
  ]);
  const staticReplies = publicReplyLogs + dmLogs + publicReplyEventFallback + dmEventFallback;

  return {
    plan,
    planLabel: getPlanLabel(plan),
    periodLabel: period.periodLabel,
    periodStart: period.monthStart,
    periodEnd: period.monthEnd,
    enforcementStart: period.enforcementStart,
    staticReplies: makeUsageMetric(staticReplies, limits.staticRepliesPerMonth),
    aiReplies: makeUsageMetric(0, limits.aiRepliesPerMonth),
    activeCampaigns: makeUsageMetric(activeCampaigns, limits.activeCampaigns),
    connectedAccounts: makeUsageMetric(connectedAccounts, limits.connectedInstagramAccounts),
  };
}

export async function canSendStaticReply(userId: string, date = new Date()) {
  const usage = await getUserMonthlyUsage(userId, date);
  return {
    ok: !usage.staticReplies.blocked,
    usage,
    reason: usage.staticReplies.blocked ? "static_reply_limit_reached" : undefined,
  };
}

export async function canSendAiReply(userId: string, date = new Date()) {
  const usage = await getUserMonthlyUsage(userId, date);
  return {
    ok: !usage.aiReplies.blocked,
    usage,
    reason: usage.aiReplies.blocked ? "ai_reply_limit_reached" : undefined,
  };
}

export async function canActivateCampaign(userId: string, automationId?: string) {
  const usage = await getUserMonthlyUsage(userId);
  if (!usage.activeCampaigns.blocked) return { ok: true, usage };

  if (automationId) {
    const existing = await client.automation.findFirst({
      where: { id: automationId, userId, active: true, archivedAt: null },
      select: { id: true },
    });
    if (existing) return { ok: true, usage };
  }

  return {
    ok: false,
    usage,
    reason: "active_campaign_limit_reached",
  };
}
