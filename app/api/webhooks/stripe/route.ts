import { findUserByCustomerId, updateSubscription } from "@/actions/user/queries";
import { getStripeSecretKey } from "@/lib/stripe-config";
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
    console.log(
      `[stripe-webhook] subscription ${sub.id} synced by clerk metadata: plan=${plan}`
    );
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (user) {
    await updateSubscription(user.clerkId, { customerId, plan });
    console.log(
      `[stripe-webhook] subscription ${sub.id} synced by customer: plan=${plan}`
    );
    return;
  }

  console.warn(
    `[stripe-webhook] subscription ${sub.id} could not be matched to a user`
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = getStripeSecretKey();

  if (!sig || !webhookSecret || !stripeKey) {
    console.error("[stripe-webhook] missing configuration or signature", {
      hasSignature: Boolean(sig),
      hasWebhookSecret: Boolean(webhookSecret),
      hasStripeKey: Boolean(stripeKey),
    });
    return NextResponse.json(
      { error: "Missing Stripe configuration" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const client = new Stripe(stripeKey);
    event = client.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(
      "[stripe-webhook] invalid signature:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe-webhook] event: ${event.type} id=${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const customerId = session.customer as string | null;
        if (clerkId && customerId) {
          await updateSubscription(clerkId, { customerId, plan: "PRO" });
          console.log(
            `[stripe-webhook] checkout session ${session.id} upgraded user from metadata`
          );
        } else {
          console.warn(
            `[stripe-webhook] checkout session ${session.id} missing clerkId or customer`
          );
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
          console.log(
            `[stripe-webhook] subscription ${sub.id} deleted; plan reverted to FREE`
          );
        } else {
          console.warn(
            `[stripe-webhook] deleted subscription ${sub.id} could not be matched to a user`
          );
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
