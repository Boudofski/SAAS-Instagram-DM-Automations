import axios from "axios";
import { client } from "@/lib/prisma";
import { getSafeMetaError, INSTAGRAM_GRAPH_API_BASE_URL, META_GRAPH_API_BASE_URL } from "@/lib/fetch";
import { INSTAGRAM_WEBHOOK_FIELDS } from "@/lib/instagram-webhook-subscriptions";
import { getApplicationUrl } from "@/lib/app-url";

// Read Meta's actual subscription, rather than trusting an old successful
// connection that subscribed only to comments and messages.
const checked = new Map<string, { ready: boolean; expiresAt: number }>();
const inFlight = new Map<string, Promise<boolean>>();
let appChecked: { key: string; ready: boolean; expiresAt: number } | null = null;
let appInFlight: Promise<boolean> | null = null;

/**
 * A full-width Instagram postback button needs both levels of subscription:
 * the connected professional account and the AP3K Meta app webhook object.
 * If either repair is unavailable callers safely keep using message quick replies.
 */
export async function ensureInstagramButtonCallbacks(
  integrationId: string | undefined,
  token: string
): Promise<boolean> {
  const accountReady = await ensureInstagramPostbackSubscription(integrationId, token);
  if (!accountReady) return false;
  return ensureInstagramAppPostbackSubscription();
}

export async function ensureInstagramPostbackSubscription(integrationId: string | undefined, token: string): Promise<boolean> {
  if (!integrationId) return false;
  const cached = checked.get(integrationId);
  if (cached && cached.expiresAt > Date.now()) return cached.ready;
  const running = inFlight.get(integrationId);
  if (running) return running;

  const operation = refresh(integrationId, token).then((ready) => {
    if (checked.size >= 500) checked.delete(checked.keys().next().value!);
    checked.set(integrationId, { ready, expiresAt: Date.now() + (ready ? 300_000 : 60_000) });
    return ready;
  }).finally(() => inFlight.delete(integrationId));
  inFlight.set(integrationId, operation);
  return operation;
}

async function refresh(integrationId: string, token: string): Promise<boolean> {
  try {
    const integration = await client.integrations.findUnique({
      where: { id: integrationId },
      select: { instagramId: true, pageId: true, igAccountSource: true, status: true, reconnectRequired: true },
    });
    if (!integration || integration.status === "DISCONNECTED" || integration.reconnectRequired) return false;
    const instagramLogin = integration.igAccountSource === "instagram_login";
    const targetId = instagramLogin ? integration.instagramId : integration.pageId;
    if (!targetId) return false;
    const url = `${instagramLogin ? INSTAGRAM_GRAPH_API_BASE_URL : META_GRAPH_API_BASE_URL}/${targetId}/subscribed_apps`;
    const config = { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 };
    const response = await axios.get(url, config);
    const subscriptions = Array.isArray(response.data?.data) ? response.data.data : [];
    const appId = instagramLogin ? process.env.INSTAGRAM_APP_ID : process.env.META_APP_ID;
    const currentApp = subscriptions.find((item: { id?: string }) => appId && item.id === appId);
    const currentFields: string[] = Array.isArray(currentApp?.subscribed_fields) ? currentApp.subscribed_fields : [];
    if (INSTAGRAM_WEBHOOK_FIELDS.every((field) => currentFields.includes(field))) return true;

    // Keep any other fields already enabled while adding button callbacks.
    const fields = Array.from(new Set([...currentFields, ...INSTAGRAM_WEBHOOK_FIELDS]));
    const result = await axios.post(url, null, { ...config, params: { subscribed_fields: fields.join(",") } });
    const ready = result.status >= 200 && result.status < 300 && result.data?.success === true;
    console.log("[webhook-subscription] button callbacks refresh", { integrationId, ready, subscribedFields: fields });
    return ready;
  } catch (error) {
    console.warn("[webhook-subscription] button callbacks unavailable; using message quick reply", {
      integrationId, error: getSafeMetaError(error),
    });
    return false;
  }
}

