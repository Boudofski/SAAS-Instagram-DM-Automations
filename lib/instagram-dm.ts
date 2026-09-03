import axios from "axios";
import { getSafeMetaError } from "@/lib/fetch";

export const INSTAGRAM_GRAPH_BASE_URL =
  process.env.INSTAGRAM_GRAPH_BASE_URL ?? "https://graph.instagram.com";
export const INSTAGRAM_GRAPH_VERSION =
  process.env.INSTAGRAM_GRAPH_VERSION ?? process.env.META_GRAPH_VERSION ?? "v25.0";
export const INSTAGRAM_GRAPH_API_BASE_URL = `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_GRAPH_VERSION}`;

type CtaMode = "button_template" | "text_link_fallback" | "none";

type InstagramMessagePayload =
  | {
      text: string;
      quick_replies?: Array<{ content_type: "text"; title: string; payload: string }>;
    }
  | {
      attachment: {
        type: "template" | "image" | "video";
        payload: Record<string, unknown>;
      };
      quick_replies?: Array<{ content_type: "text"; title: string; payload: string }>;
    };

export type SafeMetaApiError = {
  status?: number;
  code?: number;
  subcode?: number;
  type?: string;
  message?: string;
  fbtrace_id?: string;
};

export type PrivateReplyResult =
  | {
      ok: true;
      endpoint: string;
      ctaMode: CtaMode;
    }
  | {
      ok: false;
      reason: "dm_capability_missing" | "meta_api_error";
      endpoint: string;
      metaError: SafeMetaApiError;
      ctaMode: CtaMode;
    };

function extractFbtraceId(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const raw = error.response?.data as any;
  return raw?.error?.fbtrace_id ?? undefined;
}

function buildMetaError(error: unknown): SafeMetaApiError {
  const safe = getSafeMetaError(error);
  return {
    status: safe.status,
    code: safe.code,
    subcode: safe.subcode,
    type: safe.type,
    message: safe.message,
    fbtrace_id: extractFbtraceId(error),
  };
}

function isCapabilityError(error: unknown): boolean {
  return getSafeMetaError(error).code === 3;
}

function shouldTryTextFallback(error: unknown): boolean {
  const safe = getSafeMetaError(error);
  const message = (safe.message ?? "").toLowerCase();
  return Boolean(
    safe.status === 400 ||
    safe.code === 100 ||
    message.includes("invalid message") ||
    message.includes("button") ||
    message.includes("template")
  );
}

function normalizeCtaUrl(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol);
    return parsed.toString();
  } catch {
    return raw;
  }
}

function normalizeButtonTitle(value?: string | null) {
  const title = value?.trim() || "Open link";
  return Array.from(title).slice(0, 20).join("");
}

function buildButtonPayload(
  message: string,
  ctaTitle?: string | null,
  ctaUrl?: string | null
): { message: InstagramMessagePayload; ctaMode: CtaMode } {
  const text = message.trim() || "Here is the link you requested.";
  const url = normalizeCtaUrl(ctaUrl);

  if (!url) {
    return { message: { text }, ctaMode: "none" };
  }

  return {
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text,
          buttons: [
            {
              type: "web_url",
              title: normalizeButtonTitle(ctaTitle),
              url,
            },
          ],
        },
      },
    },
    ctaMode: "button_template",
  };
}

function buildTextFallbackPayload(
  message: string,
  ctaTitle?: string | null,
  ctaUrl?: string | null
): { message: InstagramMessagePayload; ctaMode: CtaMode } {
  const text = message.trim() || "Here is the link you requested.";
  const url = normalizeCtaUrl(ctaUrl);

  if (!url || text.includes(url)) {
    return { message: { text }, ctaMode: url ? "text_link_fallback" : "none" };
  }

  const suffix = ctaTitle?.trim() ? `\n\n${ctaTitle.trim()}: ${url}` : `\n\n${url}`;
  return { message: { text: text + suffix }, ctaMode: "text_link_fallback" };
}

function addQuickReplies(
  message: InstagramMessagePayload,
  automationId: string,
  replies: string[]
): InstagramMessagePayload {
  const quickReplies = buildQuickReplies(automationId, replies);
  return quickReplies.length ? { ...message, quick_replies: quickReplies } as InstagramMessagePayload : message;
}

