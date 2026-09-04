import axios from "axios";
import { client } from "@/lib/prisma";
import { getSafeMetaError, INSTAGRAM_GRAPH_API_BASE_URL, META_GRAPH_API_BASE_URL } from "@/lib/fetch";
import { INSTAGRAM_WEBHOOK_FIELDS } from "@/lib/instagram-webhook-subscriptions";

// Read Meta's actual subscription, rather than trusting an old successful
// connection that subscribed only to comments and messages.
const checked = new Map<string, { ready: boolean; expiresAt: number }>();
const inFlight = new Map<string, Promise<boolean>>();

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
