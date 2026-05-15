"use server";

import {
  INSTAGRAM_GRAPH_BASE_URL,
  formatSafeMetaError,
  generateToken,
  getSafeMetaError,
  subscribeInstagramWebhooks,
} from "@/lib/fetch";
import { getInstagramTokenFormatDiagnostic } from "@/lib/instagram-token";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";
import { redirect } from "next/navigation";
import {
  createIntegration,
  getIntegrations,
  getWebhookHealthForUser,
  recordIntegrationOAuthError,
  updateIntegration,
} from "./queries";

async function attemptWebhookSubscription(igAccountId: string, token: string) {
  const attemptedAt = new Date();
  try {
    const subscription = await subscribeInstagramWebhooks(igAccountId, token);
    const subscribed = subscription.status >= 200 && subscription.status < 300;
    console.log("[oauth] webhook subscription result", {
      endpointFamily: "meta_graph",
      igAccountIdPresent: Boolean(igAccountId),
      subscribed,
      status: subscription.status,
    });
    return {
      statusCode: subscription.status,
      subscribed,
      attemptedAt,
    };
  } catch (error) {
    const safe = formatSafeMetaError(error);
    console.warn("[oauth] webhook subscription failed", {
      endpointFamily: "meta_graph",
      igAccountIdPresent: Boolean(igAccountId),
      subscribed: false,
      error: getSafeMetaError(error),
    });
    return {
      statusCode: getSafeMetaError(error).status,
      subscribed: false,
      error: safe || "subscribed_apps_failed",
      attemptedAt,
    };
  }
}

const REQUIRED_IG_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
];

const INSTAGRAM_BUSINESS_OAUTH_URL = "https://www.instagram.com/oauth/authorize";

