"use server";

import {
  adminFormString,
  createAdminAuditLog,
  requireAdminAction,
  requireReason,
  requireTypedConfirmation,
} from "@/actions/admin/safe-actions";
import { subscribeInstagramWebhooks, formatSafeMetaError } from "@/lib/fetch";
import { refreshInstagramProfileSnapshotForUser } from "@/lib/instagram-profile-snapshot";
import { stripe } from "@/lib/stripe";
import { planReconnectCleanup } from "@/lib/account-webhook-diagnostics";
import { client } from "@/lib/prisma";
import { canActivateCampaign } from "@/actions/usage/queries";
import type { SUBSCRIPTION_PLAN } from "@prisma/client";
import { revalidatePath } from "next/cache";

function safeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function adminMutation<T>(input: {
  action: string;
  targetType: string;
  targetId?: string | null;
  targetLabel?: string | null;
  reason?: string | null;
  confirmation?: string | null;
  metadata?: unknown;
  run: (admin: Awaited<ReturnType<typeof requireAdminAction>>) => Promise<{ before?: unknown; after?: unknown; metadata?: unknown; result?: T }>;
}) {
  const admin = await requireAdminAction();
  try {
    const result = await input.run(admin);
    await createAdminAuditLog({
      admin,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      reason: input.reason,
      confirmation: input.confirmation,
      before: result.before,
      after: result.after,
      metadata: { ...((input.metadata as object) ?? {}), ...((result.metadata as object) ?? {}), result: result.result },
      status: "SUCCESS",
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard", "layout");
    return { status: 200 as const, data: result.result ?? "OK" };
  } catch (error) {
    await createAdminAuditLog({
      admin,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      reason: input.reason,
      confirmation: input.confirmation,
      metadata: input.metadata,
      status: "FAILED",
      error: safeError(error),
    });
    return { status: 500 as const, data: safeError(error) };
  }
}

export async function suspendUserAction(formData: FormData) {
  const admin = await requireAdminAction();
  const userId = adminFormString(formData, "userId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "SUSPEND_USER", targetType: "User", targetId: userId, reason, confirmation, expected: "SUSPEND" });

  return adminMutation({
    action: "SUSPEND_USER",
    targetType: "User",
    targetId: userId,
    reason,
    confirmation,
    run: async () => {
      const before = await client.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, status: true, suspendedAt: true, suspendedReason: true },
      });
      if (!before) throw new Error("User not found.");
      const after = await client.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: reason },
        select: { id: true, email: true, status: true, suspendedAt: true, suspendedReason: true },
      });
      await client.automation.updateMany({ where: { userId }, data: { active: false } });
      return { before, after, result: "User suspended and active campaigns paused." };
    },
  });
}

export async function unsuspendUserAction(formData: FormData) {
  const admin = await requireAdminAction();
  const userId = adminFormString(formData, "userId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "UNSUSPEND_USER", targetType: "User", targetId: userId, reason, confirmation, expected: "UNSUSPEND" });

  return adminMutation({
    action: "UNSUSPEND_USER",
    targetType: "User",
    targetId: userId,
    reason,
    confirmation,
    run: async () => {
      const before = await client.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, status: true, suspendedAt: true, suspendedReason: true },
      });
      if (!before) throw new Error("User not found.");
      const after = await client.user.update({
        where: { id: userId },
        data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
        select: { id: true, email: true, status: true, suspendedAt: true, suspendedReason: true },
      });
      return { before, after, result: "User unsuspended." };
    },
  });
}

export async function blockedAdminAction(formData: FormData) {
  const admin = await requireAdminAction();
  const action = adminFormString(formData, "action") || "BLOCKED_ADMIN_ACTION";
  const targetType = adminFormString(formData, "targetType") || "Unknown";
  const targetId = adminFormString(formData, "targetId") || null;
  const reason = adminFormString(formData, "reason") || "Blocked disabled admin action";
  const confirmation = adminFormString(formData, "confirmation") || null;
  const disabledReason = adminFormString(formData, "disabledReason") || "This admin action is disabled for safety.";

  await createAdminAuditLog({
    admin,
    action,
    targetType,
    targetId,
    reason,
    confirmation,
    status: "BLOCKED",
    error: disabledReason,
    metadata: { disabledReason },
  });
  revalidatePath("/admin");
  return { status: 403 as const, data: disabledReason };
}

