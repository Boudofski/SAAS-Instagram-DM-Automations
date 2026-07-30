"use server";

import { dashboardPath } from "@/lib/dashboard";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createUser,
  findUser,
  findUserByEmail,
  updateSubscription,
} from "./queries";

const onboardingSkippedCookie = (clerkId: string) =>
  `ap3k_onboarding_skipped_${clerkId}`;

const publicUserProfile = <T extends { integrations?: any[] }>(profile: T) => ({
  ...profile,
  integrations: profile.integrations?.map(({ token, ...integration }) => ({
    ...integration,
    tokenPresent: typeof token === "string" && token.trim().length > 0,
  })) ?? [],
});

type ClerkWorkspaceIdentity = {
  id: string;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses: Array<{ emailAddress?: string | null }>;
};

function currentIdentityEmail(user: ClerkWorkspaceIdentity) {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ""
  )
    .trim()
    .toLowerCase();
}

function hasPrimaryIdentityEmail(user: ClerkWorkspaceIdentity) {
  return Boolean(user.primaryEmailAddress?.emailAddress?.trim());
}

function isDevEmailProfileClaimEnabled() {
  return (
    process.env.AP3K_DEV_ALLOW_EMAIL_PROFILE_CLAIM === "true" &&
    process.env.VERCEL_ENV !== "production"
  );
}

function safePrismaError(error: unknown) {
  const candidate = error as { code?: unknown; message?: unknown };
  const rawMessage =
    typeof candidate?.message === "string"
      ? candidate.message
      : error instanceof Error
        ? error.message
        : String(error);
  const message = rawMessage
    .replace(
      /(?:postgres(?:ql)?):\/\/[^\s]+/gi,
      "[redacted-database-url]"
    )
    .replace(
      /((?:access[_ -]?)?token|secret|password)\s*[=:]\s*[^\s,;]+/gi,
      "$1=[redacted]"
    )
    .slice(0, 1000);

  return {
    prismaCode:
      typeof candidate?.code === "string" ? candidate.code : undefined,
    message,
  };
}

async function resolveWorkspaceProfile(
  user: ClerkWorkspaceIdentity,
  options: { logDiagnostics?: boolean } = {}
) {
  const email = currentIdentityEmail(user);
  const foundByClerkId = await findUser(user.id);
  const foundByEmail =
    email && (!foundByClerkId || options.logDiagnostics)
      ? await findUserByEmail(email)
      : null;
  const emailClaimEnabled = isDevEmailProfileClaimEnabled();

  if (options.logDiagnostics) {
    console.info("[user-provision] AP3K profile resolution", {
      currentClerkUserIdPresent: Boolean(user.id),
      primaryEmailPresent: hasPrimaryIdentityEmail(user),
      userExistsByClerkId: Boolean(foundByClerkId),
      userExistsByEmail: Boolean(foundByEmail),
      emailClaimEnabled,
      vercelEnvironment: process.env.VERCEL_ENV ?? "local",
    });
  }

  if (foundByClerkId) {
    return {
      profile: foundByClerkId,
      email,
      emailConflict: false,
      resolution: "clerk_id" as const,
    };
  }

  if (foundByEmail && emailClaimEnabled) {
    console.warn("[user-provision] using non-production email profile claim", {
      currentClerkUserIdPresent: Boolean(user.id),
      primaryEmailPresent: hasPrimaryIdentityEmail(user),
      existingWorkspaceClerkIdPresent: Boolean(foundByEmail.clerkId),
      vercelEnvironment: process.env.VERCEL_ENV ?? "local",
    });
    return {
      profile: foundByEmail,
      email,
      emailConflict: false,
      resolution: "dev_email_claim" as const,
    };
  }

  return {
    profile: null,
    email,
    emailConflict: Boolean(foundByEmail),
    resolution: "not_found" as const,
  };
}

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
    error: null,
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
    return {
      status: 401 as const,
      data: null,
      error: "not_authenticated" as const,
    };
  }

  try {
    const resolved = await resolveWorkspaceProfile(user, {
      logDiagnostics: true,
    });
    if (resolved.profile) {
      warnIfPageTokenNearExpiry(resolved.profile);
      return provisionedUserResult(200, resolved.profile);
    }

    const email = resolved.email;

    if (!email) {
      return {
        status: 400 as const,
        data: null,
        error: "missing_user_email" as const,
      };
    }

    if (resolved.emailConflict) {
      console.warn("[user-provision] duplicate email profile claim blocked", {
        currentClerkUserIdPresent: Boolean(user.id),
        primaryEmailPresent: hasPrimaryIdentityEmail(user),
        userExistsByClerkId: false,
        userExistsByEmail: true,
        emailClaimEnabled: isDevEmailProfileClaimEnabled(),
        vercelEnvironment: process.env.VERCEL_ENV ?? "local",
      });
      return {
        status: 409 as const,
        data: null,
        error: "profile_email_conflict" as const,
      };
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
        ...safePrismaError(error),
      });
      return {
        status: 500 as const,
        data: null,
        error: "profile_provision_failed" as const,
      };
    }
  } catch (error) {
    console.error("[user-provision] AP3K profile lookup failed", {
      authenticatedUserPresent: true,
      ...safePrismaError(error),
    });
    return {
      status: 500 as const,
      data: null,
      error: "profile_lookup_failed" as const,
    };
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
    const resolved = await resolveWorkspaceProfile(user);
    if (resolved.profile) {
      return { status: 200, data: publicUserProfile(resolved.profile) };
    }

    return { status: 404 };
  } catch (error: any) {
    return { status: 500 };
  }
};

export const getCurrentWorkspaceClerkId = async () => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const resolved = await resolveWorkspaceProfile(user);
    return resolved.profile?.clerkId ?? user.id;
  } catch (error) {
    console.error("[user-provision] workspace identity resolution failed", {
      currentClerkUserIdPresent: Boolean(user.id),
      primaryEmailPresent: hasPrimaryIdentityEmail(user),
      ...safePrismaError(error),
    });
    return user.id;
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
