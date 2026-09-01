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
      subscription: {
        select: {
          plan: true,
          usageResetAt: true,
          welcomeTrialStartedAt: true,
          welcomeTrialEndsAt: true,
          welcomeTrialReplyLimit: true,
        },
      },
    },
  });

  const plan = (user?.subscription?.plan ?? "FREE") as ProductPlan;
  const limits = getPlanLimits(plan);

  const trialStartedAt = user?.subscription?.welcomeTrialStartedAt ?? null;
  const trialEndsAt = user?.subscription?.welcomeTrialEndsAt ?? null;
  const trialReplyLimit = user?.subscription?.welcomeTrialReplyLimit ?? null;
  const welcomeTrialActive = Boolean(
    plan === "FREE" &&
    trialStartedAt &&
    trialEndsAt &&
    trialReplyLimit &&
    trialStartedAt <= date &&
    trialEndsAt > date
  );

  // AP3K now has one clear product model across the UI and enforcement layer:
  // one connected Instagram account, unlimited campaigns, and the published
  // monthly reply allowance for the selected plan. Historical per-account
  // overrides are intentionally ignored so billing, pricing, and enforcement
  // always describe the same product.
  const staticLimit = welcomeTrialActive && trialReplyLimit
    ? trialReplyLimit
    : limits.staticRepliesPerMonth;
  const aiLimit = limits.aiRepliesPerMonth;
  const campaignLimit = limits.activeCampaigns;
  const accountLimit = limits.connectedInstagramAccounts;

  const resetAt = user?.subscription?.usageResetAt;
  let effectiveStart = resetAt && resetAt > period.enforcementStart ? resetAt : period.enforcementStart;
  let effectiveEnd = period.monthEnd;
  let periodLabel = period.periodLabel;

  if (welcomeTrialActive && trialStartedAt && trialEndsAt) {
    effectiveStart = trialStartedAt;
    effectiveEnd = trialEndsAt;
    periodLabel = "14-day launch trial";
  } else if (
    plan === "FREE" &&
    trialEndsAt &&
    trialEndsAt <= date &&
    trialEndsAt > effectiveStart
  ) {
    // The normal Free allowance starts fresh after the one-time launch trial.
    effectiveStart = trialEndsAt;
  }

  const [publicReplyLogs, dmLogs, activeCampaigns, connectedAccounts] = await Promise.all([
    client.messageLog.count({
      where: {
        status: "SENT",
        messageType: "COMMENT_REPLY",
        createdAt: { gte: effectiveStart, lt: effectiveEnd },
        automation: { userId },
      },
    }),
    client.messageLog.count({
      where: {
        status: "SENT",
        messageType: "DM",
        createdAt: { gte: effectiveStart, lt: effectiveEnd },
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
            createdAt: { gte: effectiveStart, lt: effectiveEnd },
            automation: { userId },
          },
        }),
    dmLogs > 0
      ? Promise.resolve(0)
      : client.automationEvent.count({
          where: {
            eventType: "DM_SENT",
            createdAt: { gte: effectiveStart, lt: effectiveEnd },
            automation: { userId },
          },
        }),
  ]);

  const staticReplies = publicReplyLogs + dmLogs + publicReplyEventFallback + dmEventFallback;

  return {
    plan,
    planLabel: getPlanLabel(plan),
    periodLabel,
    periodStart: effectiveStart,
    periodEnd: effectiveEnd,
    enforcementStart: effectiveStart,
    staticReplies: makeUsageMetric(staticReplies, staticLimit),
    aiReplies: makeUsageMetric(0, aiLimit),
    activeCampaigns: makeUsageMetric(activeCampaigns, campaignLimit),
    connectedAccounts: makeUsageMetric(Math.min(connectedAccounts, 1), accountLimit),
    welcomeTrial: trialStartedAt && trialEndsAt && trialReplyLimit
      ? {
          active: welcomeTrialActive,
          startsAt: trialStartedAt,
          endsAt: trialEndsAt,
          replyLimit: trialReplyLimit,
        }
      : null,
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
