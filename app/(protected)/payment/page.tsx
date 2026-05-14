import { onSubscribe } from "@/actions/user";
import { getStripePriceId, parseStripePlan } from "@/lib/stripe-config";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  searchParams: {
    session_id?: string;
    cancel?: boolean;
    plan?: string;
  };
};

function PaymentVerificationFailed() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-3xl font-bold">Payment verification failed</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        We could not verify this checkout session. Your card may still have
        completed successfully, so please refresh your dashboard before trying
        again.
      </p>
    </div>
  );
}

async function Page({ searchParams: { cancel, session_id, plan } }: Props) {
  if (session_id) {
    const subscription = await onSubscribe(session_id);

    if (subscription.status === 200 && subscription.dashboardPath) {
      return redirect(subscription.dashboardPath);
    }

    return <PaymentVerificationFailed />;
  }

  if (cancel) {
    return (
      <div className="flex flex-col justify-center items-center h-screen w-full gap-3 text-center">
        <h4 className="text-3xl font-bold">Checkout canceled</h4>
        <p className="text-muted-foreground">Your subscription was not changed.</p>
      </div>
    );
  }

  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const selectedPlan = parseStripePlan(plan);
  const priceId = getStripePriceId(selectedPlan);
  const hostUrl = process.env.NEXT_PUBLIC_HOST_URL;

  if (!priceId || !hostUrl) {
    return (
      <div className="flex flex-col justify-center items-center h-screen w-full gap-3 text-center">
        <h4 className="text-3xl font-bold">Checkout unavailable</h4>
        <p className="text-muted-foreground">
          Stripe checkout is not configured for this environment.
        </p>
      </div>
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { clerkId: user.id, plan: selectedPlan },
      subscription_data: {
        metadata: { clerkId: user.id, plan: selectedPlan },
      },
      customer_email: user.emailAddresses[0]?.emailAddress,
      success_url: `${hostUrl}/payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${hostUrl}/payment?cancel=true`,
    });
  } catch (err) {
    console.error("[stripe-checkout] failed to create checkout session", {
      plan: selectedPlan,
      message: err instanceof Error ? err.message : String(err),
    });
    return (
      <div className="flex flex-col justify-center items-center h-screen w-full gap-3 text-center">
        <h4 className="text-3xl font-bold">Checkout unavailable</h4>
        <p className="text-muted-foreground">
          Stripe checkout could not be started. Please try again later.
        </p>
      </div>
    );
  }

  if (session.url) redirect(session.url);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full gap-3 text-center">
      <h4 className="text-3xl font-bold">Checkout unavailable</h4>
      <p className="text-muted-foreground">Stripe did not return a checkout URL.</p>
    </div>
  );
}

export default Page;