export async function changeUserPlanAction(formData: FormData) {
  const admin = await requireAdminAction();
  const subscriptionId = adminFormString(formData, "subscriptionId");
  const plan = adminFormString(formData, "plan") as SUBSCRIPTION_PLAN;
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  if (!["FREE", "PRO"].includes(plan)) throw new Error("Only Free and Creator are supported by the current subscription model.");
  await requireTypedConfirmation({ admin, action: "CHANGE_SUBSCRIPTION_PLAN", targetType: "Subscription", targetId: subscriptionId, reason, confirmation, expected: "CHANGE_PLAN", metadata: { plan } });

  return adminMutation({
    action: "CHANGE_SUBSCRIPTION_PLAN",
    targetType: "Subscription",
    targetId: subscriptionId,
    reason,
    confirmation,
    metadata: { internalOnly: true, plan },
    run: async () => {
      const before = await client.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, userId: true, plan: true, customerId: true, User: { select: { email: true } } },
      });
      if (!before) throw new Error("Subscription not found.");
      const after = await client.subscription.update({
        where: { id: subscriptionId },
        data: { plan },
        select: { id: true, userId: true, plan: true, customerId: true, updatedAt: true, User: { select: { email: true } } },
      });
      return { before, after, result: `Internal plan override set to ${plan === "PRO" ? "Creator" : "Free"}.` };
    },
  });
}

export async function updateStaticReplyLimitAction(formData: FormData) {
  const admin = await requireAdminAction();
  const subscriptionId = adminFormString(formData, "subscriptionId");
  const mode = adminFormString(formData, "limitMode") || "override";
  const rawLimit = adminFormString(formData, "staticReplyLimitOverride");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "UPDATE_STATIC_REPLY_LIMIT", targetType: "Subscription", targetId: subscriptionId, reason, confirmation, expected: "UPDATE_LIMIT", metadata: { mode, rawLimit } });

  const resetToDefault = mode === "default";
  const parsedLimit: number | null = resetToDefault ? null : Number.parseInt(rawLimit, 10);
  if (!resetToDefault && (parsedLimit === null || !Number.isInteger(parsedLimit) || parsedLimit < 0 || parsedLimit > 1_000_000)) {
    await createAdminAuditLog({
      admin,
      action: "UPDATE_STATIC_REPLY_LIMIT",
      targetType: "Subscription",
      targetId: subscriptionId,
      reason,
      confirmation,
      metadata: { rawLimit },
      status: "BLOCKED",
      error: "Static reply limit must be between 0 and 1,000,000.",
    });
    return { status: 400 as const, data: "Static reply limit must be between 0 and 1,000,000." };
  }

  return adminMutation({
    action: "UPDATE_STATIC_REPLY_LIMIT",
    targetType: "Subscription",
    targetId: subscriptionId,
    reason,
    confirmation,
    metadata: { resetToDefault, limit: parsedLimit },
    run: async () => {
      const before = await client.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, plan: true, staticReplyLimitOverride: true, staticReplyCreditsCurrentMonth: true, User: { select: { email: true } } },
      });
      if (!before) throw new Error("Subscription not found.");
      const after = await client.subscription.update({
        where: { id: subscriptionId },
        data: { staticReplyLimitOverride: parsedLimit },
        select: { id: true, plan: true, staticReplyLimitOverride: true, staticReplyCreditsCurrentMonth: true, updatedAt: true, User: { select: { email: true } } },
      });
      return { before, after, result: resetToDefault ? "Static reply limit reset to plan default." : `Static reply limit override set to ${parsedLimit?.toLocaleString()}.` };
    },
  });
}

