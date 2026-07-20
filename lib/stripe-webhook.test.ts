import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import {
  StripeOwnershipError,
  StripeWebhookInputError,
  type StripeOwner,
  type StripeWebhookDependencies,
  processStripeEvent,
  resolveStripeOwner,
} from "./stripe-webhook";

const USER_A: StripeOwner = {
  id: "11111111-1111-4111-8111-111111111111",
  clerkId: "user_prod_alpha",
  customerId: "cus_alpha",
};
const USER_B: StripeOwner = {
  id: "22222222-2222-4222-8222-222222222222",
  clerkId: "user_prod_beta",
  customerId: "cus_beta",
};

function dependencies(input: {
  clerkOwners?: Record<string, StripeOwner>;
  customerOwners?: Record<string, StripeOwner>;
}) {
  const subscriptions = new Map<string, { customerId?: string; plan?: "PRO" | "FREE" }>();
  const warnStaleMetadata = vi.fn();
  const syncSubscription = vi.fn(
    async (userId: string, props: { customerId?: string; plan?: "PRO" | "FREE" }) => {
      subscriptions.set(userId, { ...subscriptions.get(userId), ...props });
    }
  );
  const value: StripeWebhookDependencies = {
    findOwnerByClerkId: async (clerkId) => input.clerkOwners?.[clerkId] ?? null,
    findOwnerByCustomerId: async (customerId) =>
      input.customerOwners?.[customerId] ?? null,
    syncSubscription,
    warnStaleMetadata,
  };
  return { value, subscriptions, syncSubscription, warnStaleMetadata };
}

function event(type: string, object: unknown, id = "evt_test") {
  return { id, type, data: { object } } as Stripe.Event;
}

function checkout(input: { clerkId?: string; customer?: string | null }) {
  return {
    id: "cs_test",
    customer: input.customer ?? null,
    metadata: input.clerkId ? { clerkId: input.clerkId } : {},
  } as unknown as Stripe.Checkout.Session;
}

function subscription(input: {
  clerkId?: string;
  customer?: string | null;
  status?: Stripe.Subscription.Status;
}) {
  return {
    id: "sub_test",
    customer: input.customer ?? null,
    metadata: input.clerkId ? { clerkId: input.clerkId } : {},
    status: input.status ?? "active",
  } as unknown as Stripe.Subscription;
}

describe("resolveStripeOwner", () => {
  it("resolves current metadata and customer ownership when both match", async () => {
    const deps = dependencies({
      clerkOwners: { [USER_A.clerkId]: USER_A },
      customerOwners: { cus_alpha: USER_A },
    });
    await expect(
      resolveStripeOwner(
        {
          eventType: "checkout.session.completed",
          metadataClerkId: USER_A.clerkId,
          customerId: "cus_alpha",
          allowInitialCustomerBinding: true,
        },
        deps.value
      )
    ).resolves.toMatchObject({ owner: USER_A, source: "metadata-and-customer" });
  });

  it("uses customer ownership when Clerk metadata is stale", async () => {
    const deps = dependencies({ customerOwners: { cus_alpha: USER_A } });
    const result = await resolveStripeOwner(
      {
        eventType: "customer.subscription.updated",
        metadataClerkId: "user_dev_stale",
        customerId: "cus_alpha",
        allowInitialCustomerBinding: false,
      },
      deps.value
    );
    expect(result).toMatchObject({ owner: USER_A, source: "customer" });
    expect(deps.warnStaleMetadata).toHaveBeenCalledOnce();
    const warning = deps.warnStaleMetadata.mock.calls[0][0];
    expect(JSON.stringify(warning)).not.toContain("user_dev_stale");
    expect(JSON.stringify(warning)).not.toContain("cus_alpha");
  });

  it("fails closed when metadata and customer resolve to different users", async () => {
    const deps = dependencies({
      clerkOwners: { [USER_A.clerkId]: USER_A },
      customerOwners: { cus_beta: USER_B },
    });
    await expect(
      resolveStripeOwner(
        {
          eventType: "checkout.session.completed",
          metadataClerkId: USER_A.clerkId,
          customerId: "cus_beta",
          allowInitialCustomerBinding: true,
        },
        deps.value
      )
    ).rejects.toMatchObject({ code: "STRIPE_OWNERSHIP_CONFLICT" });
  });

  it("returns a retriable ownership failure when neither source resolves", async () => {
    const deps = dependencies({});
    await expect(
      resolveStripeOwner(
        {
          eventType: "customer.subscription.updated",
          metadataClerkId: "user_dev_stale",
          customerId: "cus_missing",
          allowInitialCustomerBinding: false,
        },
        deps.value
      )
    ).rejects.toBeInstanceOf(StripeOwnershipError);
  });

  it("allows an initial customer binding only for an unbound metadata owner", async () => {
    const unbound = { ...USER_A, customerId: null };
    const deps = dependencies({ clerkOwners: { [USER_A.clerkId]: unbound } });
    await expect(
      resolveStripeOwner(
        {
          eventType: "customer.subscription.created",
          metadataClerkId: USER_A.clerkId,
          customerId: "cus_first",
          allowInitialCustomerBinding: true,
        },
        deps.value
      )
    ).resolves.toMatchObject({ source: "initial-metadata-binding" });

    await expect(
      resolveStripeOwner(
        {
          eventType: "customer.subscription.updated",
          metadataClerkId: USER_A.clerkId,
          customerId: "cus_first",
          allowInitialCustomerBinding: false,
        },
        deps.value
      )
    ).rejects.toMatchObject({ code: "STRIPE_CUSTOMER_BINDING_MISSING" });
  });

  it("blocks first binding when the metadata owner already has a different customer", async () => {
    const deps = dependencies({ clerkOwners: { [USER_A.clerkId]: USER_A } });
    await expect(
      resolveStripeOwner(
        {
          eventType: "checkout.session.completed",
          metadataClerkId: USER_A.clerkId,
          customerId: "cus_different",
          allowInitialCustomerBinding: true,
        },
        deps.value
      )
    ).rejects.toMatchObject({ code: "STRIPE_CUSTOMER_BINDING_MISSING" });
    expect(deps.syncSubscription).not.toHaveBeenCalled();
  });
});