function buildConfiguredPrivateReplyPayload(params: {
  automationId: string;
  message: string;
  responseFormat?: string | null;
  quickReplies?: string[];
  ctaTitle?: string | null;
  ctaUrl?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
}) {
  const quickReplies = params.quickReplies ?? [];
  if (params.responseFormat === "MEDIA" && params.mediaUrl) {
    const mediaUrl = normalizeCtaUrl(params.mediaUrl);
    if (mediaUrl && params.mediaType !== "VIDEO") {
      return {
        message: addQuickReplies({
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [{ title: Array.from(params.message.trim() || "Here's what you requested.").slice(0, 80).join(""), image_url: mediaUrl }],
            },
          },
        }, params.automationId, quickReplies),
        ctaMode: "none" as CtaMode,
      };
    }
    if (mediaUrl) {
      return {
        message: addQuickReplies({ attachment: { type: "video", payload: { url: mediaUrl, is_reusable: true } } }, params.automationId, quickReplies),
        ctaMode: "none" as CtaMode,
      };
    }
  }
  const preferred = params.responseFormat === "LINK" || params.ctaUrl
    ? buildButtonPayload(params.message, params.ctaTitle, params.ctaUrl)
    : { message: { text: params.message.trim() || "Thanks for your message!" } as InstagramMessagePayload, ctaMode: "none" as CtaMode };
  return { ...preferred, message: addQuickReplies(preferred.message, params.automationId, quickReplies) };
}

