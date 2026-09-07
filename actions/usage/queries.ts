import { client } from "@/lib/prisma";
import {
  getCurrentUsagePeriod,
  getPlanLabel,
  getPlanLimits,
  isUnlimited,
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

  const [publicReplyLogs, dmLogs, aiReplies, activeCampaigns, connectedAccounts] = await Promise.all([
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
    client.automationEvent.count({
      where: {
        eventType: "AI_REPLY_GENERATED",
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
    aiReplies: makeUsageMetric(aiReplies, aiLimit),
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

type AiReplyReservationInput = {
  userId: string;
  automationId: string;
  igUserId?: string | null;
  mediaId?: string | null;
  commentId?: string | null;
  keyword?: string | null;
  date?: Date;
};

/**
 * Atomically reserves one provider request before the AI call starts.
 *
 * The per-user advisory lock prevents simultaneous webhooks from reading the
 * same remaining balance and both passing the limit. Provider failures can
 * release the reservation; classifications and generated replies count as one
 * AI decision because they both consume a provider request.
 */
export async function reserveAiReplyQuota(input: AiReplyReservationInput) {
  const date = input.date ?? new Date();

  return client.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${input.userId}))`;

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { subscription: { select: { plan: true, usageResetAt: true } } },
    });
    const plan = (user?.subscription?.plan ?? "FREE") as ProductPlan;
    const limit = getPlanLimits(plan).aiRepliesPerMonth;
    const period = getCurrentUsagePeriod(date);
    const resetAt = user?.subscription?.usageResetAt;
    const effectiveStart = resetAt && resetAt > period.enforcementStart
      ? resetAt
      : period.enforcementStart;

    const used = await tx.automationEvent.count({
      where: {
        eventType: "AI_REPLY_GENERATED",
        createdAt: { gte: effectiveStart, lt: period.monthEnd },
        automation: { userId: input.userId },
      },
    });

    if (!isUnlimited(limit) && used >= limit) {
      return {
        ok: false as const,
        reason: "ai_reply_limit_reached" as const,
        plan,
        used,
        limit,
        periodLabel: period.periodLabel,
        reservationId: null,
      };
    }

    const reservation = await tx.automationEvent.create({
      data: {
        automationId: input.automationId,
        eventType: "AI_REPLY_GENERATED",
        igUserId: input.igUserId ?? undefined,
        mediaId: input.mediaId ?? undefined,
        commentId: input.commentId ?? undefined,
        keyword: input.keyword ?? undefined,
        meta: {
          status: "reserved",
          quotaPlan: plan,
          quotaPeriod: period.periodLabel,
        },
      },
      select: { id: true },
    });

    return {
      ok: true as const,
      plan,
      used: used + 1,
      limit,
      periodLabel: period.periodLabel,
      reservationId: reservation.id,
    };
  });
}

export async function completeAiReplyReservation(
  reservationId: string,
  meta: Record<string, string | number | boolean | null>
) {
  await client.automationEvent.updateMany({
    where: { id: reservationId, eventType: "AI_REPLY_GENERATED" },
    data: { meta: { status: "completed", ...meta } },
  });
}

export async function releaseAiReplyReservation(reservationId: string) {
  await client.automationEvent.deleteMany({
    where: { id: reservationId, eventType: "AI_REPLY_GENERATED" },
  });
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
