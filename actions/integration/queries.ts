"use server";

import { client } from "@/lib/prisma";
import { getIntegrationHealth, REAL_COMMENT_WEBHOOK_TYPES } from "@/lib/dashboard-metrics";
import { getCanonicalInstagramIntegration, isCanonicalInstagramConnected } from "@/lib/instagram-integration-status";
import { getPlanLimits, isUnlimited, type ProductPlan } from "@/lib/plan-limits";
import { resolveIntegrationSendToken } from "@/lib/send-token";
import {
  classifyInstagramIntegrationSaveError,
  InstagramIntegrationSaveError,
} from "@/lib/instagram-integration-save-errors";

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
    throw new InstagramIntegrationSaveError("TOKEN_EXCHANGE_FAILED", "invalid_page_access_token");
  }

  const user = await client.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      clerkId: true,
      subscription: { select: { plan: true } },
      integrations: {
        where: { name: "INSTAGRAM" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          userId: true,
          instagramId: true,
          businessId: true,
          pageId: true,
          instagramUsername: true,
          status: true,
          reconnectRequired: true,
          token: true,
        },
      },
    },
  });

  if (!user) {
    throw new InstagramIntegrationSaveError("MISSING_LOCAL_PROFILE", "user_not_found");
  }

  // Deterministic reclaim: match by any stable identifier so reconnecting the same
  // account always takes the UPDATE path regardless of which field was stored first.
  const sameWorkspaceRow = user.integrations.find((integration) =>
    (instagramId && integration.instagramId === instagramId) ||
    (businessId && integration.businessId === businessId) ||
    (pageId && integration.pageId === pageId) ||
    (instagramUsername &&
      instagramUsername.toLowerCase() === (integration.instagramUsername ?? "").toLowerCase())
  );

  console.log("[integration-save] diagnosis", {
    userId: user.id,
    workspaceId: user.clerkId,
    selectedInstagramId: instagramId,
    selectedBusinessId: businessId,
    selectedPageId: pageId,
    canonicalIntegrationIdFound: sameWorkspaceRow?.id ?? null,
    sameWorkspaceFound: Boolean(sameWorkspaceRow),
    existingInstagramIds: user.integrations.map((i) => i.instagramId),
    existingBusinessIds: user.integrations.map((i) => i.businessId),
    existingPageIds: user.integrations.map((i) => i.pageId),
    existingStatuses: user.integrations.map((i) => i.status),
  });

  if (sameWorkspaceRow) {
    // Reconnect path: always UPDATE, never CREATE, always bypass plan limit.
    const update = await updateIntegration(
      token,
      expire,
      sameWorkspaceRow.id,
      instagramId,
      instagramUsername,
      profilePictureUrl,
      pageId,
      pageName,
      businessId,
      igAccountSource,
      resolutionDiagnostics,
      subscription
    );
    console.log("[integration-save] reclaimed existing row", {
      integrationId: update.id,
      previousStatus: sameWorkspaceRow.status,
    });
    return {
      firstname: user.firstname,
      lastname: user.lastname,
      clerkId: user.clerkId,
      integrationId: update.id,
    };
  }

  const duplicate = await client.integrations.findUnique({
    where: { instagramId },
    select: { id: true, userId: true, status: true, reconnectRequired: true, disconnectedAt: true },
  });
  const otherWorkspaceFound = Boolean(duplicate && duplicate.userId !== user.id);

  const limits = getPlanLimits((user.subscription?.plan ?? "FREE") as ProductPlan);
  const connectedCount = user.integrations.filter(isCanonicalInstagramConnected).length;
  const planLimitBlocked = !isUnlimited(limits.connectedInstagramAccounts) && connectedCount >= limits.connectedInstagramAccounts;

  console.log("[integration-save] new account path", {
    userId: user.id,
    workspaceId: user.clerkId,
    selectedInstagramId: instagramId,
    otherWorkspaceFound,
    planLimitBlocked,
    connectedCount,
    planLimit: limits.connectedInstagramAccounts,
  });

  if (otherWorkspaceFound) {
    throw new InstagramIntegrationSaveError("DUPLICATE_INSTAGRAM_ACCOUNT", "instagram_account_already_connected");
  }

  if (planLimitBlocked) {
    throw new InstagramIntegrationSaveError("PLAN_LIMIT_REACHED", "connected_instagram_account_limit_reached");
  }

  try {
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
  } catch (error) {
    const anyError = error as any;
    console.error("[integration-save] create failed", {
      userId: user.id,
      workspaceId: user.clerkId,
      prismaCode: anyError?.code,
      prismaTarget: anyError?.meta?.target,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new InstagramIntegrationSaveError(classifyInstagramIntegrationSaveError(error), "integration_save_failed");
  }
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
