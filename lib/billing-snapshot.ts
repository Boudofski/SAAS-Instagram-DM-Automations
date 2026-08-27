import { stripe } from "@/lib/stripe";

export type BillingSnapshot = {
  status: string;
  interval: "month" | "year" | null;
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  lookupKey: string | null;
};

export async function getBillingSnapshot(
  customerId?: string | null
): Promise<BillingSnapshot | null> {
  if (!customerId) return null;

  try {
    const result = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    const subscription =
      result.data.find((item) =>
        ["active", "trialing", "past_due", "unpaid"].includes(item.status)
      ) ?? result.data[0];
    if (!subscription) return null;

    const price = subscription.items.data[0]?.price;
    const interval = price?.recurring?.interval;
    const periodEnd = (subscription as any).current_period_end;

    return {
      status: subscription.status,
      interval: interval === "year" ? "year" : interval === "month" ? "month" : null,
      renewsAt:
        typeof periodEnd === "number"
          ? new Date(periodEnd * 1000).toISOString()
          : null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      lookupKey: price?.lookup_key ?? null,
    };
  } catch (error) {
    console.error("[billing] could not load Stripe subscription snapshot", {
      customerIdPresent: Boolean(customerId),
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
