import { verifyCheckoutSession } from "@/actions/billing/verify-checkout";
import { dashboardPath } from "@/lib/dashboard";
import { client } from "@/lib/prisma";
import {
  parseStripeBillingInterval,
  parseStripePlan,
  stripePlanToDatabasePlan,
} from "@/lib/stripe-config";
import { resolveStripePriceId } from "@/lib/stripe-pricing";
import { stripe } from "@/lib/stripe";
import { prepareReferralCreditForCheckout } from "@/lib/referral-program";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: {
    session_id?: string;
    cancel?: string | boolean;
    plan?: string;
    interval?: string;
  };
};

function StatusCard({
  title,
  body,
  tone = "default",
}: {
  title: string;
  body: string;
  tone?: "default" | "error";
}) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-6 text-center text-slate-950 dark:bg-[#070808] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />
      <div className="ap3k-card relative z-10 flex max-w-lg flex-col items-center gap-3 rounded-3xl p-8">
        <div
          className={`grid h-14 w-14 place-items-center rounded-2xl border text-2xl ${
            tone === "error"
              ? "border-red-400/20 bg-red-500/10 text-red-500"
              : "border-orange-400/20 bg-orange-500/10 text-orange-500"
          }`}
        >
          {tone === "error" ? "!" : "↗"}
        </div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-300">{body}</p>
      </div>
    </div>
  );
}

export default async function PaymentPage({ searchParams }: Props) {
  const { cancel, session_id, plan, interval } = searchParams;

  if (session_id) {
    const subscription = await verifyCheckoutSession(session_id);
    if (subscription.status === 200 && subscription.dashboardPath) {
      redirect(`${subscription.dashboardPath}/billing`);
    }

    return (
      <StatusCard
        title="Payment verification failed"
        body="We could not verify this checkout session. Your payment may still have completed, so check Billing before trying again."
        tone="error"
      />
    );
  }

  if (cancel) {
    return (
      <StatusCard
        title="Checkout canceled"
        body="Your subscription was not changed. You can return to Pricing whenever you are ready."
      />
    );
  }

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const existing = await client.user.findUnique({
    where: { clerkId: user.id },
    select: {
      id: true,
      email: true,
      subscription: { select: { plan: true, customerId: true } },
    },
  });
  if (
    existing?.subscription?.customerId &&
    existing.subscription.plan !== "FREE"
  ) {
    redirect(`${dashboardPath(user.id)}/billing`);
  }

  const selectedPlan = parseStripePlan(plan);
  const selectedInterval = parseStripeBillingInterval(interval);
  const databasePlan = stripePlanToDatabasePlan(selectedPlan);
  const hostUrl = process.env.NEXT_PUBLIC_HOST_URL;

  let priceId: string | null = null;
  try {
    priceId = await resolveStripePriceId(selectedPlan, selectedInterval);
  } catch (err) {
    console.error("[stripe-checkout] price lookup failed", {
      plan: selectedPlan,
      interval: selectedInterval,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  if (!priceId || !hostUrl) {
    return (
      <StatusCard
        title="Checkout unavailable"
        body="This plan is not configured for checkout yet. Please try again shortly or contact support@ap3k.com."
        tone="error"
      />
    );
  }

  let checkoutUrl: string | null = null;

  try {
    const customerId = existing
      ? await prepareReferralCreditForCheckout({
          userId: existing.id,
          clerkId: user.id,
          email: existing.email,
        })
      : null;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: {
        clerkId: user.id,
        plan: databasePlan,
        interval: selectedInterval,
      },
      subscription_data: {
        metadata: {
          clerkId: user.id,
          plan: databasePlan,
          interval: selectedInterval,
        },
      },
      ...(customerId
        ? { customer: customerId }
        : { customer_email: user.emailAddresses[0]?.emailAddress }),
      success_url: `${hostUrl}/payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${hostUrl}/payment?cancel=true`,
      allow_promotion_codes: true,
    });

    checkoutUrl = session.url;
  } catch (err) {
    console.error("[stripe-checkout] failed to create checkout session", {
      plan: selectedPlan,
      interval: selectedInterval,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  // Next.js redirects are implemented by throwing an internal NEXT_REDIRECT
  // signal. Keep redirect() outside the Stripe try/catch so a successful
  // Checkout Session is never mistaken for a Stripe failure.
  if (checkoutUrl) redirect(checkoutUrl);

  return (
    <StatusCard
      title="Checkout unavailable"
      body="Stripe could not start checkout. Please try again later."
      tone="error"
    />
  );
}
