"use server";

import { client } from "@/lib/prisma";

export const updateIntegration = async (
  token: string,
  expire: Date,
  id: string,
  instagramId?: string,
  instagramUsername?: string,
  profilePictureUrl?: string
) => {
  return await client.integrations.update({
    where: { id },
    data: {
      token,
      expiresAt: expire,
      instagramId,
      instagramUsername,
      profilePictureUrl,
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
  profilePictureUrl?: string
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
          instagramUsername,
          profilePictureUrl,
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
        select: { instagramId: true },
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
      where: { igAccountId, eventType: "COMMENT_WEBHOOK_RECEIVED" },
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
          { eventType: "SIGNATURE_VERIFICATION_FAILED" },
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

  return { lastWebhook, lastCommentWebhook, lastFailure };
};
