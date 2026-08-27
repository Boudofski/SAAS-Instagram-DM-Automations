import { stripe } from "@/lib/stripe";
import {
  getStripePriceIdFromEnv,
  getStripePriceLookupKey,
  type StripeBillingInterval,
  type StripePlan,
} from "@/lib/stripe-config";

function getExplicitNewCatalogPriceId(
  plan: StripePlan,
  interval: StripeBillingInterval
) {
  if (plan === "BUSINESS") {
    return interval === "year"
      ? process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL
      : process.env.STRIPE_PRICE_ID_BUSINESS_MONTHLY;
  }

  return interval === "year"
    ? process.env.STRIPE_PRICE_ID_PRO_ANNUAL
    : process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
}

export async function resolveStripePriceId(
  plan: StripePlan,
  interval: StripeBillingInterval
) {
  // New catalog variables, when explicitly configured, are authoritative.
  const explicitNewCatalog = getExplicitNewCatalogPriceId(plan, interval);
  if (explicitNewCatalog) return explicitNewCatalog;

  // Prefer stable lookup keys over legacy Creator/Agency environment variables.
  // This prevents old production price IDs from silently overriding the new
  // $9/$79 Pro and $29/$279 Business catalog.
  const lookupKey = getStripePriceLookupKey(plan, interval);
  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [lookupKey],
    limit: 1,
  });
  const lookupPrice = prices.data[0]?.id;
  if (lookupPrice) return lookupPrice;

  // Last-resort compatibility for older deployments before lookup keys existed.
  return getStripePriceIdFromEnv(plan, interval) ?? null;
}