export async function addStaticReplyCreditsAction(formData: FormData) {
  const admin = await requireAdminAction();
  const subscriptionId = adminFormString(formData, "subscriptionId");
  const rawCredits = adminFormString(formData, "credits");
  const credits = Number.parseInt(rawCredits, 10);
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "ADD_STATIC_REPLY_CREDITS", targetType: "Subscription", targetId: subscriptionId, reason, confirmation, expected: "ADD_CREDITS", metadata: { rawCredits } });
  if (!Number.isInteger(credits) || credits <= 0 || credits > 1_000_000) {
    await createAdminAuditLog({
      admin,
      action: "ADD_STATIC_REPLY_CREDITS",
      targetType: "Subscription",
      targetId: subscriptionId,
      reason,
      confirmation,
      metadata: { rawCredits },
      status: "BLOCKED",
      error: "Credits must be between 1 and 1,000,000.",
    });
    return { status: 400 as const, data: "Credits must be between 1 and 1,000,000." };
  }

  return adminMutation({
    action: "ADD_STATIC_REPLY_CREDITS",
    targetType: "Subscription",
    targetId: subscriptionId,
    reason,
    confirmation,
    metadata: { credits },
    run: async () => {
      const before = await client.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, staticReplyCreditsCurrentMonth: true, staticReplyLimitOverride: true, User: { select: { email: true } } },
      });
      if (!before) throw new Error("Subscription not found.");
      const after = await client.subscription.update({
        where: { id: subscriptionId },
        data: { staticReplyCreditsCurrentMonth: { increment: credits } },
        select: { id: true, staticReplyCreditsCurrentMonth: true, staticReplyLimitOverride: true, updatedAt: true, User: { select: { email: true } } },
      });
      return { before, after, result: `${credits.toLocaleString()} current-month static reply credits added.` };
    },
  });
}

export async function resetUsageEnforcementAction(formData: FormData) {
  const admin = await requireAdminAction();
  const subscriptionId = adminFormString(formData, "subscriptionId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "RESET_USAGE_ENFORCEMENT", targetType: "Subscription", targetId: subscriptionId, reason, confirmation, expected: "RESET_USAGE" });

  return adminMutation({
    action: "RESET_USAGE_ENFORCEMENT",
    targetType: "Subscription",
    targetId: subscriptionId,
    reason,
    confirmation,
    run: async () => {
      const before = await client.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, usageEnforcedFrom: true, staticReplyCreditsCurrentMonth: true, User: { select: { email: true } } },
      });
      if (!before) throw new Error("Subscription not found.");
      const after = await client.subscription.update({
        where: { id: subscriptionId },
        data: { usageEnforcedFrom: new Date(), staticReplyCreditsCurrentMonth: 0 },
        select: { id: true, usageEnforcedFrom: true, staticReplyCreditsCurrentMonth: true, updatedAt: true, User: { select: { email: true } } },
      });
      return { before, after, result: "Usage enforcement reset from now. Historical logs remain unchanged." };
    },
  });
}

export async function refreshStripeSubscriptionAction(formData: FormData) {
  const subscriptionId = adminFormString(formData, "subscriptionId");
  const reason = adminFormString(formData, "reason") || "Admin Stripe status refresh";

  return adminMutation({
    action: "REFRESH_STRIPE_SUBSCRIPTION",
    targetType: "Subscription",
    targetId: subscriptionId,
    reason,
    run: async () => {
      const before = await client.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, customerId: true, plan: true, User: { select: { email: true } } },
      });
      if (!before) throw new Error("Subscription not found.");
      if (!before.customerId) throw new Error("Subscription has no Stripe customer ID.");
      if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured.");

      const subscriptions = await stripe.subscriptions.list({
        customer: before.customerId,
        limit: 1,
        status: "all",
      });
      const stripeSubscription = subscriptions.data[0];
      const metadata = stripeSubscription
        ? {
            stripeSubscriptionId: stripeSubscription.id,
            status: stripeSubscription.status,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            currentPeriodEnd: stripeSubscription.current_period_end,
          }
        : { status: "none" };
      return { before, after: before, metadata, result: stripeSubscription ? `Stripe status: ${stripeSubscription.status}` : "No Stripe subscriptions found for this customer." };
    },
  });
}

export async function markIntegrationReconnectRequiredAction(formData: FormData) {
  const admin = await requireAdminAction();
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "MARK_INTEGRATION_RECONNECT_REQUIRED", targetType: "Integration", targetId: integrationId, reason, confirmation, expected: "RECONNECT" });

  return adminMutation({
    action: "MARK_INTEGRATION_RECONNECT_REQUIRED",
    targetType: "Integration",
    targetId: integrationId,
    reason,
    confirmation,
    run: async () => {
      const before = await client.integrations.findUnique({
        where: { id: integrationId },
        select: { id: true, status: true, reconnectRequired: true, instagramUsername: true, lastAdminNote: true },
      });
      if (!before) throw new Error("Integration not found.");
      const after = await client.integrations.update({
        where: { id: integrationId },
        data: {
          status: "ERROR",
          reconnectRequired: true,
          lastAdminNote: reason,
          lastAdminActionAt: new Date(),
        },
        select: { id: true, status: true, reconnectRequired: true, instagramUsername: true, lastAdminNote: true, lastAdminActionAt: true },
      });
      return { before, after, result: "Reconnect required." };
    },
  });
}

