"use server";

import { refreshToken } from "@/lib/fetch";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateIntegration } from "../integration/queries";
import { createUser, findUser, updateSubscription } from "./queries";

const onboardingSkippedCookie = (clerkId: string) =>
  `ap3k_onboarding_skipped_${clerkId}`;

export const onCurrentUser = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  return user;
};

export const onboardUser = async () => {
  const user = await onCurrentUser();

  try {
    const found = await findUser(user.id);

    if (found) {
      if (found.integrations.length > 0) {
        const today = new Date();
        const time_left =
          found.integrations[0].expiresAt?.getTime()! - today.getTime();

        const days = Math.round(time_left / (1000 * 3600 * 24));

        if (days < 5) {
          console.log("refresh");

          const refresh = await refreshToken(found.integrations[0].token);
          const today = new Date();
          const expire_date = today.setDate(today.getDate() + 60);

          const update_token = await updateIntegration(
            refresh.access_token,
            new Date(expire_date),
            found.integrations[0].id
          );

          if (!update_token) {
            console.log("Failed to update token");
          }
        }
      }
      return {
        status: 200,
        data: {
          firstname: found.firstname,
          lastname: found.lastname,
        },
      };
    }
    const created = await createUser(
      user.id,
      user.firstName!,
      user.lastName!,
      user.emailAddresses[0].emailAddress
    );

    console.log("🧊🧊🧊");

    return { status: 201, data: created };
  } catch (error: any) {
    return { status: 500, data: error.message };
  }
};

export const onUserInfo = async () => {
  const user = await onCurrentUser();

  try {
    const profile = await findUser(user.id);
    if (profile) return { status: 200, data: profile };

    return { status: 404 };
  } catch (error: any) {
    return { status: 500 };
  }
};

export const skipOnboarding = async () => {
  const user = await onCurrentUser();

  cookies().set(onboardingSkippedCookie(user.id), "true", {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/dashboard");
};

export const onSubscribe = async (session_id: string) => {
  const user = await onCurrentUser();

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session) {
      const sessionOwner = session.metadata?.clerkId ?? session.client_reference_id;
      if (!sessionOwner) {
        console.warn("[stripe-checkout] session owner missing", {
          sessionId: session.id,
        });
        return { status: 400, error: "missing_owner" };
      }

      if (sessionOwner !== user.id) {
        console.warn("[stripe-checkout] session user mismatch", {
          sessionId: session.id,
        });
        return { status: 403, error: "user_mismatch" };
      }

      if (session.status !== "complete") {
        console.warn("[stripe-checkout] session is not complete", {
          sessionId: session.id,
          status: session.status,
        });
        return { status: 400, error: "session_incomplete" };
      }

      if (typeof session.customer !== "string") {
        console.warn("[stripe-checkout] session customer missing", {
          sessionId: session.id,
        });
        return { status: 400, error: "missing_customer" };
      }

      const subscript = await updateSubscription(user.id, {
        customerId: session.customer,
        plan: "PRO",
      });

      if (subscript) {
        const profile = await findUser(user.id);
        const slug =
          `${profile?.firstname ?? ""}${profile?.lastname ?? ""}` ||
          profile?.clerkId ||
          "";
        return {
          status: 200,
          dashboardPath: slug ? `/dashboard/${slug}` : "/dashboard",
        };
      }

      console.warn("[stripe-checkout] subscription update returned empty", {
        sessionId: session.id,
      });
      return { status: 401, error: "update_failed" };
    }

    console.warn("[stripe-checkout] session not found", { sessionId: session_id });
    return { status: 404, error: "session_not_found" };
  } catch (error) {
    console.error("[stripe-checkout] session verification failed", {
      sessionId: session_id,
      message: error instanceof Error ? error.message : String(error),
    });
    return { status: 500, error: "verification_failed" };
  }
};
