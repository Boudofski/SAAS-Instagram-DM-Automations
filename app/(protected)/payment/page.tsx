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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 text-center text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />
      <div className="ap3k-card relative z-10 flex max-w-lg flex-col items-center gap-3 rounded-3xl p-8">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-400/20 bg-red-500/10 text-2xl text-red-300">
        !
      </div>
      <h1 className="text-3xl font-black">Payment verification failed</h1>
      <p className="max-w-md text-sm leading-relaxed text-rf-muted">
        We could not verify this checkout session. Your card may still have
        completed successfully, so please refresh your dashboard before trying
        again.
      </p>
      </div>
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
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 text-center text-rf-text">
        <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />
        <div className="ap3k-card relative z-10 rounded-3xl p-8">
        <h4 className="text-3xl font-black">Checkout canceled</h4>
        <p className="mt-3 text-rf-muted">Your subscription was not changed.</p>
        </div>
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
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 text-center text-rf-text">
        <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />
        <div className="ap3k-card relative z-10 rounded-3xl p-8">
        <h4 className="text-3xl font-black">Checkout unavailable</h4>
        <p className="mt-3 text-rf-muted">
          Stripe checkout is not configured for this environment.
        </p>
        </div>
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
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 text-center text-rf-text">
        <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />
        <div className="ap3k-card relative z-10 rounded-3xl p-8">
        <h4 className="text-3xl font-black">Checkout unavailable</h4>
        <p className="mt-3 text-rf-muted">
          Stripe checkout could not be started. Please try again later.
        </p>
        </div>
      </div>
    );
  }

  if (session.url) redirect(session.url);

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 text-center text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />
      <div className="ap3k-card relative z-10 rounded-3xl p-8">
      <h4 className="text-3xl font-black">Checkout unavailable</h4>
      <p className="mt-3 text-rf-muted">Stripe did not return a checkout URL.</p>
      </div>
    </div>
  );
}

export default Page;