export async function disconnectIntegrationAction(formData: FormData) {
  const admin = await requireAdminAction();
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "DISCONNECT_INTEGRATION", targetType: "Integration", targetId: integrationId, reason, confirmation, expected: "DISCONNECT" });

  return adminMutation({
    action: "DISCONNECT_INTEGRATION",
    targetType: "Integration",
    targetId: integrationId,
    reason,
    confirmation,
    run: async () => {
      const before = await client.integrations.findUnique({
        where: { id: integrationId },
        select: { id: true, userId: true, status: true, reconnectRequired: true, instagramUsername: true, pageId: true, instagramId: true },
      });
      if (!before) throw new Error("Integration not found.");
      if (!before.userId) throw new Error("Integration is not attached to a user.");
      const [after, paused] = await client.$transaction([
        client.integrations.update({
          where: { id: integrationId },
          data: {
            status: "DISCONNECTED",
            disconnectedAt: new Date(),
            disconnectedReason: reason,
            reconnectRequired: true,
            lastAdminNote: reason,
            lastAdminActionAt: new Date(),
          },
          select: { id: true, userId: true, status: true, reconnectRequired: true, disconnectedAt: true, disconnectedReason: true },
        }),
        client.automation.updateMany({
          where: { userId: before.userId, active: true },
          data: { active: false },
        }),
      ]);
      return { before, after, metadata: { pausedCampaigns: paused.count }, result: `${paused.count} active campaign(s) paused.` };
    },
  });
}

export async function resubscribeIntegrationAction(formData: FormData) {
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason") || "Admin webhook resubscribe";

  return adminMutation({
    action: "RESUBSCRIBE_INTEGRATION_WEBHOOKS",
    targetType: "Integration",
    targetId: integrationId,
    reason,
    run: async () => {
      const before = await client.integrations.findUnique({
        where: { id: integrationId },
        select: { id: true, pageId: true, token: true, webhookSubscriptionMode: true, webhookSubscriptionSubscribed: true, webhookSubscriptionError: true },
      });
      if (!before) throw new Error("Integration not found.");
      if (!before.pageId || !before.token) throw new Error("Integration is missing page connection data.");

      const attemptedAt = new Date();
      try {
        const subscription = await subscribeInstagramWebhooks(before.pageId, before.token);
        const subscribed = subscription.status >= 200 && subscription.status < 300;
        const after = await client.integrations.update({
          where: { id: integrationId },
          data: {
            webhookSubscriptionLastAttemptedAt: attemptedAt,
            webhookSubscriptionStatusCode: subscription.status,
            webhookSubscriptionSubscribed: subscribed,
            webhookSubscriptionMode: subscribed ? "API_SUBSCRIBED" : "FAILED",
            webhookSubscriptionError: subscribed ? null : "Meta rejected webhook subscription.",
            lastAdminActionAt: attemptedAt,
            lastAdminNote: reason,
          },
          select: { id: true, webhookSubscriptionMode: true, webhookSubscriptionSubscribed: true, webhookSubscriptionStatusCode: true, webhookSubscriptionError: true },
        });
        return { before, after, result: subscribed ? "Webhook subscription refreshed." : "Webhook subscription attempted but Meta rejected it." };
      } catch (error) {
        const after = await client.integrations.update({
          where: { id: integrationId },
          data: {
            webhookSubscriptionLastAttemptedAt: attemptedAt,
            webhookSubscriptionSubscribed: false,
            webhookSubscriptionMode: "FAILED",
            webhookSubscriptionError: formatSafeMetaError(error) || "Meta rejected webhook subscription.",
            lastAdminActionAt: attemptedAt,
            lastAdminNote: reason,
          },
          select: { id: true, webhookSubscriptionMode: true, webhookSubscriptionSubscribed: true, webhookSubscriptionStatusCode: true, webhookSubscriptionError: true },
        });
        return { before, after, result: "Webhook subscription failed." };
      }
    },
  });
}

