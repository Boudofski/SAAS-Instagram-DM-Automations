import { stripe } from "@/lib/stripe";
import {
  getStripePriceIdFromEnv,
  getStripePriceLookupKey,
  type StripeBillingInterval,
  type StripePlan,
} from "@/lib/stripe-config";

export async function resolveStripePriceId(
  plan: StripePlan,
  interval: StripeBillingInterval
) {
  const configured = getStripePriceIdFromEnv(plan, interval);
  if (configured) return configured;

  const lookupKey = getStripePriceLookupKey(plan, interval);
  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [lookupKey],
    limit: 1,
  });

  return prices.data[0]?.id ?? null;
}
