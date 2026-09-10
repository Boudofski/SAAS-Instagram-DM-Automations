import { dashboardPath } from "@/lib/dashboard";
import { getApplicationUrl } from "@/lib/app-url";
import { client } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { recoverOwnedStripeCustomerId } from "@/lib/stripe-customer-recovery";
import { getStripeSecretKey } from "@/lib/stripe-config";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type PortalErrorCode =
  | "not_authenticated"
  | "user_not_found"
  | "customer_not_linked"
  | "stripe_unavailable"
  | "portal_session_failed";

function errorResponse(status: number, code: PortalErrorCode, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "private, no-store" } }
  );
}

function safeStripeError(error: unknown) {
  if (typeof error !== "object" || error === null) return {};
  const value = error as { type?: unknown; code?: unknown };
  return {
    stripeErrorType: typeof value.type === "string" ? value.type : undefined,
    stripeErrorCode: typeof value.code === "string" ? value.code : undefined,
  };
}

export async function POST(_request: Request) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return errorResponse(401, "not_authenticated", "Sign in to manage billing.");
  }

  const user = await client.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: {
      clerkId: true,
      id: true,
      email: true,
      subscription: { select: { customerId: true, plan: true } },
    },
  });

  if (!user) {
    return errorResponse(404, "user_not_found", "Your AP3K account could not be found.");
  }

  if (!getStripeSecretKey()) {
    console.error("[stripe-portal] unavailable", {
      operation: "create_customer_portal_session",
      customerLinked: Boolean(user.subscription?.customerId),
    });
    return errorResponse(503, "stripe_unavailable", "Billing management is temporarily unavailable.");
  }

  try {
    let customerId = user.subscription?.customerId ?? null;
    if (!customerId) {
      customerId = await recoverOwnedStripeCustomerId(stripe, {
        clerkId: user.clerkId,
        email: user.email,
      });

      if (customerId) {
        await client.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            customerId,
            plan: user.subscription?.plan ?? "FREE",
          },
          update: { customerId },
        });
      }
    }

    if (!customerId) {
      return errorResponse(
        409,
        "customer_not_linked",
        "No Stripe subscription is linked to this AP3K account. If you were charged, contact support@ap3k.com with the billing email."
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getApplicationUrl()}${dashboardPath(user.clerkId)}/billing`,
    });

    if (!session.url) {
      throw new Error("Stripe portal session URL missing");
    }

    return NextResponse.json(
      { url: session.url },
      { status: 200, headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[stripe-portal] session creation failed", {
      operation: "create_customer_portal_session",
      customerLinked: Boolean(user.subscription?.customerId),
      ...safeStripeError(error),
    });
    return errorResponse(502, "portal_session_failed", "Could not open billing management. Please try again.");
  }
}
