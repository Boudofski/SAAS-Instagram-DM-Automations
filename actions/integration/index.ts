"use server";

import {
  formatSafeMetaError,
  generateToken,
  debugPageToken,
  getEligibleFacebookInstagramAccounts,
  getSafeMetaError,
  subscribeInstagramWebhooks,
  type EligibleInstagramAccount,
} from "@/lib/fetch";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  createIntegration,
  createMetaOAuthSelection,
  deleteIntegrationForUser,
  deleteMetaOAuthSelection,
  getLatestMetaOAuthSelection,
  getIntegrations,
  getWebhookHealthForUser,
  recordIntegrationOAuthError,
  updateIntegration,
} from "./queries";
import { dashboardPath } from "@/lib/dashboard";

const REQUIRED_META_BUSINESS_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
];

const FACEBOOK_BUSINESS_OAUTH_URL = "https://www.facebook.com/v25.0/dialog/oauth";

async function attemptWebhookSubscription(pageId: string, pageToken: string) {
  const attemptedAt = new Date();
  try {
    const subscription = await subscribeInstagramWebhooks(pageId, pageToken);
    const subscribed = subscription.status >= 200 && subscription.status < 300;
    const subscriptionMode = subscribed ? "API_SUBSCRIBED" : "FAILED";
    console.log("[oauth] page webhook subscription result", {
      endpointFamily: "facebook_graph_page",
      pageIdPresent: Boolean(pageId),
      subscribed,
      subscriptionMode,
      status: subscription.status,
    });
    return { statusCode: subscription.status, subscribed, subscriptionMode, attemptedAt };
  } catch (error) {
    const metaError = getSafeMetaError(error);
    const safe = formatSafeMetaError(error);
    const isMetaDashboardManaged =
      typeof metaError.message === "string" &&
      metaError.message.includes("pages_manage_metadata");
    const subscriptionMode = isMetaDashboardManaged ? "META_DASHBOARD_MANAGED" : "FAILED";
    console.warn("[oauth] page webhook subscription failed", {
      endpointFamily: "facebook_graph_page",
      pageIdPresent: Boolean(pageId),
      subscribed: false,
      subscriptionMode,
      error: metaError,
    });
    return {
      statusCode: metaError.status,
      subscribed: false,
      subscriptionMode,
      error: safe || "page_subscribed_apps_failed",
      attemptedAt,
    };
  }
}

function getOAuthClientId() {
  if (process.env.META_APP_ID) {
    return { clientId: process.env.META_APP_ID, source: "META_APP_ID" as const };
  }
  return { clientId: undefined, source: "missing" as const };
}

export async function getInstagramOAuthUrl() {
  const redirectUri =
    process.env.META_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_HOST_URL
      ? `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`
      : undefined);

  if (!redirectUri) throw new Error("META_REDIRECT_URI is not configured");

  const { clientId } = getOAuthClientId();
  if (!clientId) throw new Error("META_APP_ID is not configured");

  const url = new URL(FACEBOOK_BUSINESS_OAUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", REQUIRED_META_BUSINESS_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("auth_type", "rerequest");
  return url.toString();
}

export const onOathInstagram = async (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    return redirect(await getInstagramOAuthUrl());
  }
};

export const getInstagramConnectUrl = async () => {
  try {
    const url = await getInstagramOAuthUrl();
    const { source } = getOAuthClientId();
    console.log("[oauth] connect URL generated", {
      oauth_client_id_source: source,
      authProduct: "facebook_login_for_business",
      hasMetaAppId: Boolean(process.env.META_APP_ID),
      hasRedirectUri: Boolean(process.env.META_REDIRECT_URI),
      endpoint: FACEBOOK_BUSINESS_OAUTH_URL,
      requestedScopes: REQUIRED_META_BUSINESS_SCOPES,
      scopeCount: REQUIRED_META_BUSINESS_SCOPES.length,
      redirectIsProduction: process.env.META_REDIRECT_URI === "https://ap3k.com/callback/instagram",
    });
    return { status: 200, url };
  } catch (error) {
    const { source } = getOAuthClientId();
    console.error("[oauth] failed to generate connect URL", {
      message: error instanceof Error ? error.message : String(error),
      oauth_client_id_source: source,
      authProduct: "facebook_login_for_business",
      hasMetaAppId: Boolean(process.env.META_APP_ID),
      hasRedirectUri: Boolean(process.env.META_REDIRECT_URI),
    });
    return { status: 500, error: "oauth_url_unavailable" };
  }
};

