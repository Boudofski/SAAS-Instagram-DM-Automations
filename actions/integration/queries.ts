"use server";

import { client } from "@/lib/prisma";
import { getIntegrationHealth, REAL_COMMENT_WEBHOOK_TYPES } from "@/lib/dashboard-metrics";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { resolveIntegrationSendToken } from "@/lib/send-token";

export const updateIntegration = async (
  token: string,
  expire: Date,
  id: string,
  instagramId?: string,
  instagramUsername?: string,
  profilePictureUrl?: string,
  pageId?: string,
  pageName?: string,
  businessId?: string,
  igAccountSource?: string,
  resolutionDiagnostics?: unknown,
  subscription?: {
    statusCode?: number;
    subscribed: boolean;
    subscriptionMode?: string;
    error?: string;
    attemptedAt: Date;
  }
) => {
  if (typeof token !== "string" || token.trim().length < 20) {
    throw new Error("invalid_page_access_token");
  }

  return await client.integrations.update({
    where: { id },
    data: {
      token,
      expiresAt: expire,
      instagramId,
      webhookAccountId: pageId,
      pageId,
      pageName,
      businessId,
      instagramUsername,
      profilePictureUrl,
      igAccountSource,
      oauthResolutionDiagnostics: resolutionDiagnostics as any,
      webhookSubscriptionLastAttemptedAt: subscription?.attemptedAt,
      webhookSubscriptionStatusCode: subscription?.statusCode,
      webhookSubscriptionSubscribed: subscription?.subscribed,
      webhookSubscriptionMode: subscription?.subscriptionMode,
      webhookSubscriptionError: subscription?.error,
      oauthLastError: null,
      oauthLastErrorAt: null,
      oauthLastErrorSource: null,
      status: "CONNECTED",
      disconnectedAt: null,
      disconnectedReason: null,
      reconnectRequired: false,
      lastAdminNote: "instagram_connection_refreshed",
      lastAdminActionAt: new Date(),
    },
  });
};

export const getIntegrations = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      integrations: {
        where: {
          name: "INSTAGRAM",
        },
      },
    },
  });
};

export const recordIntegrationOAuthError = async (
  clerkId: string,
  error: string,
  source = "facebook_business_oauth",
  resolutionDiagnostics?: unknown
) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      integrations: {
        where: { name: "INSTAGRAM" },
        take: 1,
        select: { id: true },
      },
    },
  });

  const integrationId = user?.integrations[0]?.id;
  if (!integrationId) return null;

  return await client.integrations.update({
    where: { id: integrationId },
    data: {
      oauthLastError: error,
      oauthLastErrorAt: new Date(),
      oauthLastErrorSource: source,
      oauthResolutionDiagnostics: resolutionDiagnostics as any,
    },
  });
};

export const softDisconnectIntegrationForUser = async (clerkId: string) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      integrations: {
        where: { name: "INSTAGRAM" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          pageId: true,
          instagramId: true,
          status: true,
          reconnectRequired: true,
          token: true,
        },
      },
    },
  });

  const integration = getCanonicalInstagramIntegration(user?.integrations);
  if (!user || !integration) return null;

  console.log("[oauth] soft disconnect instagram integration", {
    hasPageId: Boolean(integration.pageId),
    hasInstagramBusinessAccountId: Boolean(integration.instagramId),
  });

  const reason = "User disconnected Instagram from AP3k";
  const [updated, paused] = await client.$transaction([
    client.integrations.update({
      where: { id: integration.id },
      data: {
        status: "DISCONNECTED",
        disconnectedAt: new Date(),
        disconnectedReason: reason,
        reconnectRequired: false,
      },
      select: { id: true },
    }),
    client.automation.updateMany({
      where: { userId: user.id, archivedAt: null, active: true },
      data: {
        active: false,
        needsReview: true,
        reviewReason: "Instagram account disconnected.",
      },
    }),
  ]);

  return { ...updated, pausedCampaigns: paused.count };
};

export const createMetaOAuthSelection = async (
  clerkId: string,
  accounts: unknown,
  expiresAt: Date
) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) throw new Error("user_not_found");

  await client.metaOAuthSelection.deleteMany({
    where: { userId: user.id },
  });

  return await client.metaOAuthSelection.create({
    data: {
      userId: user.id,
      accounts: accounts as any,
      expiresAt,
    },
    select: { id: true },
  });
};

export const getLatestMetaOAuthSelection = async (clerkId: string) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return null;

  return await client.metaOAuthSelection.findFirst({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      accounts: true,
      expiresAt: true,
    },
  });
};

export const deleteMetaOAuthSelection = async (id: string) => {
  return await client.metaOAuthSelection.delete({
    where: { id },
    select: { id: true },
  });
};

