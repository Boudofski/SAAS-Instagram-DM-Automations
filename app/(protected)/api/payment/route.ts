import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ status: 401 }, { status: 401 });

  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
  const hostUrl = process.env.NEXT_PUBLIC_HOST_URL;

  if (!priceId || !hostUrl) {
    return NextResponse.json(
      { status: 400, error: "Missing Stripe checkout configuration" },
      { status: 400 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { clerkId: user.id },
    subscription_data: {
      metadata: { clerkId: user.id },
    },
    customer_email: user.emailAddresses[0]?.emailAddress,
    success_url: `${hostUrl}/payment?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${hostUrl}/payment?cancel=true`,
  });

  if (session) {
    return NextResponse.json({
      status: 200,
      session_url: session.url,
    });
  }

  return NextResponse.json({ status: 400 });
}