export const onIntegrate = async (code: string) => {
  const user = await currentUser();
  console.log("[oauth] callback received", {
    hasCode: Boolean(code),
    hasCurrentUser: Boolean(user),
    authProduct: "facebook_login_for_business",
  });

  if (!user) {
    return { status: 401, error: "auth_missing" };
  }

  try {
    const integration = await getIntegrations(user.id);
    const existing = integration?.integrations[0];
    console.log("[oauth] step oauth_received", {
      hasCode: Boolean(code),
      hasExistingIntegration: Boolean(existing),
    });

    const tokenResult = await generateToken(code);
    const userAccessToken = tokenResult?.accessToken;

    if (!userAccessToken) {
      await recordIntegrationOAuthError(user.id, "token_exchange_failed");
      return {
        status: 401,
        error: "token_exchange_failed",
        data: { firstname: user.firstName, lastname: user.lastName, clerkId: user.id },
      };
    }
    console.log("[oauth] step token_exchange_success", {
      hasUserAccessToken: true,
    });

    let resolved: EligibleInstagramAccount;
    try {
      const resolution = await getEligibleFacebookInstagramAccounts(userAccessToken);
      const resolutionDiagnostics = {
        pagesReturned: resolution.pagesReturned,
        pageLookupAttempts: resolution.pageLookupAttempts,
        foundInstagramField: resolution.eligibleAccounts.length ? "found" : "none",
      };

      if (!resolution.eligibleAccounts.length) {
        const hasPageToken = resolution.pageLookupAttempts.some(
          (attempt) => attempt.hasPageAccessToken
        );
        const state = hasPageToken ? "ig_business_not_linked" : "page_token_missing";
        await recordIntegrationOAuthError(
          user.id,
          state,
          "facebook_business_oauth",
          resolutionDiagnostics
        );
        console.warn("[oauth] step page_resolution_failed", {
          state,
          resolutionDiagnostics,
          message:
            "Facebook returned Pages, but Graph API did not expose instagram_business_account or connected_instagram_account. Check Page access tasks and advanced access.",
        });
        return {
          status: 401,
          error: state,
          data: { firstname: user.firstName, lastname: user.lastName, clerkId: user.id },
        };
      }

      if (resolution.eligibleAccounts.length > 1) {
        await createMetaOAuthSelection(
          user.id,
          resolution.eligibleAccounts,
          new Date(Date.now() + 10 * 60 * 1000)
        );
        console.log("[oauth] step account_selection_required", {
          eligibleAccounts: resolution.eligibleAccounts.length,
        });
        return {
          status: 202,
          data: { firstname: user.firstName, lastname: user.lastName, clerkId: user.id },
        };
      }

      resolved = resolution.eligibleAccounts[0];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const resolutionDiagnostics = (error as any)?.diagnostics;
      const state =
        message === "ig_business_not_linked" || message === "page_token_missing"
          ? message
          : "page_resolution_failed";
      await recordIntegrationOAuthError(user.id, state, "facebook_business_oauth", resolutionDiagnostics);
      console.warn("[oauth] step page_resolution_failed", {
        state,
        resolutionDiagnostics,
        error: getSafeMetaError(error),
      });
      return {
        status: 401,
        error: state,
        data: { firstname: user.firstName, lastname: user.lastName, clerkId: user.id },
      };
    }
    console.log("[oauth] step page_selected", {
      hasPageId: Boolean(resolved.pageId),
      hasPageAccessToken: Boolean(resolved.pageAccessToken),
    });
    console.log("[oauth] step ig_business_linked", {
      hasInstagramBusinessAccountId: Boolean(resolved.instagramBusinessAccountId),
      igAccountSource: resolved.igAccountSource,
    });

    try {
      const debug = await debugPageToken(resolved.pageAccessToken);
      const isValid = Boolean(debug.data?.data?.is_valid);
      console.log("[oauth] step page_token_validated", {
        tokenValid: isValid,
        tokenType: debug.data?.data?.type ?? "unknown",
      });
      if (!isValid) {
        await recordIntegrationOAuthError(user.id, "page_token_missing");
        return {
          status: 401,
          error: "page_token_missing",
          data: { firstname: user.firstName, lastname: user.lastName, clerkId: user.id },
        };
      }
    } catch (error) {
      await recordIntegrationOAuthError(user.id, "page_token_missing");
      console.warn("[oauth] step page_token_validation_failed", {
        error: getSafeMetaError(error),
      });
      return {
        status: 401,
        error: "page_token_missing",
        data: { firstname: user.firstName, lastname: user.lastName, clerkId: user.id },
      };
    }

    const subscriptionAttempt = await attemptWebhookSubscription(
      resolved.pageId,
      resolved.pageAccessToken
    );
    console.log("[oauth] step subscribed_apps_success", {
      subscribed: subscriptionAttempt.subscribed,
      statusCode: subscriptionAttempt.statusCode,
    });
    const today = new Date();
    const expireDate = today.setSeconds(
      today.getSeconds() + (tokenResult?.expiresIn ?? 60 * 24 * 60 * 60)
    );

    if (existing) {
      const update = await updateIntegration(
        resolved.pageAccessToken,
        new Date(expireDate),
        existing.id,
        resolved.instagramBusinessAccountId,
        resolved.instagramUsername,
        resolved.profilePictureUrl,
        resolved.pageId,
        resolved.pageName,
        resolved.instagramBusinessAccountId,
        resolved.igAccountSource,
        resolved.diagnostics,
        subscriptionAttempt
      );
      console.log("[oauth] integration save result", {
        integrationSaved: Boolean(update),
        updatingExistingIntegration: true,
        hasPageId: Boolean(resolved.pageId),
        hasInstagramBusinessAccountId: Boolean(resolved.instagramBusinessAccountId),
      });
      return {
        status: 200,
        data: {
          firstname: user.firstName,
          lastname: user.lastName,
          clerkId: user.id,
          integrationId: update.id,
        },
      };
    }

    const create = await createIntegration(
      user.id,
      resolved.pageAccessToken,
      new Date(expireDate),
      resolved.instagramBusinessAccountId,
      resolved.instagramUsername,
      resolved.profilePictureUrl,
      resolved.pageId,
      resolved.pageName,
      resolved.instagramBusinessAccountId,
      resolved.igAccountSource,
      resolved.diagnostics,
      subscriptionAttempt
    );
    console.log("[oauth] integration save result", {
      integrationSaved: Boolean(create),
      updatingExistingIntegration: false,
      hasPageId: Boolean(resolved.pageId),
      hasInstagramBusinessAccountId: Boolean(resolved.instagramBusinessAccountId),
    });
    return { status: 200, data: create };
  } catch (error) {
    await recordIntegrationOAuthError(user.id, "integration_save_failed");
    console.error("[oauth] onIntegrate error", {
      message: error instanceof Error ? error.message : String(error),
      integrationSaved: false,
    });
    return {
      status: 500,
      error: "integration_save_failed",
      data: { firstname: user.firstName, lastname: user.lastName, clerkId: user.id },
    };
  }
};