async function postInstagramMessage(
  igBusinessAccountId: string,
  body: unknown,
  token: string,
  log: {
    endpointName: string;
    hasCommentId?: boolean;
    hasCommenterId?: boolean;
    message: InstagramMessagePayload;
  }
): Promise<"ok" | "capability_error"> {
  console.log("[meta-api] send Instagram Graph message request", {
    endpointFamily: "instagram_graph",
    endpointName: log.endpointName,
    hasIgBusinessAccountId: Boolean(igBusinessAccountId),
    hasCommentId: log.hasCommentId,
    hasCommenterId: log.hasCommenterId,
    messageShape: "attachment" in log.message ? "button_template" : "text",
  });

  try {
    await axios.post(
      `${INSTAGRAM_GRAPH_API_BASE_URL}/${igBusinessAccountId}/messages`,
      body,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return "ok";
  } catch (err) {
    if (isCapabilityError(err)) return "capability_error";
    throw err;
  }
}

function buildQuickReplies(automationId: string, replies: string[], payloads?: string[]) {
  return replies.slice(0, 4).map((reply, index) => ({
    content_type: "text" as const,
    title: Array.from(reply.trim()).slice(0, 20).join(""),
    payload: payloads?.[index] || `AP3K_QUICK_REPLY:${automationId}:${index}`,
  })).filter((item) => item.title);
}

export type DirectResponseResult =
  | { ok: true; messageIds: string[] }
  | { ok: false; metaError: SafeMetaApiError };

export async function sendInstagramDirectResponse(params: {
  token: string;
  igBusinessAccountId: string;
  recipientId: string;
  automationId: string;
  message: string;
  responseFormat?: string | null;
  quickReplies?: string[];
  quickReplyPayloads?: string[];
  ctaTitle?: string | null;
  ctaUrl?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  typingIndicator?: boolean;
  delaySeconds?: number;
}): Promise<DirectResponseResult> {
  const messageIds: string[] = [];
  const quickReplies = buildQuickReplies(params.automationId, params.quickReplies ?? [], params.quickReplyPayloads);

  try {
    if (params.typingIndicator) {
      await sendInstagramSenderAction(params.igBusinessAccountId, params.recipientId, "typing_on", params.token);
    }

    const maximumDelay = [3, 5, 10, 30].includes(Number(params.delaySeconds))
      ? Number(params.delaySeconds)
      : 0;
    if (maximumDelay > 0) {
      const delayMs = (1 + Math.floor(Math.random() * maximumDelay)) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    let mediaFallbackUrl = "";
    if (params.responseFormat === "MEDIA" && params.mediaUrl) {
      const mediaMessage: InstagramMessagePayload = {
        attachment: {
          type: params.mediaType === "VIDEO" ? "video" : "image",
          payload: { url: normalizeCtaUrl(params.mediaUrl), is_reusable: true },
        },
      };
      try {
        const media = await postDirectPayload(params, mediaMessage);
        if (media) messageIds.push(media);
      } catch {
        mediaFallbackUrl = normalizeCtaUrl(params.mediaUrl) ?? "";
      }
    }

    let responseMessage: InstagramMessagePayload;
    if (params.responseFormat === "LINK" && params.ctaUrl) {
      const button = buildButtonPayload(params.message, params.ctaTitle, params.ctaUrl).message;
      responseMessage = { ...button, ...(quickReplies.length > 0 ? { quick_replies: quickReplies } : {}) } as InstagramMessagePayload;
    } else {
      responseMessage = {
        text: `${params.message.trim() || "Thanks for your message!"}${mediaFallbackUrl ? `\n\n${mediaFallbackUrl}` : ""}`,
        ...(quickReplies.length > 0 ? { quick_replies: quickReplies } : {}),
      };
    }

    let sent: string;
    try {
      sent = await postDirectPayload(params, responseMessage);
    } catch (error) {
      if (params.responseFormat !== "LINK") throw error;
      const fallback = buildTextFallbackPayload(params.message, params.ctaTitle, params.ctaUrl).message;
      sent = await postDirectPayload(params, addQuickReplies(fallback, params.automationId, params.quickReplies ?? []));
    }
    if (sent) messageIds.push(sent);

    if (params.typingIndicator) {
      await sendInstagramSenderAction(params.igBusinessAccountId, params.recipientId, "typing_off", params.token).catch(() => undefined);
    }
    return { ok: true, messageIds };
  } catch (error) {
    if (params.typingIndicator) {
      await sendInstagramSenderAction(params.igBusinessAccountId, params.recipientId, "typing_off", params.token).catch(() => undefined);
    }
    return { ok: false, metaError: buildMetaError(error) };
  }
}

async function postDirectPayload(
  params: { token: string; igBusinessAccountId: string; recipientId: string },
  message: InstagramMessagePayload
) {
  const response = await axios.post(
    `${INSTAGRAM_GRAPH_API_BASE_URL}/${params.igBusinessAccountId}/messages`,
    { recipient: { id: params.recipientId }, message },
    { headers: { Authorization: `Bearer ${params.token}`, "Content-Type": "application/json" } }
  );
  return typeof response.data?.message_id === "string" ? response.data.message_id : "";
}

export async function sendInstagramSenderAction(
  igBusinessAccountId: string,
  recipientId: string,
  action: "typing_on" | "typing_off" | "mark_seen",
  token: string
) {
  await axios.post(
    `${INSTAGRAM_GRAPH_API_BASE_URL}/${igBusinessAccountId}/messages`,
    { recipient: { id: recipientId }, sender_action: action },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}

export async function getInstagramRecipientProfile(params: {
  token: string;
  recipientId: string;
}) {
  try {
    const response = await axios.get(`${INSTAGRAM_GRAPH_API_BASE_URL}/${params.recipientId}`, {
      params: { fields: "username,name,profile_pic,is_user_follow_business" },
      headers: { Authorization: `Bearer ${params.token}` },
    });
    return {
      username: typeof response.data?.username === "string" ? response.data.username : undefined,
      name: typeof response.data?.name === "string" ? response.data.name : undefined,
      profilePictureUrl: typeof response.data?.profile_pic === "string" ? response.data.profile_pic : undefined,
      followsBusiness: response.data?.is_user_follow_business === true,
    };
  } catch (error) {
    console.warn("[meta-api] recipient profile lookup failed", { error: getSafeMetaError(error) });
    return null;
  }
}

async function tryPrivateReply(
  igBusinessAccountId: string,
  commentId: string,
  message: InstagramMessagePayload,
  token: string
): Promise<"ok" | "capability_error"> {
  return await postInstagramMessage(
    igBusinessAccountId,
    { recipient: { comment_id: commentId }, message },
    token,
    {
      endpointName: "ig_messages_private_reply",
      hasCommentId: Boolean(commentId),
      message,
    }
  );
}

async function tryDirectDm(
  igBusinessAccountId: string,
  commenterId: string,
  message: InstagramMessagePayload,
  token: string
): Promise<"ok" | "capability_error"> {
  return await postInstagramMessage(
    igBusinessAccountId,
    { recipient: { id: commenterId }, message },
    token,
    {
      endpointName: "ig_messages_direct_dm",
      hasCommenterId: Boolean(commenterId),
      message,
    }
  );
}

/**
 * Sends an Instagram private reply to a comment through Instagram Graph only.
 * AP3K no longer tries Facebook Graph for the user-facing Instagram Login flow.
 */
export async function sendInstagramCommentPrivateReply(params: {
  token: string;
  igBusinessAccountId: string;
  commentId: string;
  commenterId: string;
  message: string;
  ctaTitle?: string | null;
  ctaUrl?: string | null;
  automationId?: string;
  responseFormat?: string | null;
  quickReplies?: string[];
  mediaUrl?: string | null;
  mediaType?: string | null;
}): Promise<PrivateReplyResult> {
  const { token, igBusinessAccountId, commentId, commenterId } = params;
  const preferred = buildConfiguredPrivateReplyPayload({
    automationId: params.automationId ?? commentId,
    message: params.message,
    responseFormat: params.responseFormat,
    quickReplies: params.quickReplies,
    ctaTitle: params.ctaTitle,
    ctaUrl: params.ctaUrl,
    mediaUrl: params.mediaUrl,
    mediaType: params.mediaType,
  });
  const textFallback = buildTextFallbackPayload(params.message, params.ctaTitle, params.ctaUrl);

  try {
    const primary = await tryPrivateReply(igBusinessAccountId, commentId, preferred.message, token);
    if (primary === "ok") {
      return { ok: true, endpoint: "ig_messages_private_reply", ctaMode: preferred.ctaMode };
    }
    return capabilityMissing("ig_messages_private_reply", preferred.ctaMode);
  } catch (primaryErr) {
    const primaryMeta = buildMetaError(primaryErr);

    if (preferred.ctaMode === "button_template" && shouldTryTextFallback(primaryErr)) {
      console.warn("[meta-api] Instagram Graph private reply button template failed — trying text fallback", {
        endpointName: "ig_messages_private_reply",
        status: primaryMeta.status,
        code: primaryMeta.code,
        type: primaryMeta.type,
      });

      try {
        const primaryTextFallback = await tryPrivateReply(
          igBusinessAccountId,
          commentId,
          textFallback.message,
          token
        );
        if (primaryTextFallback === "ok") {
          return { ok: true, endpoint: "ig_messages_private_reply", ctaMode: textFallback.ctaMode };
        }
        return capabilityMissing("ig_messages_private_reply", textFallback.ctaMode);
      } catch (textFallbackErr) {
        console.warn("[meta-api] Instagram Graph private reply text fallback failed — trying direct DM fallback", {
          endpointName: "ig_messages_private_reply",
          error: getSafeMetaError(textFallbackErr),
        });
      }
    } else {
      console.warn("[meta-api] Instagram Graph private reply failed — trying direct DM fallback", {
        endpointName: "ig_messages_private_reply",
        status: primaryMeta.status,
        code: primaryMeta.code,
      });
    }

    try {
      const fallback = await tryDirectDm(igBusinessAccountId, commenterId, preferred.message, token);
      if (fallback === "ok") {
        return { ok: true, endpoint: "ig_messages_direct_dm", ctaMode: preferred.ctaMode };
      }
      return capabilityMissing("ig_messages_direct_dm", preferred.ctaMode);
    } catch (fallbackErr) {
      if (preferred.ctaMode === "button_template" && shouldTryTextFallback(fallbackErr)) {
        console.warn("[meta-api] Instagram Graph direct DM button template failed — trying text fallback", {
          endpointName: "ig_messages_direct_dm",
          error: getSafeMetaError(fallbackErr),
        });
        try {
          const fallbackText = await tryDirectDm(
            igBusinessAccountId,
            commenterId,
            textFallback.message,
            token
          );
          if (fallbackText === "ok") {
            return { ok: true, endpoint: "ig_messages_direct_dm", ctaMode: textFallback.ctaMode };
          }
          return capabilityMissing("ig_messages_direct_dm", textFallback.ctaMode);
        } catch (fallbackTextErr) {
          return {
            ok: false,
            reason: "meta_api_error",
            endpoint: "ig_messages_direct_dm",
            metaError: buildMetaError(fallbackTextErr),
            ctaMode: textFallback.ctaMode,
          };
        }
      }

      return {
        ok: false,
        reason: "meta_api_error",
        endpoint: "ig_messages_direct_dm",
        metaError: buildMetaError(fallbackErr),
        ctaMode: preferred.ctaMode,
      };
    }
  }
}

function capabilityMissing(endpoint: string, ctaMode: CtaMode): PrivateReplyResult {
  console.warn("[meta-api] dm_capability_missing on Instagram Graph", {
    endpointName: endpoint,
    requiredCapabilityHint:
      "instagram_business_manage_messages must be enabled in Meta App Dashboard with Standard or Advanced Access",
  });
  return {
    ok: false,
    reason: "dm_capability_missing",
    endpoint,
    metaError: { code: 3, message: "(#3) Application does not have the capability to make this API call" },
    ctaMode,
  };
}

export function formatPrivateReplyError(result: PrivateReplyResult & { ok: false }): string {
  if (result.reason === "dm_capability_missing") return "dm_capability_missing";
  const { status, code, subcode, message } = result.metaError;
  return [
    status ? `status=${status}` : null,
    code ? `code=${code}` : null,
    subcode ? `subcode=${subcode}` : null,
    message ? `message=${message}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}
