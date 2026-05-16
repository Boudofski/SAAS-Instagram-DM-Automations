"use server";

import { client } from "@/lib/prisma";

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
      webhookSubscriptionError: subscription?.error,
      oauthLastError: null,
      oauthLastErrorAt: null,
      oauthLastErrorSource: null,
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

export const deleteIntegrationForUser = async (clerkId: string) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    select: {
      integrations: {
        where: { name: "INSTAGRAM" },
        take: 1,
        select: { id: true, pageId: true, instagramId: true },
      },
    },
  });

  const integration = user?.integrations[0];
  if (!integration) return null;

  console.log("[oauth] disconnect instagram integration", {
    hasPageId: Boolean(integration.pageId),
    hasInstagramBusinessAccountId: Boolean(integration.instagramId),
  });

  return await client.integrations.delete({
    where: { id: integration.id },
    select: { id: true },
  });
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
          webhookSubscriptionError: subscription?.error,
          oauthLastError: null,
          oauthLastErrorAt: null,
          oauthLastErrorSource: null,
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
      integrations: {
        where: { name: "INSTAGRAM" },
        take: 1,
        select: {
          token: true,
          instagramId: true,
          pageId: true,
          expiresAt: true,
          webhookSubscriptionLastAttemptedAt: true,
          webhookSubscriptionStatusCode: true,
          webhookSubscriptionSubscribed: true,
          webhookSubscriptionError: true,
        },
      },
    },
  });

  const integration = user?.integrations[0];
  const pageId = integration?.pageId;
  const tokenExpired =
    integration?.expiresAt && integration.expiresAt.getTime() < Date.now();
  if (!pageId) {
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

  const [lastWebhook, lastCommentWebhook, lastFailure] = await Promise.all([
    client.webhookEvent.findFirst({
      where: { igAccountId: pageId },
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
        igAccountId: pageId,
        eventType: { in: ["REAL_COMMENT_EVENT", "COMMENT_WEBHOOK_RECEIVED"] },
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
        igAccountId: pageId,
        OR: [
          { status: "FAILED" },
          { eventType: { in: ["SIGNATURE_FAILED", "SIGNATURE_VERIFICATION_FAILED"] } },
          { errorMessage: { not: null } },
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
  ]);

  return {
    lastWebhook,
    lastCommentWebhook,
    lastFailure,
    subscription: {
      lastAttemptedAt: integration?.webhookSubscriptionLastAttemptedAt ?? null,
      statusCode: integration?.webhookSubscriptionStatusCode ?? null,
      subscribed: integration?.webhookSubscriptionSubscribed ?? null,
      error: integration?.webhookSubscriptionError ?? null,
    },
    oauth: {
      tokenPresent: Boolean(integration?.token),
      tokenExpired: Boolean(tokenExpired),
      tokenUsable: Boolean(integration?.token) && !tokenExpired,
    },
  };
};
