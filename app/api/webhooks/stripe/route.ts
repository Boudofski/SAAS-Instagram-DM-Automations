import { findUserByCustomerId, updateSubscription } from "@/actions/user/queries";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function ok() {
  return NextResponse.json({ received: true }, { status: 200 });
}

async function syncSubscriptionFromStripeSubscription(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const plan = sub.status === "active" || sub.status === "trialing" ? "PRO" : "FREE";
  const clerkId = sub.metadata?.clerkId;

  if (clerkId) {
    await updateSubscription(clerkId, { customerId, plan });
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (user) {
    await updateSubscription(user.clerkId, { customerId, plan });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_CLIENT_SECRET;

  if (!sig || !webhookSecret || !stripeKey) {
    return NextResponse.json(
      { error: "Missing Stripe configuration" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const client = new Stripe(stripeKey);
    event = client.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe-webhook] event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const customerId = session.customer as string | null;
        if (clerkId && customerId) {
          await updateSubscription(clerkId, { customerId, plan: "PRO" });
        }
        break;
      }

      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripeSubscription(sub);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripeSubscription(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const user = await findUserByCustomerId(customerId);
        if (user) {
          await updateSubscription(user.clerkId, { plan: "FREE" });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] handler error:", err);
    // Return 200 to prevent Stripe from retrying — log the error instead
    return ok();
  }

  return ok();
}
