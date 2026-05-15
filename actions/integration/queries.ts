"use server";

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
          instagramId: true,
          webhookSubscriptionLastAttemptedAt: true,
          webhookSubscriptionStatusCode: true,
          webhookSubscriptionSubscribed: true,
          webhookSubscriptionError: true,
        },
      },
    },
  });

  const igAccountId = user?.integrations[0]?.instagramId;
  if (!igAccountId) {
    return {
      lastWebhook: null,
      lastCommentWebhook: null,
      lastFailure: null,
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
      lastAttemptedAt: user.integrations[0]?.webhookSubscriptionLastAttemptedAt ?? null,
      statusCode: user.integrations[0]?.webhookSubscriptionStatusCode ?? null,
      subscribed: user.integrations[0]?.webhookSubscriptionSubscribed ?? null,
      error: user.integrations[0]?.webhookSubscriptionError ?? null,
    },
  };
};