export async function ensureInstagramAppPostbackSubscription(): Promise<boolean> {
  const credentials = getMetaAppCredentials();
  const verifyToken = process.env.META_VERIFY_TOKEN?.trim();
  const callbackUrl = `${getApplicationUrl()}/api/webhooks/meta`;
  if (!credentials || !verifyToken || process.env.VERCEL_ENV === "preview") return false;

  const cacheKey = `${credentials.appId}:${callbackUrl}`;
  if (appChecked?.key === cacheKey && appChecked.expiresAt > Date.now()) return appChecked.ready;
  if (appInFlight) return appInFlight;

  appInFlight = refreshAppSubscription(credentials, verifyToken, callbackUrl)
    .then((ready) => {
      appChecked = { key: cacheKey, ready, expiresAt: Date.now() + (ready ? 300_000 : 60_000) };
      return ready;
    })
    .finally(() => {
      appInFlight = null;
    });
  return appInFlight;
}

function getMetaAppCredentials(): { appId: string; appSecret: string } | null {
  const useInstagramLogin = process.env.INSTAGRAM_LOGIN_ENABLED === "true";
  const appId = (useInstagramLogin ? process.env.INSTAGRAM_APP_ID : process.env.META_APP_ID)
    ?? process.env.INSTAGRAM_APP_ID
    ?? process.env.META_APP_ID;
  const appSecret = (useInstagramLogin ? process.env.INSTAGRAM_APP_SECRET : process.env.META_APP_SECRET)
    ?? process.env.INSTAGRAM_APP_SECRET
    ?? process.env.META_APP_SECRET;
  return appId?.trim() && appSecret?.trim()
    ? { appId: appId.trim(), appSecret: appSecret.trim() }
    : null;
}

async function refreshAppSubscription(
  credentials: { appId: string; appSecret: string },
  verifyToken: string,
  callbackUrl: string
): Promise<boolean> {
  const url = `${META_GRAPH_API_BASE_URL}/${credentials.appId}/subscriptions`;
  const accessToken = `${credentials.appId}|${credentials.appSecret}`;
  const request = { params: { access_token: accessToken }, timeout: 5000 };

  try {
    const response = await axios.get(url, request);
    const subscriptions = Array.isArray(response.data?.data) ? response.data.data : [];
    const current = subscriptions.find((item: { object?: string }) => item.object === "instagram");
    const currentFields = Array.isArray(current?.fields)
      ? current.fields.flatMap((field: string | { name?: string }) =>
          typeof field === "string" ? [field] : field?.name ? [field.name] : []
        )
      : [];
    const callbackMatches = normalizeUrl(current?.callback_url) === normalizeUrl(callbackUrl);
    const ready = current?.active !== false
      && callbackMatches
      && INSTAGRAM_WEBHOOK_FIELDS.every((field) => currentFields.includes(field));
    if (ready) return true;

    const fields = Array.from(new Set([...currentFields, ...INSTAGRAM_WEBHOOK_FIELDS]));
    const result = await axios.post(url, null, {
      params: {
        object: "instagram",
        callback_url: callbackUrl,
        verify_token: verifyToken,
        fields: fields.join(","),
        include_values: true,
        access_token: accessToken,
      },
      timeout: 8000,
    });
    const repaired = result.status >= 200 && result.status < 300 && result.data?.success === true;
    console.log("[webhook-subscription] app button callbacks refresh", {
      ready: repaired,
      callbackUrl,
      subscribedFields: fields,
    });
    return repaired;
  } catch (error) {
    console.warn("[webhook-subscription] app button callbacks unavailable; using message quick reply", {
      error: getSafeMetaError(error),
    });
    return false;
  }
}

function normalizeUrl(value: unknown) {
  return typeof value === "string" ? value.replace(/\/$/, "") : "";
}
