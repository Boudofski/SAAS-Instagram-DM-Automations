"use server";

import { getInstagramTokenFormatDiagnostic } from "@/lib/instagram-token";
import { client } from "@/lib/prisma";

export const updateIntegration = async (
  token: string,
  expire: Date,
  id: string,
  instagramId?: string,
  instagramUsername?: string,
  profilePictureUrl?: string,
  subscription?: {
    statusCode?: number;
    subscribed: boolean;
    error?: string;
    attemptedAt: Date;
  }
) => {
  const tokenDiagnostic = getInstagramTokenFormatDiagnostic(token);
  if (!tokenDiagnostic.looksUsable) {
    console.warn("[oauth] refused to update integration with invalid token", {
      integrationId: id,
      tokenFormat: tokenDiagnostic.reason,
      tokenLength: tokenDiagnostic.length,
    });
    throw new Error("invalid_instagram_token_format");
  }

  return await client.integrations.update({
    where: { id },
    data: {
      token,
      expiresAt: expire,
      instagramId,
      webhookAccountId: instagramId,
      instagramUsername,
      profilePictureUrl,
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
  source = "instagram_oauth"
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
    },
  });
};

export const createIntegration = async (
  clerkId: string,
  token: string,
  expire: Date,
  insts_id: string,
  instagramUsername?: string,
  profilePictureUrl?: string,
  subscription?: {
    statusCode?: number;
    subscribed: boolean;
    error?: string;
    attemptedAt: Date;
  }
) => {
  const tokenDiagnostic = getInstagramTokenFormatDiagnostic(token);
  if (!tokenDiagnostic.looksUsable) {
    console.warn("[oauth] refused to create integration with invalid token", {
      clerkIdPresent: Boolean(clerkId),
      tokenFormat: tokenDiagnostic.reason,
      tokenLength: tokenDiagnostic.length,
    });
    throw new Error("invalid_instagram_token_format");
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
          instagramId: insts_id,
          webhookAccountId: insts_id,
          instagramUsername,
          profilePictureUrl,
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
  const igAccountId = integration?.instagramId;
  const tokenFormat = getInstagramTokenFormatDiagnostic(integration?.token);
  const tokenExpired =
    integration?.expiresAt && integration.expiresAt.getTime() < Date.now();
  if (!igAccountId) {
    return {
      lastWebhook: null,
      lastCommentWebhook: null,
      lastFailure: null,
      oauth: {
        tokenFormat,
        tokenExpired: Boolean(tokenExpired),
      },
    };
  }

  const [lastWebhook, lastCommentWebhook, lastFailure] = await Promise.all([
    client.webhookEvent.findFirst({
      where: { igAccountId },
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
        igAccountId,
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
        igAccountId,
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
      tokenFormat,
      tokenExpired: Boolean(tokenExpired),
      tokenUsable: tokenFormat.looksUsable && !tokenExpired,
    },
  };
};
