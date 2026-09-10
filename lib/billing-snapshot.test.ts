import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSubscriptionList = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    subscriptions: {
      list: (...args: unknown[]) => mockSubscriptionList(...args),
    },
  },
}));

import {
  getBillingLookup,
  isManageableSubscriptionStatus,
} from "@/lib/billing-snapshot";

describe("billing subscription lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not confuse a Stripe customer with a Stripe subscription", async () => {
    mockSubscriptionList.mockResolvedValue({ data: [] });

    await expect(getBillingLookup("cus_without_subscription")).resolves.toEqual({
      state: "none",
      snapshot: null,
    });
  });

  it("returns the manageable subscription before historical subscriptions", async () => {
    mockSubscriptionList.mockResolvedValue({
      data: [
        {
          status: "canceled",
          cancel_at_period_end: false,
          current_period_end: 1,
          items: { data: [{ price: { recurring: { interval: "month" }, lookup_key: "pro_monthly" } }] },
        },
        {
          status: "active",
          cancel_at_period_end: false,
          current_period_end: 1_800_000_000,
          items: { data: [{ price: { recurring: { interval: "year" }, lookup_key: "business_yearly" } }] },
        },
      ],
    });

    await expect(getBillingLookup("cus_paid")).resolves.toMatchObject({
      state: "subscription",
      snapshot: {
        status: "active",
        interval: "year",
        lookupKey: "business_yearly",
      },
    });
  });

  it("reports Stripe lookup failures instead of treating them as internal access", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockSubscriptionList.mockRejectedValue(new Error("temporary Stripe failure"));

    await expect(getBillingLookup("cus_paid")).resolves.toEqual({
      state: "unavailable",
      snapshot: null,
    });
  });

  it("recognizes subscription states that remain manageable", () => {
    expect(isManageableSubscriptionStatus("active")).toBe(true);
    expect(isManageableSubscriptionStatus("trialing")).toBe(true);
    expect(isManageableSubscriptionStatus("past_due")).toBe(true);
    expect(isManageableSubscriptionStatus("canceled")).toBe(false);
  });
});
