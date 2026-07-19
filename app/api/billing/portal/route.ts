import { dashboardPath } from "@/lib/dashboard";
import { getApplicationUrl } from "@/lib/app-url";
import { client } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
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
      subscription: { select: { customerId: true } },
    },
  });

  if (!user) {
    return errorResponse(404, "user_not_found", "Your AP3K account could not be found.");
  }

  const customerId = user.subscription?.customerId;
  if (!customerId) {
    return errorResponse(409, "customer_not_linked", "No Stripe billing profile is linked to this account.");
  }

  if (!getStripeSecretKey()) {
    console.error("[stripe-portal] unavailable", {
      operation: "create_customer_portal_session",
      customerLinked: true,
    });
    return errorResponse(503, "stripe_unavailable", "Billing management is temporarily unavailable.");
  }

  try {
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
      customerLinked: true,
      ...safeStripeError(error),
    });
    return errorResponse(502, "portal_session_failed", "Could not open billing management. Please try again.");
  }
}