function getOAuthClientId() {
  if (process.env.INSTAGRAM_APP_ID) {
    return { clientId: process.env.INSTAGRAM_APP_ID, source: "INSTAGRAM_APP_ID" as const };
  }

  if (process.env.INSTAGRAM_CLIENT_ID) {
    return { clientId: process.env.INSTAGRAM_CLIENT_ID, source: "INSTAGRAM_CLIENT_ID" as const };
  }

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

  if (!clientId) throw new Error("INSTAGRAM_APP_ID, INSTAGRAM_CLIENT_ID, or META_APP_ID is not configured");

  const url = new URL(INSTAGRAM_BUSINESS_OAUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", REQUIRED_IG_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");
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
      hasInstagramAppId: Boolean(process.env.INSTAGRAM_APP_ID),
      hasMetaAppId: Boolean(process.env.META_APP_ID),
      hasConfiguredOAuthUrl: Boolean(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL),
      hasRedirectUri: Boolean(process.env.META_REDIRECT_URI),
      endpoint: INSTAGRAM_BUSINESS_OAUTH_URL,
      scopeCount: REQUIRED_IG_SCOPES.length,
      redirectIsProduction: process.env.META_REDIRECT_URI === "https://ap3k.com/callback/instagram",
    });
    return { status: 200, url };
  } catch (error) {
    const { source } = getOAuthClientId();
    console.error("[oauth] failed to generate connect URL", {
      message: error instanceof Error ? error.message : String(error),
      oauth_client_id_source: source,
      hasInstagramAppId: Boolean(process.env.INSTAGRAM_APP_ID),
      hasMetaAppId: Boolean(process.env.META_APP_ID),
      hasConfiguredOAuthUrl: Boolean(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL),
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
  });

  if (!user) {
    console.warn("[oauth] callback cannot save integration", {
      hasCode: Boolean(code),
      hasCurrentUser: false,
      integrationSaved: false,
    });
    return { status: 401, error: "auth_missing" };
  }

  try {
    const integration = await getIntegrations(user.id);
    const existing = integration?.integrations[0];
    const tokenResult = await generateToken(code);
    const accessToken = tokenResult?.accessToken;

    if (!accessToken) {
      console.log("[oauth] integration save skipped", {
        tokenExchangeStatus: "failed",
        hasAccessToken: false,
        integrationSaved: false,
      });
      return {
        status: 401,
        error: "token_exchange_failed",
        data: {
          firstname: user.firstName,
          lastname: user.lastName,
          clerkId: user.id,
        },
      };
    }

    const insts_id = await axios.get(
      `${INSTAGRAM_GRAPH_BASE_URL}/me?fields=user_id,username,profile_picture_url`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log("[oauth] account fetch result", {
      accountFetchStatus: insts_id.status,
      hasInstagramUserId: Boolean(insts_id.data.user_id),
      updatingExistingIntegration: Boolean(existing),
    });

    const subscriptionAttempt = await attemptWebhookSubscription(
      insts_id.data.user_id,
      accessToken
    );

    const today = new Date();
    const expire_date = today.setSeconds(
      today.getSeconds() + (tokenResult?.expiresIn ?? 60 * 24 * 60 * 60)
    );

    if (existing) {
      const update = await updateIntegration(
        accessToken,
        new Date(expire_date),
        existing.id,
        insts_id.data.user_id,
        insts_id.data.username,
        insts_id.data.profile_picture_url,
        subscriptionAttempt
      );
      console.log("[oauth] integration save result", {
        integrationSaved: Boolean(update),
        updatingExistingIntegration: true,
        hasInstagramUserId: Boolean(insts_id.data.user_id),
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
      accessToken,
      new Date(expire_date),
      insts_id.data.user_id,
      insts_id.data.username,
      insts_id.data.profile_picture_url,
      subscriptionAttempt
    );
    console.log("[oauth] integration save result", {
      integrationSaved: Boolean(create),
      updatingExistingIntegration: false,
      hasInstagramUserId: Boolean(insts_id.data.user_id),
    });
    return { status: 200, data: create };
  } catch (error) {
    console.error("[oauth] onIntegrate error", {
      message: error instanceof Error ? error.message : String(error),
      integrationSaved: false,
    });
    return {
      status: 500,
      error: "integration_save_failed",
      data: {
        firstname: user.firstName,
        lastname: user.lastName,
        clerkId: user.id,
      },
    };
  }
};

export const resubscribeCurrentInstagramWebhooks = async () => {
  const user = await currentUser();
  if (!user) return { status: 401, data: "Sign in required" };

  try {
    const integration = await getIntegrations(user.id);
    const instagram = integration?.integrations[0];

    if (!instagram?.token || !instagram.instagramId) {
      return { status: 404, data: "Connect Instagram before resubscribing webhooks" };
    }

    const tokenDiagnostic = getInstagramTokenFormatDiagnostic(instagram.token);
    if (!tokenDiagnostic.looksUsable) {
      console.warn("[webhook-subscription] resubscribe skipped: stored token format invalid", {
        integrationId: instagram.id,
        tokenFormat: tokenDiagnostic.reason,
        tokenLength: tokenDiagnostic.length,
      });
      return {
        status: 400,
        data: "Stored Instagram token is invalid. Reconnect Instagram before resubscribing webhooks.",
      };
    }

    const result = await subscribeInstagramWebhooks(
      instagram.instagramId,
      instagram.token
    );
    const subscribed = result.status >= 200 && result.status < 300;

    await updateIntegration(
      instagram.token,
      instagram.expiresAt ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      instagram.id,
      instagram.instagramId,
      instagram.instagramUsername ?? undefined,
      instagram.profilePictureUrl ?? undefined,
      {
        statusCode: result.status,
        subscribed,
        attemptedAt: new Date(),
      }
    );

    console.log("[webhook-subscription] manual resubscribe result", {
      endpointFamily: "meta_graph",
      igAccountIdPresent: true,
      subscribed,
      status: result.status,
    });

    return {
      status: 200,
      data: "Webhook subscription refreshed for comments and messages",
    };
  } catch (error) {
    const safe = formatSafeMetaError(error);
    const integration = await getIntegrations(user.id);
    const instagram = integration?.integrations[0];
    if (instagram?.id && instagram.token) {
      const tokenDiagnostic = getInstagramTokenFormatDiagnostic(instagram.token);
      if (tokenDiagnostic.looksUsable) {
        await updateIntegration(
          instagram.token,
          instagram.expiresAt ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          instagram.id,
          instagram.instagramId ?? undefined,
          instagram.instagramUsername ?? undefined,
          instagram.profilePictureUrl ?? undefined,
          {
            statusCode: getSafeMetaError(error).status,
            subscribed: false,
            error: safe || "subscribed_apps_failed",
            attemptedAt: new Date(),
          }
        );
      }
    }
    console.warn("[webhook-subscription] manual resubscribe failed", {
      error: getSafeMetaError(error),
    });
    return {
      status: 500,
      data: safe || "Meta rejected the webhook subscription request",
    };
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
    await recordIntegrationOAuthError(user.id, error, "instagram_oauth");
    return { status: 200, data: { clerkId: user.id } };
  } catch {
    return { status: 500, data: { clerkId: user.id } };
  }
};
