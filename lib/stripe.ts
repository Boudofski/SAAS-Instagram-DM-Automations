import Stripe from "stripe";

let _instance: Stripe | null = null;

function getInstance(): Stripe {
  if (!_instance) {
    const key = process.env.STRIPE_CLIENT_SECRET;
    if (!key) throw new Error("STRIPE_CLIENT_SECRET is not configured");
    _instance = new Stripe(key);
  }
  return _instance;
}

// Lazy proxy — Stripe is only instantiated when first used at runtime,
// not at module-import time (avoids Next.js build failures when env vars are absent).
export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string) {
    return (getInstance() as any)[prop];
  },
});
