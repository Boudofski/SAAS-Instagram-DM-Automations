import { onSubscribe } from "@/actions/user";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  searchParams: {
    session_id?: string;
    cancel?: boolean;
  };
};

async function Page({ searchParams: { cancel, session_id } }: Props) {
  if (session_id) {
    const customer = await onSubscribe(session_id);

    if (customer.status === 200) {
      return redirect("/dashboard");
    }
    return (
      <div className="flex flex-col justify-center items-center h-screen w-full">
        <h4 className="text-5xl font-bold">404</h4>
        <p className="text-xl font-bold">Oppose! Something went wrong</p>
      </div>
    );
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

  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
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

  if (session.url) redirect(session.url);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full gap-3 text-center">
      <h4 className="text-3xl font-bold">Checkout unavailable</h4>
      <p className="text-muted-foreground">Stripe did not return a checkout URL.</p>
    </div>
  );
}

export default Page;
