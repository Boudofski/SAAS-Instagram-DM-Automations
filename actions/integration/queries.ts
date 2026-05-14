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
