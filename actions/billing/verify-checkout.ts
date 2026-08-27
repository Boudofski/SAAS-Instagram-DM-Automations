"use server";

import { createUser, findUser, updateSubscription } from "@/actions/user/queries";
import { dashboardPath } from "@/lib/dashboard";
import { inferActiveDatabasePlan } from "@/lib/stripe-config";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";

export async function verifyCheckoutSession(sessionId: string) {
  const user = await currentUser();
  if (!user) return { status: 401 as const, error: "not_authenticated" as const };

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });

    const sessionOwner = session.metadata?.clerkId ?? session.client_reference_id;
    if (!sessionOwner) return { status: 400 as const, error: "missing_owner" as const };
    if (sessionOwner !== user.id) return { status: 403 as const, error: "user_mismatch" as const };
    if (session.status !== "complete") return { status: 400 as const, error: "session_incomplete" as const };
    if (typeof session.customer !== "string") return { status: 400 as const, error: "missing_customer" as const };

    const price = session.line_items?.data?.[0]?.price;
    const priceId = typeof price === "string" ? price : price?.id ?? null;
    const lookupKey = typeof price === "object" && price ? price.lookup_key : null;
    const plan = inferActiveDatabasePlan({
      metadataPlan: session.metadata?.plan,
      lookupKey,
      priceId,
    });

    let profile = await findUser(user.id);
    if (!profile) {
      const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
      if (!email) return { status: 400 as const, error: "missing_user_email" as const };
      await createUser(user.id, user.firstName ?? "", user.lastName ?? "", email);
      profile = await findUser(user.id);
    }

    await updateSubscription(user.id, {
      customerId: session.customer,
      plan,
    });

    return {
      status: 200 as const,
      dashboardPath: dashboardPath(profile?.clerkId ?? user.id),
      plan,
    };
  } catch (error) {
    console.error("[stripe-checkout] session verification failed", {
      sessionId,
      message: error instanceof Error ? error.message : String(error),
    });
    return { status: 500 as const, error: "verification_failed" as const };
  }
}
