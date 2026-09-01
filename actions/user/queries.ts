"use server";

import { client } from "@/lib/prisma";
import { createReferralAttribution } from "@/lib/referral-program";
import type { SUBSCRIPTION_PLAN } from "@prisma/client";

const userProfileInclude = {
  subscription: true,
  integrations: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      token: true,
      expiresAt: true,
      name: true,
      instagramId: true,
      pageId: true,
      pageName: true,
      businessId: true,
      webhookAccountId: true,
      igAccountSource: true,
      instagramUsername: true,
      profilePictureUrl: true,
      oauthResolutionDiagnostics: true,
      status: true,
      reconnectRequired: true,
    },
  },
} as const;

export const findUser = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    include: userProfileInclude,
  });
};

export const findUserByEmail = async (email: string) => {
  return await client.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    include: userProfileInclude,
  });
};

export const createUser = async (
  clerkId: string,
  firstname: string,
  lastname: string,
  email: string,
  referralCode?: string | null
) => {
  return client.$transaction(async (transaction) => {
    const created = await transaction.user.create({
      data: {
        clerkId,
        firstname,
        lastname,
        email,
        subscription: {
          create: {},
        },
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        clerkId: true,
      },
    });

    await createReferralAttribution(transaction, created.id, referralCode);

    return {
      firstname: created.firstname,
      lastname: created.lastname,
      clerkId: created.clerkId,
    };
  });
};

export const findUserByCustomerId = async (customerId: string) => {
  return await client.user.findFirst({
    where: { subscription: { customerId } },
    select: { clerkId: true },
  });
};

const stripeOwnerSelect = {
  id: true,
  clerkId: true,
  subscription: {
    select: { customerId: true },
  },
} as const;

export const findStripeOwnerByClerkId = async (clerkId: string) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    select: stripeOwnerSelect,
  });
  return user
    ? { id: user.id, clerkId: user.clerkId, customerId: user.subscription?.customerId ?? null }
    : null;
};

export const findStripeOwnerByCustomerId = async (customerId: string) => {
  const user = await client.user.findFirst({
    where: { subscription: { customerId } },
    select: stripeOwnerSelect,
  });
  return user
    ? { id: user.id, clerkId: user.clerkId, customerId: user.subscription?.customerId ?? null }
    : null;
};

export const syncSubscriptionForUser = async (
  userId: string,
  props: { customerId?: string; plan?: SUBSCRIPTION_PLAN }
) => {
  return client.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscription: { select: { customerId: true } },
      },
    });
    if (!user) throw new Error("STRIPE_OWNER_MISSING");

    if (props.customerId) {
      const customerOwner = await transaction.subscription.findUnique({
        where: { customerId: props.customerId },
        select: { userId: true },
      });
      if (customerOwner && customerOwner.userId !== userId) {
        throw new Error("STRIPE_CUSTOMER_OWNERSHIP_CONFLICT");
      }
      if (
        user.subscription?.customerId &&
        user.subscription.customerId !== props.customerId
      ) {
        throw new Error("STRIPE_CUSTOMER_REASSIGNMENT_BLOCKED");
      }
    }

    return transaction.subscription.upsert({
      where: { userId },
      create: { userId, ...props },
      update: { ...props },
    });
  }, { isolationLevel: "Serializable" });
};

export const updateSubscription = async (
  clerkId: string,
  props: { customerId?: string; plan?: SUBSCRIPTION_PLAN }
) => {
  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      subscription: {
        upsert: {
          create: {
            ...props,
          },
          update: {
            ...props,
          },
        },
      },
    },
  });
};
