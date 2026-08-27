import { client } from "@/lib/prisma";
import {
  parseStripeBillingInterval,
  parseStripePlan,
  stripePlanToDatabasePlan,
} from "@/lib/stripe-config";
import { resolveStripePriceId } from "@/lib/stripe-pricing";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ status: 401 }, { status: 401 });

  const plan = parseStripePlan(req.nextUrl.searchParams.get("plan") ?? undefined);
  const interval = parseStripeBillingInterval(
    req.nextUrl.searchParams.get("interval") ?? undefined
  );
  const databasePlan = stripePlanToDatabasePlan(plan);
  const hostUrl = process.env.NEXT_PUBLIC_HOST_URL;

  const existing = await client.user.findUnique({
    where: { clerkId: user.id },
    select: { subscription: { select: { plan: true, customerId: true } } },
  });
  if (
    existing?.subscription?.customerId &&
    existing.subscription.plan !== "FREE"
  ) {
    return NextResponse.json(
      {
        status: 409,
        error: "An active paid subscription already exists. Manage your plan from Billing.",
      },
      { status: 409 }
    );
  }

  let priceId: string | null = null;
  try {
    priceId = await resolveStripePriceId(plan, interval);
  } catch (err) {
    console.error("[stripe-checkout] price lookup failed", {
      plan,
      interval,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  if (!priceId || !hostUrl) {
    return NextResponse.json(
      { status: 400, error: "Missing Stripe checkout configuration" },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { clerkId: user.id, plan: databasePlan, interval },
      subscription_data: {
        metadata: { clerkId: user.id, plan: databasePlan, interval },
      },
      customer_email: user.emailAddresses[0]?.emailAddress,
      success_url: `${hostUrl}/payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${hostUrl}/payment?cancel=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ status: 200, session_url: session.url });
  } catch (err) {
    console.error("[stripe-checkout] failed to create checkout session", {
      plan,
      interval,
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { status: 500, error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