export const resubscribeCurrentInstagramWebhooks = async () => {
  const user = await currentUser();
  if (!user) return { status: 401, data: "Sign in required" };

  try {
    const integration = await getIntegrations(user.id);
    const instagram = integration?.integrations[0];

    if (!instagram?.token || !instagram.pageId) {
      return { status: 404, data: "Connect Facebook Page and Instagram Business account before resubscribing webhooks" };
    }

    const subscriptionAttempt = await attemptWebhookSubscription(instagram.pageId, instagram.token);

    await updateIntegration(
      instagram.token,
      instagram.expiresAt ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      instagram.id,
      instagram.instagramId ?? undefined,
      instagram.instagramUsername ?? undefined,
      instagram.profilePictureUrl ?? undefined,
      instagram.pageId ?? undefined,
      instagram.pageName ?? undefined,
      instagram.businessId ?? undefined,
      instagram.igAccountSource ?? undefined,
      instagram.oauthResolutionDiagnostics ?? undefined,
      subscriptionAttempt
    );

    console.log("[webhook-subscription] manual page resubscribe result", {
      endpointFamily: "facebook_graph_page",
      pageIdPresent: true,
      subscribed: subscriptionAttempt.subscribed,
      subscriptionMode: subscriptionAttempt.subscriptionMode,
      status: subscriptionAttempt.statusCode,
    });

    if (subscriptionAttempt.subscriptionMode === "META_DASHBOARD_MANAGED") {
      return {
        status: 200,
        data: "Meta dashboard subscription required — confirm the Webhook Subscription toggle is ON in Meta Developers for this Instagram account",
      };
    }
    if (subscriptionAttempt.subscribed) {
      return { status: 200, data: "Page webhook subscription refreshed for comments and messages" };
    }
    return { status: 500, data: subscriptionAttempt.error || "Meta rejected the page webhook subscription request" };
  } catch (error) {
    console.warn("[webhook-subscription] manual page resubscribe failed", {
      error: getSafeMetaError(error),
    });
    return { status: 500, data: formatSafeMetaError(error) || "Meta rejected the page webhook subscription request" };
  }
};