export async function repairIntegrationConnectionAction(formData: FormData) {
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason") || "Repair Instagram connection";

  return adminMutation({
    action: "REPAIR_INSTAGRAM_CONNECTION",
    targetType: "Integration",
    targetId: integrationId,
    reason,
    run: async () => {
      const current = await client.integrations.findUnique({
        where: { id: integrationId },
        select: {
          id: true,
          userId: true,
          instagramId: true,
          instagramUsername: true,
          webhookAccountId: true,
          pageId: true,
          businessId: true,
          status: true,
        },
      });
      if (!current?.userId) throw new Error("Active integration not found.");

      const [integrations, campaigns] = await Promise.all([
        client.integrations.findMany({
          where: { userId: current.userId, name: "INSTAGRAM" },
          select: {
            id: true,
            userId: true,
            instagramId: true,
            instagramUsername: true,
            webhookAccountId: true,
            pageId: true,
            businessId: true,
            status: true,
          },
        }),
        client.automation.findMany({
          where: { userId: current.userId, archivedAt: null },
          select: {
            id: true,
            name: true,
            active: true,
            userId: true,
            posts: { select: { postid: true } },
            User: {
              select: {
                integrations: {
                  where: { name: "INSTAGRAM" },
                  select: {
                    id: true,
                    userId: true,
                    instagramId: true,
                    instagramUsername: true,
                    status: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const plan = planReconnectCleanup({ current, integrations, campaigns });
      const [disabled, paused, after] = await client.$transaction([
        client.integrations.updateMany({
          where: { id: { in: plan.staleIntegrationIds } },
          data: {
            status: "DISCONNECTED",
            disconnectedAt: new Date(),
            disconnectedReason: reason,
            reconnectRequired: true,
            lastAdminNote: reason,
            lastAdminActionAt: new Date(),
          },
        }),
        client.automation.updateMany({
          where: { id: { in: plan.shouldPauseCampaignIds } },
          data: { active: false },
        }),
        client.integrations.update({
          where: { id: current.id },
          data: {
            status: "CONNECTED",
            reconnectRequired: false,
            lastAdminNote: reason,
            lastAdminActionAt: new Date(),
          },
          select: {
            id: true,
            instagramId: true,
            instagramUsername: true,
            status: true,
            reconnectRequired: true,
            lastAdminActionAt: true,
          },
        }),
      ]);

      return {
        before: { current, staleIntegrationIds: plan.staleIntegrationIds },
        after,
        metadata: {
          oldIntegrationsDisabled: disabled.count,
          activeIntegrationId: current.id,
          activeCampaignsNeedingRecreation: plan.campaignsNeedingRecreation.map((campaign) => campaign.id),
          currentInstagramId: current.instagramId,
          pausedCampaigns: paused.count,
        },
        result: {
          oldIntegrationsDisabled: disabled.count,
          activeIntegrationId: current.id,
          activeCampaignsNeedingRecreation: plan.campaignsNeedingRecreation.map((campaign) => campaign.id),
          currentInstagramId: current.instagramId,
          pausedCampaigns: paused.count,
        },
      };
    },
  });
}

export async function refreshIntegrationProfileSnapshotAction(formData: FormData) {
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason") || "Admin profile snapshot refresh";

  return adminMutation({
    action: "REFRESH_INTEGRATION_PROFILE_SNAPSHOT",
    targetType: "Integration",
    targetId: integrationId,
    reason,
    run: async () => {
      const before = await client.integrations.findUnique({
        where: { id: integrationId },
        select: {
          id: true,
          instagramUsername: true,
          profilePictureUrl: true,
          User: { select: { clerkId: true, email: true } },
          snapshots: { orderBy: { fetchedAt: "desc" }, take: 1, select: { id: true, fetchedAt: true, username: true, followersCount: true, mediaCount: true } },
        },
      });
      if (!before?.User?.clerkId) throw new Error("Integration owner not found.");
      const refresh = await refreshInstagramProfileSnapshotForUser(before.User.clerkId, integrationId, { force: true });
      const after = await client.integrations.findUnique({
        where: { id: integrationId },
        select: {
          id: true,
          instagramUsername: true,
          profilePictureUrl: true,
          snapshots: { orderBy: { fetchedAt: "desc" }, take: 1, select: { id: true, fetchedAt: true, username: true, followersCount: true, mediaCount: true } },
        },
      });
      return { before, after, metadata: refresh, result: refresh.error ?? refresh.message ?? "Profile snapshot refresh attempted." };
    },
  });
}

export async function clearIntegrationSafeErrorAction(formData: FormData) {
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason");
  requireReason(reason);

  return adminMutation({
    action: "CLEAR_INTEGRATION_SAFE_ERROR",
    targetType: "Integration",
    targetId: integrationId,
    reason,
    run: async () => {
      const before = await client.integrations.findUnique({
        where: { id: integrationId },
        select: {
          id: true,
          status: true,
          reconnectRequired: true,
          oauthLastError: true,
          webhookSubscriptionError: true,
          webhookSubscriptionSubscribed: true,
        },
      });
      if (!before) throw new Error("Integration not found.");
      if (before.status !== "CONNECTED" || before.reconnectRequired || before.webhookSubscriptionSubscribed === false) {
        throw new Error("Only clear safe errors after the integration is connected and webhook subscription is operational.");
      }
      const after = await client.integrations.update({
        where: { id: integrationId },
        data: {
          oauthLastError: null,
          oauthLastErrorAt: null,
          oauthLastErrorSource: null,
          webhookSubscriptionError: null,
          lastAdminNote: reason,
          lastAdminActionAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          reconnectRequired: true,
          oauthLastError: true,
          webhookSubscriptionError: true,
          webhookSubscriptionSubscribed: true,
          lastAdminActionAt: true,
        },
      });
      return { before, after, result: "Old safe integration errors cleared." };
    },
  });
}

export async function setCampaignActiveAction(formData: FormData) {
  const admin = await requireAdminAction();
  const automationId = adminFormString(formData, "automationId");
  const desired = adminFormString(formData, "active") === "true";
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  const expected = desired ? "ACTIVATE" : "PAUSE";
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: desired ? "ACTIVATE_CAMPAIGN" : "PAUSE_CAMPAIGN", targetType: "Automation", targetId: automationId, reason, confirmation, expected });

  return adminMutation({
    action: desired ? "ACTIVATE_CAMPAIGN" : "PAUSE_CAMPAIGN",
    targetType: "Automation",
    targetId: automationId,
    reason,
    confirmation,
    run: async () => {
      const before = await client.automation.findUnique({
        where: { id: automationId },
        include: { User: { select: { id: true, status: true, integrations: { select: { status: true, reconnectRequired: true } } } } },
      });
      if (!before) throw new Error("Campaign not found.");
      if (desired) {
        if (before.needsReview) throw new Error(before.reviewReason ?? "Campaign needs review before activation.");
        if (before.archivedAt) throw new Error("Archived campaigns cannot be activated.");
        if (before.User?.status === "SUSPENDED") throw new Error("Suspended users cannot activate campaigns.");
        if (before.User?.integrations.some((item) => item.status === "DISCONNECTED" || item.reconnectRequired)) {
          throw new Error("Campaign cannot activate while integration is disconnected or reconnect-required.");
        }
        const activation = before.userId ? await canActivateCampaign(before.userId, automationId) : { ok: false };
        if (!activation.ok) throw new Error("Plan active campaign limit reached.");
      }
      const after = await client.automation.update({
        where: { id: automationId },
        data: { active: desired },
        select: { id: true, name: true, active: true, archivedAt: true },
      });
      return { before: { id: before.id, name: before.name, active: before.active, archivedAt: before.archivedAt }, after, result: desired ? "Campaign activated." : "Campaign paused." };
    },
  });
}

export async function duplicateCampaignAction(formData: FormData) {
  const automationId = adminFormString(formData, "automationId");
  const reason = adminFormString(formData, "reason") || "Admin duplicate";

  return adminMutation({
    action: "DUPLICATE_CAMPAIGN",
    targetType: "Automation",
    targetId: automationId,
    reason,
    run: async () => {
      const before = await client.automation.findUnique({
        where: { id: automationId },
        include: { keywords: true, posts: true, listener: true },
      });
      if (!before?.listener || !before.posts[0] || !before.userId) {
        throw new Error("Campaign cannot be duplicated until it has a post and listener.");
      }
      const post = before.posts[0];
      const after = await client.automation.create({
        data: {
          userId: before.userId,
          name: `${before.name || "Untitled campaign"} copy`,
          active: false,
          needsReview: false,
          reviewReason: null,
          matchingMode: before.matchingMode,
          triggerMode: before.triggerMode,
          sendPrivateDm: before.sendPrivateDm,
          posts: { create: { postid: post.postid, caption: post.caption, media: post.media, mediaType: post.mediaType } },
          ...(before.keywords.length > 0 && {
            keywords: { createMany: { data: before.keywords.map((keyword) => ({ word: keyword.word })), skipDuplicates: true } },
          }),
          trigger: { create: { type: "COMMENT" } },
          listener: {
            create: {
              listener: "MESSAGE",
              prompt: before.listener.prompt,
              commentReply: before.listener.commentReply,
              commentReply2: before.listener.commentReply2,
              commentReply3: before.listener.commentReply3,
              ctaLink: before.listener.ctaLink,
              ctaButtonTitle: before.listener.ctaButtonTitle,
            },
          },
        },
        select: { id: true, name: true, active: true },
      });
      return { before: { id: before.id, name: before.name }, after, result: after.id };
    },
  });
}

export async function archiveCampaignAction(formData: FormData) {
  const admin = await requireAdminAction();
  const automationId = adminFormString(formData, "automationId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "ARCHIVE_CAMPAIGN", targetType: "Automation", targetId: automationId, reason, confirmation, expected: "ARCHIVE" });

  return adminMutation({
    action: "ARCHIVE_CAMPAIGN",
    targetType: "Automation",
    targetId: automationId,
    reason,
    confirmation,
    run: async (adminIdentity) => {
      const before = await client.automation.findUnique({
        where: { id: automationId },
        select: { id: true, name: true, active: true, archivedAt: true, archiveReason: true },
      });
      if (!before) throw new Error("Campaign not found.");
      const after = await client.automation.update({
        where: { id: automationId },
        data: {
          active: false,
          archivedAt: new Date(),
          archivedByAdminEmail: adminIdentity.email ?? adminIdentity.clerkId,
          archiveReason: reason,
        },
        select: { id: true, name: true, active: true, archivedAt: true, archivedByAdminEmail: true, archiveReason: true },
      });
      return { before, after, result: "Campaign archived." };
    },
  });
}

export async function markCampaignNeedsReviewAction(formData: FormData) {
  const automationId = adminFormString(formData, "automationId");
  const reason = adminFormString(formData, "reason");
  requireReason(reason);

  return adminMutation({
    action: "MARK_CAMPAIGN_NEEDS_REVIEW",
    targetType: "Automation",
    targetId: automationId,
    reason,
    run: async () => {
      const before = await client.automation.findUnique({
        where: { id: automationId },
        select: { id: true, name: true, active: true, needsReview: true, reviewReason: true },
      });
      if (!before) throw new Error("Campaign not found.");
      const after = await client.automation.update({
        where: { id: automationId },
        data: { active: false, needsReview: true, reviewReason: reason },
        select: { id: true, name: true, active: true, needsReview: true, reviewReason: true },
      });
      return { before, after, result: "Campaign marked needs review and paused." };
    },
  });
}

export async function clearCampaignNeedsReviewAction(formData: FormData) {
  const admin = await requireAdminAction();
  const automationId = adminFormString(formData, "automationId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");
  requireReason(reason);
  await requireTypedConfirmation({ admin, action: "CLEAR_CAMPAIGN_NEEDS_REVIEW", targetType: "Automation", targetId: automationId, reason, confirmation, expected: "CLEAR_REVIEW" });

  return adminMutation({
    action: "CLEAR_CAMPAIGN_NEEDS_REVIEW",
    targetType: "Automation",
    targetId: automationId,
    reason,
    confirmation,
    run: async () => {
      const before = await client.automation.findUnique({
        where: { id: automationId },
        include: { User: { select: { integrations: { select: { status: true, reconnectRequired: true } } } } },
      });
      if (!before) throw new Error("Campaign not found.");
      if (before.User?.integrations.some((item) => item.status === "DISCONNECTED" || item.reconnectRequired)) {
        throw new Error("Cannot clear review while the owner integration is disconnected or reconnect-required.");
      }
      const after = await client.automation.update({
        where: { id: automationId },
        data: { needsReview: false, reviewReason: null },
        select: { id: true, name: true, active: true, needsReview: true, reviewReason: true },
      });
      return {
        before: { id: before.id, name: before.name, active: before.active, needsReview: before.needsReview, reviewReason: before.reviewReason },
        after,
        result: "Campaign review flag cleared. Campaign remains paused until activated.",
      };
    },
  });
}
