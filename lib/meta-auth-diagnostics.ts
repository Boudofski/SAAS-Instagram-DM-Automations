import axios from "axios";
import { INSTAGRAM_GRAPH_BASE_URL, META_GRAPH_BASE_URL } from "@/lib/fetch";
import { getInstagramTokenFormatDiagnostic } from "@/lib/instagram-token";

const REQUIRED_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
];

type SafeCall<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status?: number; error: string; code?: number; type?: string };

function safeMetaError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const metaError = error.response?.data?.error;
    return {
      status: error.response?.status,
      error: metaError?.message ?? error.message,
      code: metaError?.code,
      type: metaError?.type,
    };
  }

  return {
    error: error instanceof Error ? error.message : String(error),
  };
}

async function safeCall<T>(operation: () => Promise<{ status: number; data: T }>): Promise<SafeCall<T>> {
  try {
    const response = await operation();
    return { ok: true, status: response.status, data: response.data };
  } catch (error) {
    return { ok: false, ...safeMetaError(error) };
  }
}

export function getCanonicalMetaConfig() {
  const instagramAppId = process.env.INSTAGRAM_APP_ID ?? process.env.INSTAGRAM_CLIENT_ID;
  const metaAppId = process.env.META_APP_ID;
  const appId = instagramAppId ?? metaAppId;
  const instagramSecret =
    process.env.INSTAGRAM_APP_SECRET ?? process.env.INSTAGRAM_CLIENT_SECRET;
  const metaSecret = process.env.META_APP_SECRET;
  const appSecret = instagramSecret ?? metaSecret;
  const redirectUri =
    process.env.META_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_HOST_URL
      ? `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`
      : undefined);

  return {
    product: "instagram_login" as const,
    appId,
    appIdSource: instagramAppId
      ? process.env.INSTAGRAM_APP_ID
        ? "INSTAGRAM_APP_ID"
        : "INSTAGRAM_CLIENT_ID"
      : metaAppId
      ? "META_APP_ID"
      : "none",
    appSecret,
    appSecretSource: instagramSecret
      ? process.env.INSTAGRAM_APP_SECRET
        ? "INSTAGRAM_APP_SECRET"
        : "INSTAGRAM_CLIENT_SECRET"
      : metaSecret
      ? "META_APP_SECRET"
      : "none",
    redirectUri,
    hasAppIdMismatch: Boolean(instagramAppId && metaAppId && instagramAppId !== metaAppId),
    hasSecretMismatch: Boolean(instagramSecret && metaSecret && instagramSecret !== metaSecret),
    oauthAuthorizeEndpoint: "https://www.instagram.com/oauth/authorize",
    tokenEndpoint: "https://api.instagram.com/oauth/access_token",
    longTokenEndpointFamily: "instagram_graph",
    apiEndpointFamily: "instagram_graph",
    webhookSubscriptionEndpointFamily: "instagram_graph",
  };
}

function buildAppAccessToken(appId?: string, appSecret?: string) {
  if (!appId || !appSecret) return null;
  return `${appId}|${appSecret}`;
}

function sanitizeDebugToken(data: any) {
  if (!data?.data) return null;
  const debug = data.data;
  return {
    app_id: debug.app_id,
    type: debug.type,
    application: debug.application,
    expires_at: debug.expires_at,
    is_valid: debug.is_valid,
    issued_at: debug.issued_at,
    scopes: Array.isArray(debug.scopes) ? debug.scopes : [],
    user_id: debug.user_id,
  };
}