export const createIntegration = async (
  clerkId: string,
  token: string,
  expire: Date,
  instagramId: string,
  instagramUsername?: string,
  profilePictureUrl?: string,
  pageId?: string,
  pageName?: string,
  businessId?: string,
  igAccountSource?: string,
  resolutionDiagnostics?: unknown,
  subscription?: {
    statusCode?: number;
    subscribed: boolean;
    subscriptionMode?: string;
    error?: string;
    attemptedAt: Date;
  }
) => {
  if (typeof token !== "string" || token.trim().length < 20) {
    throw new Error("invalid_page_access_token");
  }

  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      integrations: {
        create: {
          token,
          expiresAt: expire,
          instagramId,
          webhookAccountId: pageId,
          pageId,
          pageName,
          businessId,
          instagramUsername,
          profilePictureUrl,
          igAccountSource,
          oauthResolutionDiagnostics: resolutionDiagnostics as any,
          webhookSubscriptionLastAttemptedAt: subscription?.attemptedAt,
          webhookSubscriptionStatusCode: subscription?.statusCode,
          webhookSubscriptionSubscribed: subscription?.subscribed,
          webhookSubscriptionMode: subscription?.subscriptionMode,
          webhookSubscriptionError: subscription?.error,
          oauthLastError: null,
          oauthLastErrorAt: null,
          oauthLastErrorSource: null,
          status: "CONNECTED",
          reconnectRequired: false,
          disconnectedAt: null,
          disconnectedReason: null,
          lastAdminNote: null,
          lastAdminActionAt: null,
        },
      },
    },
    select: {
      firstname: true,
      lastname: true,
      clerkId: true,
    },
  });
};

export const getWebhookHealthForUser = async (clerkId: string) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      integrations: {
        where: { name: "INSTAGRAM" },
        take: 1,
        select: {
          token: true,
          instagramId: true,
          pageId: true,
          webhookAccountId: true,
          expiresAt: true,
          webhookSubscriptionLastAttemptedAt: true,
          webhookSubscriptionStatusCode: true,
          webhookSubscriptionSubscribed: true,
          webhookSubscriptionMode: true,
          webhookSubscriptionError: true,
        },
      },
    },
  });

  const userId = user?.id;
  const integration = user?.integrations[0];
  const pageId = integration?.pageId;
  const accountIds = [
    integration?.pageId,
    integration?.instagramId,
    integration?.webhookAccountId,
  ].filter(Boolean) as string[];
  const tokenExpired =
    integration?.expiresAt && integration.expiresAt.getTime() < Date.now();
  if (!pageId || !userId) {
    return {
      lastWebhook: null,
      lastCommentWebhook: null,
      lastFailure: null,
      oauth: {
        tokenPresent: Boolean(integration?.token),
        tokenExpired: Boolean(tokenExpired),
      },
    };
  }

  const [lastWebhook, lastCommentWebhook, lastFailure, dashboardHealth] = await Promise.all([
    client.webhookEvent.findFirst({
      where: {
        OR: [
          { automation: { userId } },
          ...(accountIds.length > 0 ? [{ igAccountId: { in: accountIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        eventType: true,
        status: true,
        field: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    client.webhookEvent.findFirst({
      where: {
        eventType: { in: [...REAL_COMMENT_WEBHOOK_TYPES] },
        OR: [
          { automation: { userId } },
          ...(accountIds.length > 0 ? [{ igAccountId: { in: accountIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        eventType: true,
        status: true,
        field: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    client.webhookEvent.findFirst({
      where: {
        AND: [
          {
            OR: [
              { automation: { userId } },
              ...(accountIds.length > 0 ? [{ igAccountId: { in: accountIds } }] : []),
            ],
          },
          {
            OR: [
              { status: "FAILED" },
              { eventType: { in: ["SIGNATURE_FAILED", "SIGNATURE_VERIFICATION_FAILED"] } },
              { errorMessage: { not: null } },
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        eventType: true,
        status: true,
        field: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    getIntegrationHealth(userId),
  ]);

  const tokenResolution = resolveIntegrationSendToken(integration);
  return {
    lastWebhook,
    lastCommentWebhook: lastCommentWebhook ?? dashboardHealth.lastRealComment,
    lastFailure,
    subscription: {
      lastAttemptedAt: integration?.webhookSubscriptionLastAttemptedAt ?? null,
      statusCode: integration?.webhookSubscriptionStatusCode ?? null,
      subscribed: integration?.webhookSubscriptionSubscribed ?? null,
      subscriptionMode: integration?.webhookSubscriptionMode ?? null,
      error: integration?.webhookSubscriptionError ?? null,
    },
    oauth: {
      tokenPresent: Boolean(integration?.token),
      tokenExpired: Boolean(tokenExpired),
      tokenFormatValid: tokenResolution.ok,
      tokenSource: tokenResolution.ok ? tokenResolution.source : null,
      tokenUsable: tokenResolution.ok && !tokenExpired,
      reconnectRequired: !tokenResolution.ok,
    },
  };
};