describe("processStripeEvent", () => {
  it("uses customer ownership for checkout completion with stale metadata", async () => {
    const deps = dependencies({ customerOwners: { cus_alpha: USER_A } });
    await processStripeEvent(
      event(
        "checkout.session.completed",
        checkout({ clerkId: "user_dev_stale", customer: "cus_alpha" })
      ),
      deps.value
    );
    expect(deps.syncSubscription).toHaveBeenCalledWith(USER_A.id, {
      customerId: "cus_alpha",
      plan: "PRO",
    });
  });

  it("uses customer ownership for a subscription update with stale metadata", async () => {
    const deps = dependencies({ customerOwners: { cus_alpha: USER_A } });
    await processStripeEvent(
      event(
        "customer.subscription.updated",
        subscription({ clerkId: "user_dev_stale", customer: "cus_alpha" })
      ),
      deps.value
    );
    expect(deps.syncSubscription).toHaveBeenCalledWith(USER_A.id, {
      customerId: "cus_alpha",
      plan: "PRO",
    });
  });

  it("preserves subscription deletion semantics through customer ownership", async () => {
    const deps = dependencies({ customerOwners: { cus_alpha: USER_A } });
    await processStripeEvent(
      event(
        "customer.subscription.deleted",
        subscription({ clerkId: "user_dev_stale", customer: "cus_alpha" })
      ),
      deps.value
    );
    expect(deps.syncSubscription).toHaveBeenCalledWith(USER_A.id, {
      customerId: "cus_alpha",
      plan: "FREE",
    });
  });

  it("is idempotent when Stripe redelivers the same event", async () => {
    const deps = dependencies({ customerOwners: { cus_alpha: USER_A } });
    const repeated = event(
      "customer.subscription.updated",
      subscription({ clerkId: USER_A.clerkId, customer: "cus_alpha" }),
      "evt_repeated"
    );
    await processStripeEvent(repeated, deps.value);
    await processStripeEvent(repeated, deps.value);
    expect(deps.subscriptions.size).toBe(1);
    expect(deps.subscriptions.get(USER_A.id)).toEqual({
      customerId: "cus_alpha",
      plan: "PRO",
    });
  });

  it("does not update either user when ownership conflicts", async () => {
    const deps = dependencies({
      clerkOwners: { [USER_A.clerkId]: USER_A },
      customerOwners: { cus_beta: USER_B },
    });
    await expect(
      processStripeEvent(
        event(
          "checkout.session.completed",
          checkout({ clerkId: USER_A.clerkId, customer: "cus_beta" })
        ),
        deps.value
      )
    ).rejects.toBeInstanceOf(StripeOwnershipError);
    expect(deps.syncSubscription).not.toHaveBeenCalled();
  });

  it("classifies a signed handled event without a customer ID as malformed", async () => {
    const deps = dependencies({ clerkOwners: { [USER_A.clerkId]: USER_A } });
    await expect(
      processStripeEvent(
        event(
          "checkout.session.completed",
          checkout({ clerkId: USER_A.clerkId, customer: null })
        ),
        deps.value
      )
    ).rejects.toBeInstanceOf(StripeWebhookInputError);
    expect(deps.syncSubscription).not.toHaveBeenCalled();
  });
});
