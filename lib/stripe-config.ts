export type StripePlan = "creator" | "agency";

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_CLIENT_SECRET;
}

export function getStripePriceId(plan: StripePlan) {
  if (plan === "agency") return process.env.STRIPE_PRICE_ID_AGENCY;

  return (
    process.env.STRIPE_PRICE_ID_CREATOR ??
    process.env.STRIPE_SUBSCRIPTION_PRICE_ID
  );
}

export function parseStripePlan(value: string | string[] | undefined): StripePlan {
  return value === "agency" ? "agency" : "creator";
}
