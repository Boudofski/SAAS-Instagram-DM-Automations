import axios from "axios";
import { formatSafeMetaError, getSafeMetaError } from "@/lib/fetch";

export const INSTAGRAM_GRAPH_BASE_URL =
  process.env.INSTAGRAM_GRAPH_BASE_URL ?? "https://graph.instagram.com";
export const INSTAGRAM_GRAPH_VERSION =
  process.env.INSTAGRAM_GRAPH_VERSION ?? process.env.META_GRAPH_VERSION ?? "v25.0";
export const INSTAGRAM_GRAPH_API_BASE_URL = `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_GRAPH_VERSION}`;
export const INSTAGRAM_OAUTH_URL =
  process.env.INSTAGRAM_OAUTH_URL ?? "https://www.instagram.com/oauth/authorize";
export const INSTAGRAM_OAUTH_TOKEN_URL =
  process.env.INSTAGRAM_OAUTH_TOKEN_URL ?? "https://api.instagram.com/oauth/access_token";

const INSTAGRAM_BUSINESS_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
] as const;

export type InstagramLoginProfile = {
  id: string;
  username?: string;
  profilePictureUrl?: string;
  accountType?: string;
};

export type InstagramLoginTokenResult = {
  accessToken: string;
  userId: string;
  expiresIn?: number;
  permissions?: string[];
};

export function isInstagramLoginEnabled() {
  return process.env.INSTAGRAM_LOGIN_ENABLED === "true";
}

export function getInstagramBusinessOAuthScopes() {
  const override = process.env.INSTAGRAM_LOGIN_SCOPES;
  if (override) {
    return override
      .split(/[\s,]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
  }
  return [...INSTAGRAM_BUSINESS_SCOPES];
}

function getInstagramLoginOAuthConfig() {
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ??
    process.env.META_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_HOST_URL
      ? `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`
      : undefined);

  const clientId = process.env.INSTAGRAM_APP_ID ?? process.env.META_APP_ID;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET ?? process.env.META_APP_SECRET;

  if (!redirectUri) throw new Error("INSTAGRAM_REDIRECT_URI is not configured");
  if (!clientId || !clientSecret) {
    throw new Error("INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET are required for Instagram Login");
  }

  return { clientId, clientSecret, redirectUri };
}

function assertAccessToken(value: unknown) {
  return typeof value === "string" && value.trim().length > 20 ? value : null;
}

function assertUserId(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getInstagramLoginOAuthUrl() {
  const { clientId, redirectUri } = getInstagramLoginOAuthConfig();
  const scopes = getInstagramBusinessOAuthScopes();
  const url = new URL(INSTAGRAM_OAUTH_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(","));
  // Keep the user in the Instagram professional-account authorization path.
  // Without this, Meta can intermittently bounce users into Facebook login.
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");

  return url.toString();
}

export async function exchangeInstagramLoginCode(code: string): Promise<InstagramLoginTokenResult | null> {
  const { clientId, clientSecret, redirectUri } = getInstagramLoginOAuthConfig();

  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("grant_type", "authorization_code");
  params.set("redirect_uri", redirectUri);
  params.set("code", code);

  const shortToken = await axios.post(INSTAGRAM_OAUTH_TOKEN_URL, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const shortAccessToken = assertAccessToken(shortToken.data?.access_token);
  const userId = assertUserId(shortToken.data?.user_id);
  const permissions = Array.isArray(shortToken.data?.permissions)
    ? shortToken.data.permissions.map(String)
    : undefined;

  console.log("[instagram-login] code exchange result", {
    endpointFamily: "instagram_oauth",
    status: shortToken.status,
    hasAccessToken: Boolean(shortAccessToken),
    hasUserId: Boolean(userId),
    permissions,
  });

  if (!shortAccessToken || !userId) return null;

  try {
    const longToken = await axios.get(`${INSTAGRAM_GRAPH_BASE_URL}/access_token`, {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: clientSecret,
        access_token: shortAccessToken,
      },
    });
    const longAccessToken = assertAccessToken(longToken.data?.access_token);
    if (longAccessToken) {
      return {
        accessToken: longAccessToken,
        userId,
        expiresIn:
          typeof longToken.data?.expires_in === "number"
            ? longToken.data.expires_in
            : undefined,
        permissions,
      };
    }
  } catch (error) {
    console.warn("[instagram-login] long-lived token exchange failed; using short-lived token", {
      error: getSafeMetaError(error),
    });
  }

  return { accessToken: shortAccessToken, userId, permissions };
}

export async function getInstagramLoginProfile(
  userId: string,
  accessToken: string
): Promise<InstagramLoginProfile> {
  const response = await axios.get(`${INSTAGRAM_GRAPH_API_BASE_URL}/${userId}`, {
    params: {
      fields: "id,username,profile_picture_url,account_type",
      access_token: accessToken,
    },
  });

  return {
    id: String(response.data?.id ?? userId),
    username:
      typeof response.data?.username === "string"
        ? response.data.username
        : undefined,
    profilePictureUrl:
      typeof response.data?.profile_picture_url === "string"
        ? response.data.profile_picture_url
        : undefined,
    accountType:
      typeof response.data?.account_type === "string"
        ? response.data.account_type
        : undefined,
  };
}

export async function subscribeInstagramLoginWebhooks(
  userId: string,
  accessToken: string,
  fields = "comments,messages"
) {
  console.log("[instagram-login] subscribed_apps request", {
    endpointFamily: "instagram_graph",
    hasInstagramUserId: Boolean(userId),
    subscribedFields: fields,
  });

  try {
    return await axios.post(
      `${INSTAGRAM_GRAPH_API_BASE_URL}/${userId}/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: fields,
          access_token: accessToken,
        },
      }
    );
  } catch (error) {
    console.warn("[instagram-login] subscribed_apps failed", {
      error: getSafeMetaError(error),
    });
    throw error;
  }
}

export async function getInstagramLoginWebhookSubscriptions(
  userId: string,
  accessToken: string
) {
  return await axios.get(`${INSTAGRAM_GRAPH_API_BASE_URL}/${userId}/subscribed_apps`, {
    params: { access_token: accessToken },
  });
}

export function formatInstagramLoginError(error: unknown) {
  return formatSafeMetaError(error) || "instagram_login_failed";
}
