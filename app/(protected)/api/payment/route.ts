import { getStripePriceId, parseStripePlan } from "@/lib/stripe-config";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ status: 401 }, { status: 401 });

  const plan = parseStripePlan(req.nextUrl.searchParams.get("plan") ?? undefined);
  const priceId = getStripePriceId(plan);
  const hostUrl = process.env.NEXT_PUBLIC_HOST_URL;

  if (!priceId || !hostUrl) {
    return NextResponse.json(
      { status: 400, error: "Missing Stripe checkout configuration" },
      { status: 400 }
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { clerkId: user.id, plan },
      subscription_data: {
        metadata: { clerkId: user.id, plan },
      },
      customer_email: user.emailAddresses[0]?.emailAddress,
      success_url: `${hostUrl}/payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${hostUrl}/payment?cancel=true`,
    });
  } catch (err) {
    console.error("[stripe-checkout] failed to create checkout session", {
      plan,
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { status: 500, error: "Failed to create checkout session" },
      { status: 500 }
    );
  }

  if (session) {
    return NextResponse.json({
      status: 200,
      session_url: session.url,
    });
  }

  return NextResponse.json({ status: 400 });
}