export async function getMetaTokenHealth(input: {
  accessToken?: string | null;
  instagramId?: string | null;
}) {
  const config = getCanonicalMetaConfig();
  const tokenFormat = getInstagramTokenFormatDiagnostic(input.accessToken);
  const appAccessToken = buildAppAccessToken(config.appId, config.appSecret);

  if (!input.accessToken || !tokenFormat.looksUsable) {
    return {
      config,
      tokenFormat,
      tokenValid: false,
      graphValidationResult: "skipped_invalid_token_format",
      debugToken: null,
      tokenAppId: null,
      tokenType: "unknown",
      tokenScopes: [] as string[],
      issuedByApp: null,
      tokenBelongsToCurrentApp: false,
      requiredScopesPresent: false,
      missingScopes: REQUIRED_SCOPES,
      igAccountLinked: false,
      subscribedAppsEligible: false,
      subscribedAppsActive: false,
      diagnostics: ["invalid_token_format"],
    };
  }

  const [debugTokenCall, igMeCall, permissionsCall, subscribedAppsCall] =
    await Promise.all([
      appAccessToken
        ? safeCall(() =>
            axios.get(`${META_GRAPH_BASE_URL}/debug_token`, {
              params: {
                input_token: input.accessToken,
                access_token: appAccessToken,
              },
            })
          )
        : Promise.resolve({
            ok: false as const,
            error: "missing_app_access_token",
          }),
      safeCall(() =>
        axios.get(`${INSTAGRAM_GRAPH_BASE_URL}/me`, {
          params: {
            fields: "user_id,username,account_type",
            access_token: input.accessToken,
          },
        })
      ),
      safeCall(() =>
        axios.get(`${INSTAGRAM_GRAPH_BASE_URL}/me/permissions`, {
          params: { access_token: input.accessToken },
        })
      ),
      input.instagramId
        ? safeCall(() =>
            axios.get(`${INSTAGRAM_GRAPH_BASE_URL}/v21.0/${input.instagramId}/subscribed_apps`, {
              params: { access_token: input.accessToken },
            })
          )
        : Promise.resolve({
            ok: false as const,
            error: "missing_instagram_id",
          }),
    ]);

  const debugToken = debugTokenCall.ok ? sanitizeDebugToken(debugTokenCall.data) : null;
  const tokenScopes =
    permissionsCall.ok && Array.isArray((permissionsCall.data as any)?.data)
      ? (permissionsCall.data as any).data
          .filter((item: any) => item.status === "granted")
          .map((item: any) => item.permission)
          .filter(Boolean)
      : debugToken?.scopes ?? [];
  const missingScopes = REQUIRED_SCOPES.filter((scope) => !tokenScopes.includes(scope));
  const subscribedData =
    subscribedAppsCall.ok && Array.isArray((subscribedAppsCall.data as any)?.data)
      ? (subscribedAppsCall.data as any).data
      : [];
  const subscribedFields = new Set<string>(
    subscribedData.flatMap((item: any) =>
      Array.isArray(item.subscribed_fields) ? item.subscribed_fields : []
    )
  );
  const diagnostics: string[] = [];

  if (config.hasAppIdMismatch) diagnostics.push("app_id_env_mismatch");
  if (config.hasSecretMismatch) diagnostics.push("app_secret_env_mismatch");
  if (!debugTokenCall.ok) {
    diagnostics.push(
      debugTokenCall.error?.includes("Cannot parse access token")
        ? "debug_token_cannot_parse_instagram_login_token"
        : "debug_token_failed"
    );
  }
  if (debugToken?.app_id && config.appId && debugToken.app_id !== config.appId) {
    diagnostics.push("token_issued_by_wrong_app");
  }
  if (!igMeCall.ok) diagnostics.push("instagram_graph_me_failed");
  if (!permissionsCall.ok) diagnostics.push("token_scopes_unavailable");
  if (missingScopes.length > 0) diagnostics.push("missing_required_scopes");
  if (!subscribedAppsCall.ok) diagnostics.push("subscribed_apps_failed");
  if (subscribedAppsCall.ok && !subscribedFields.has("comments")) {
    diagnostics.push("comments_not_subscribed");
  }
  if (subscribedAppsCall.ok && !subscribedFields.has("messages")) {
    diagnostics.push("messages_not_subscribed");
  }

  return {
    config,
    tokenFormat,
    tokenValid: igMeCall.ok,
    graphValidationResult: igMeCall.ok ? "instagram_graph_me_ok" : igMeCall.error,
    debugToken,
    debugTokenStatus: debugTokenCall.ok ? "ok" : debugTokenCall.error,
    tokenAppId: debugToken?.app_id ?? null,
    tokenType: debugToken?.type ?? "instagram_login_access_token_or_unknown",
    tokenScopes,
    issuedByApp: debugToken?.application ?? null,
    tokenBelongsToCurrentApp: Boolean(
      debugToken?.app_id && config.appId && debugToken.app_id === config.appId
    ),
    requiredScopesPresent: missingScopes.length === 0,
    missingScopes,
    igAccountLinked:
      igMeCall.ok &&
      Boolean((igMeCall.data as any)?.user_id) &&
      (!input.instagramId || (igMeCall.data as any).user_id === input.instagramId),
    igAccount: igMeCall.ok ? igMeCall.data : null,
    subscribedAppsEligible: igMeCall.ok && missingScopes.length === 0,
    subscribedAppsActive: subscribedData.length > 0,
    commentsSubscribed: subscribedFields.has("comments"),
    messagesSubscribed: subscribedFields.has("messages"),
    subscribedAppsStatus: subscribedAppsCall.ok ? "ok" : subscribedAppsCall.error,
    diagnostics,
  };
}
