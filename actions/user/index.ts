"use server";

import { dashboardPath } from "@/lib/dashboard";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createUser, findUser, updateSubscription } from "./queries";

const onboardingSkippedCookie = (clerkId: string) =>
  `ap3k_onboarding_skipped_${clerkId}`;

const publicUserProfile = <T extends { integrations?: any[] }>(profile: T) => ({
  ...profile,
  integrations: profile.integrations?.map(({ token, ...integration }) => ({
    ...integration,
    tokenPresent: typeof token === "string" && token.trim().length > 0,
  })) ?? [],
});

function warnIfPageTokenNearExpiry(profile: Awaited<ReturnType<typeof findUser>>) {
  const integration = profile?.integrations[0];
  if (!integration?.expiresAt) return;

  const days = Math.round(
    (integration.expiresAt.getTime() - Date.now()) / (1000 * 3600 * 24)
  );

  if (days < 5) {
    console.warn("[oauth] page token near expiry; reconnect required", {
      integrationId: integration.id,
      daysRemaining: days,
    });
  }
}

function provisionedUserResult(
  status: 200 | 201,
  profile: { firstname?: string | null; lastname?: string | null; clerkId: string }
) {
  return {
    status,
    data: {
      firstname: profile.firstname,
      lastname: profile.lastname,
      clerkId: profile.clerkId,
    },
  };
}

export const onCurrentUser = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  return user;
};

export const ensureCurrentUserProfile = async () => {
  const user = await currentUser();
  if (!user) {
    return { status: 401 as const, error: "not_authenticated" as const };
  }

  try {
    const found = await findUser(user.id);
    if (found) {
      warnIfPageTokenNearExpiry(found);
      return provisionedUserResult(200, found);
    }

    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";

    if (!email) {
      return { status: 400 as const, error: "missing_user_email" as const };
    }

    try {
      const created = await createUser(
        user.id,
        user.firstName ?? "",
        user.lastName ?? "",
        email
      );

      console.log("[user-provision] AP3K profile created", {
        authenticatedUserPresent: true,
      });
      return provisionedUserResult(201, created);
    } catch (error) {
      // A concurrent request may have created the row between find and create.
      const racedProfile = await findUser(user.id);
      if (racedProfile) {
        return provisionedUserResult(200, racedProfile);
      }

      console.error("[user-provision] AP3K profile creation failed", {
        authenticatedUserPresent: true,
        message: error instanceof Error ? error.message : String(error),
      });
      return { status: 500 as const, error: "profile_provision_failed" as const };
    }
  } catch (error) {
    console.error("[user-provision] AP3K profile lookup failed", {
      authenticatedUserPresent: true,
      message: error instanceof Error ? error.message : String(error),
    });
    return { status: 500 as const, error: "profile_lookup_failed" as const };
  }
};

export const onboardUser = async () => {
  const result = await ensureCurrentUserProfile();
  if (result.status === 401) return redirect("/sign-in");
  return result;
};

export const onUserInfo = async () => {
  const user = await onCurrentUser();

  try {
    const profile = await findUser(user.id);
    if (profile) return { status: 200, data: publicUserProfile(profile) };

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
      console.log("[stripe-checkout] session verification context", {
        hasMetadataClerkId: Boolean(session.metadata?.clerkId),
        hasClientReferenceId: Boolean(session.client_reference_id),
        hasCustomer: Boolean(session.customer),
        sessionStatus: session.status,
        currentUserIdExists: Boolean(user.id),
      });

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

      let profile = await findUser(user.id);
      if (!profile) {
        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) {
          console.warn("[stripe-checkout] current user email missing", {
            sessionId: session.id,
          });
          return { status: 400, error: "missing_user_email" };
        }

        await createUser(
          user.id,
          user.firstName ?? "",
          user.lastName ?? "",
          email
        );
        profile = await findUser(user.id);
      }

      const subscript = await updateSubscription(user.id, {
        customerId: session.customer,
        plan: "PRO",
      });

      if (subscript) {
        const slug = profile?.clerkId || "";
        return {
          status: 200,
          dashboardPath: dashboardPath(slug),
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