export const disconnectCurrentInstagramIntegration = async () => {
  const user = await currentUser();
  if (!user) return { status: 401, data: "Sign in required" };

  try {
    const deleted = await deleteIntegrationForUser(user.id);
    if (!deleted) {
      return { status: 404, data: "No Instagram account is connected" };
    }

    return { status: 200, data: "Instagram account disconnected" };
  } catch (error) {
    console.error("[oauth] disconnect instagram integration failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { status: 500, data: "Instagram account could not be disconnected" };
  }
};

export const getPendingInstagramAccountSelections = async () => {
  const user = await currentUser();
  if (!user) return { status: 401, data: [] };

  const selection = await getLatestMetaOAuthSelection(user.id);
  const accounts = Array.isArray(selection?.accounts) ? selection.accounts : [];

  return {
    status: 200,
    data: accounts.map((account: any) => ({
      pageId: String(account.pageId ?? ""),
      pageName: account.pageName as string | undefined,
      instagramBusinessAccountId: String(account.instagramBusinessAccountId ?? ""),
      instagramUsername: account.instagramUsername as string | undefined,
      profilePictureUrl: account.profilePictureUrl as string | undefined,
      igAccountSource: account.igAccountSource as string | undefined,
      tasks: Array.isArray(account.tasks) ? account.tasks.map(String) : [],
    })),
  };
};

export const selectPendingInstagramAccount = async (formData: FormData) => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const pageId = String(formData.get("pageId") ?? "").trim();
  const selection = await getLatestMetaOAuthSelection(user.id);
  const accounts = Array.isArray(selection?.accounts)
    ? (selection.accounts as unknown as EligibleInstagramAccount[])
    : [];
  const selected = accounts.find((account) => account.pageId === pageId);

  if (!selection || !selected) {
    return redirect(`${dashboardPath(user.id)}/integrations?integration_error=page_resolution_failed`);
  }

  try {
    const debug = await debugPageToken(selected.pageAccessToken);
    const isValid = Boolean(debug.data?.data?.is_valid);
    if (!isValid) {
      await recordIntegrationOAuthError(user.id, "page_token_missing");
      return redirect(`${dashboardPath(user.id)}/integrations?integration_error=page_token_missing`);
    }

    const subscriptionAttempt = await attemptWebhookSubscription(
      selected.pageId,
      selected.pageAccessToken
    );
    const integration = await getIntegrations(user.id);
    const existing = integration?.integrations[0];
    const expireDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    if (existing) {
      await updateIntegration(
        selected.pageAccessToken,
        expireDate,
        existing.id,
        selected.instagramBusinessAccountId,
        selected.instagramUsername,
        selected.profilePictureUrl,
        selected.pageId,
        selected.pageName,
        selected.instagramBusinessAccountId,
        selected.igAccountSource,
        selected.diagnostics,
        subscriptionAttempt
      );
    } else {
      await createIntegration(
        user.id,
        selected.pageAccessToken,
        expireDate,
        selected.instagramBusinessAccountId,
        selected.instagramUsername,
        selected.profilePictureUrl,
        selected.pageId,
        selected.pageName,
        selected.instagramBusinessAccountId,
        selected.igAccountSource,
        selected.diagnostics,
        subscriptionAttempt
      );
    }

    await deleteMetaOAuthSelection(selection.id);
    console.log("[oauth] step selected_account_saved", {
      selectedPageId: selected.pageId,
      selectedPageName: selected.pageName,
      selectedInstagramUsername: selected.instagramUsername,
      igAccountSource: selected.igAccountSource,
      subscribed: subscriptionAttempt.subscribed,
    });
    return redirect(`${dashboardPath(user.id)}/integrations`);
  } catch (error) {
    console.error("[oauth] selected account save failed", {
      error: getSafeMetaError(error),
    });
    await recordIntegrationOAuthError(user.id, "integration_save_failed");
    return redirect(`${dashboardPath(user.id)}/integrations?integration_error=integration_save_failed`);
  }
};

export const getCurrentWebhookHealth = async () => {
  const user = await currentUser();
  if (!user) return { status: 401, data: null };

  try {
    return { status: 200, data: await getWebhookHealthForUser(user.id) };
  } catch {
    return { status: 500, data: null };
  }
};

export const recordInstagramOAuthError = async (error: string) => {
  const user = await currentUser();
  if (!user) return { status: 401 };

  try {
    await recordIntegrationOAuthError(user.id, error, "facebook_business_oauth");
    return { status: 200, data: { clerkId: user.id } };
  } catch {
    return { status: 500, data: { clerkId: user.id } };
  }
};
