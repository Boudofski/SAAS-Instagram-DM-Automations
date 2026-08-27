import type Stripe from "stripe";
import {
  findStripeOwnerByClerkId,
  findStripeOwnerByCustomerId,
  syncSubscriptionForUser,
} from "@/actions/user/queries";
import { inferActiveDatabasePlan } from "@/lib/stripe-config";
import type { SUBSCRIPTION_PLAN } from "@prisma/client";
import { createHash } from "node:crypto";

export type StripeOwner = {
  id: string;
  clerkId: string;
  customerId: string | null;
};

export type StripeWebhookDependencies = {
  findOwnerByClerkId(clerkId: string): Promise<StripeOwner | null>;
  findOwnerByCustomerId(customerId: string): Promise<StripeOwner | null>;
  syncSubscription(
    userId: string,
    props: { customerId?: string; plan?: SUBSCRIPTION_PLAN }
  ): Promise<unknown>;
  warnStaleMetadata(details: {
    eventType: string;
    clerkIdFingerprint: string;
    customerIdFingerprint: string;
  }): void;
};

export class StripeOwnershipError extends Error {
  constructor(
    public readonly code:
      | "STRIPE_OWNER_UNRESOLVED"
      | "STRIPE_OWNERSHIP_CONFLICT"
      | "STRIPE_CUSTOMER_BINDING_MISSING"
  ) {
    super(code);
    this.name = "StripeOwnershipError";
  }
}

export class StripeWebhookInputError extends Error {
  constructor(public readonly code: "STRIPE_CUSTOMER_ID_MISSING") {
    super(code);
    this.name = "StripeWebhookInputError";
  }
}

const defaultDependencies: StripeWebhookDependencies = {
  findOwnerByClerkId: findStripeOwnerByClerkId,
  findOwnerByCustomerId: findStripeOwnerByCustomerId,
  syncSubscription: syncSubscriptionForUser,
  warnStaleMetadata(details) {
    console.warn("[stripe-webhook] stale Clerk metadata", details);
  },
};

export function fingerprintExternalId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function stripeId(
  value: string | { id: string } | null | undefined
): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    value.id.trim()
  ) {
    return value.id;
  }
  return null;
}

function metadataClerkId(metadata?: Stripe.Metadata | null) {
  const value = metadata?.clerkId;
  return typeof value === "string" && value.trim() ? value : null;
}

function activePlanForSubscription(subscription: Stripe.Subscription): SUBSCRIPTION_PLAN {
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return "FREE";
  }

  const price = subscription.items?.data?.[0]?.price;
  return inferActiveDatabasePlan({
    metadataPlan: subscription.metadata?.plan,
    lookupKey: price?.lookup_key,
    priceId: price?.id,
  });
}

async function syncStripeSubscription(
  eventType: string,
  subscription: Stripe.Subscription,
  allowInitialCustomerBinding: boolean,
  dependencies: StripeWebhookDependencies
) {
  const customerId = stripeId(subscription.customer);
  if (!customerId) {
    throw new StripeWebhookInputError("STRIPE_CUSTOMER_ID_MISSING");
  }
  const resolution = await resolveStripeOwner(
    {
      eventType,
      metadataClerkId: metadataClerkId(subscription.metadata),
      customerId,
      allowInitialCustomerBinding,
    },
    dependencies
  );
  await dependencies.syncSubscription(resolution.owner.id, {
    customerId,
    plan: activePlanForSubscription(subscription),
  });
  return resolution;
}

export async function resolveStripeOwner(
  input: {
    eventType: string;
    metadataClerkId: string | null;
    customerId: string | null;
    allowInitialCustomerBinding: boolean;
  },
  dependencies: StripeWebhookDependencies = defaultDependencies
) {
  const [metadataOwner, customerOwner] = await Promise.all([
    input.metadataClerkId
      ? dependencies.findOwnerByClerkId(input.metadataClerkId)
      : Promise.resolve(null),
    input.customerId
      ? dependencies.findOwnerByCustomerId(input.customerId)
      : Promise.resolve(null),
  ]);

  if (metadataOwner && customerOwner) {
    if (metadataOwner.id !== customerOwner.id) {
      throw new StripeOwnershipError("STRIPE_OWNERSHIP_CONFLICT");
    }
    return { owner: customerOwner, source: "metadata-and-customer" as const };
  }

  if (customerOwner) {
    if (input.metadataClerkId && !metadataOwner && input.customerId) {
      dependencies.warnStaleMetadata({
        eventType: input.eventType,
        clerkIdFingerprint: fingerprintExternalId(input.metadataClerkId),
        customerIdFingerprint: fingerprintExternalId(input.customerId),
      });
    }
    return { owner: customerOwner, source: "customer" as const };
  }

  if (metadataOwner) {
    if (
      input.allowInitialCustomerBinding &&
      input.customerId &&
      metadataOwner.customerId === null
    ) {
      return { owner: metadataOwner, source: "initial-metadata-binding" as const };
    }
    throw new StripeOwnershipError("STRIPE_CUSTOMER_BINDING_MISSING");
  }

  throw new StripeOwnershipError("STRIPE_OWNER_UNRESOLVED");
}

export async function processStripeEvent(
  event: Stripe.Event,
  dependencies: StripeWebhookDependencies = defaultDependencies
) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = stripeId(session.customer);
      if (!customerId) {
        throw new StripeWebhookInputError("STRIPE_CUSTOMER_ID_MISSING");
      }
      const resolution = await resolveStripeOwner(
        {
          eventType: event.type,
          metadataClerkId: metadataClerkId(session.metadata),
          customerId,
          allowInitialCustomerBinding: true,
        },
        dependencies
      );
      await dependencies.syncSubscription(resolution.owner.id, {
        customerId,
        plan: inferActiveDatabasePlan({ metadataPlan: session.metadata?.plan }),
      });
      return { outcome: "processed" as const, source: resolution.source };
    }

    case "customer.subscription.created": {
      const resolution = await syncStripeSubscription(
        event.type,
        event.data.object as Stripe.Subscription,
        true,
        dependencies
      );
      return { outcome: "processed" as const, source: resolution.source };
    }

    case "customer.subscription.updated": {
      const resolution = await syncStripeSubscription(
        event.type,
        event.data.object as Stripe.Subscription,
        false,
        dependencies
      );
      return { outcome: "processed" as const, source: resolution.source };
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = stripeId(subscription.customer);
      if (!customerId) {
        throw new StripeWebhookInputError("STRIPE_CUSTOMER_ID_MISSING");
      }

      let resolution;
      try {
        resolution = await resolveStripeOwner(
          {
            eventType: event.type,
            metadataClerkId: metadataClerkId(subscription.metadata),
            customerId,
            allowInitialCustomerBinding: false,
          },
          dependencies
        );
      } catch (error) {
        if (
          error instanceof StripeOwnershipError &&
          error.code === "STRIPE_OWNER_UNRESOLVED"
        ) {
          return {
            outcome: "ignored" as const,
            source: "unowned-deleted-customer" as const,
          };
        }
        throw error;
      }

      await dependencies.syncSubscription(resolution.owner.id, {
        customerId,
        plan: "FREE",
      });
      return { outcome: "processed" as const, source: resolution.source };
    }

    default:
      return { outcome: "ignored" as const };
  }
}
