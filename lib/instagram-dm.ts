import axios from "axios";
import { META_GRAPH_API_BASE_URL, getSafeMetaError } from "@/lib/fetch";

export const INSTAGRAM_GRAPH_BASE_URL =
  process.env.INSTAGRAM_GRAPH_BASE_URL ?? "https://graph.instagram.com";
export const INSTAGRAM_GRAPH_VERSION =
  process.env.INSTAGRAM_GRAPH_VERSION ?? process.env.META_GRAPH_VERSION ?? "v25.0";
export const INSTAGRAM_GRAPH_API_BASE_URL = `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_GRAPH_VERSION}`;

type MessageApiFamily = "facebook_graph_instagram_business" | "instagram_graph";
type CtaMode = "button_template" | "text_link_fallback" | "none";

type InstagramMessagePayload =
  | { text: string }
  | {
      attachment: {
        type: "template";
        payload: {
          template_type: "button";
          text: string;
          buttons: Array<{
            type: "web_url";
            title: string;
            url: string;
          }>;
        };
      };
    };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function shouldTryInstagramGraph(error: unknown): boolean {
  const safe = getSafeMetaError(error);
  return Boolean(
    safe.status === 400 ||
    safe.status === 401 ||
    safe.status === 403 ||
    safe.status === 404 ||
    safe.code === 3 ||
    safe.code === 10 ||
    safe.code === 100 ||
    safe.code === 190 ||
    safe.type === "IGApiException" ||
    safe.type === "OAuthException"
  );
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

function messageBaseUrl(apiFamily: MessageApiFamily) {
  return apiFamily === "instagram_graph"
    ? INSTAGRAM_GRAPH_API_BASE_URL
    : META_GRAPH_API_BASE_URL;
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
  // Meta buttons have strict length limits. Keep this short to avoid invalid payloads.
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

// ---------------------------------------------------------------------------
// Senders
// ---------------------------------------------------------------------------

async function tryPrivateReplyOnFamily(
  apiFamily: MessageApiFamily,
  igBusinessAccountId: string,
  commentId: string,
  message: InstagramMessagePayload,
  token: string
): Promise<"ok" | "capability_error"> {
  const url = `${messageBaseUrl(apiFamily)}/${igBusinessAccountId}/messages`;
  console.log("[meta-api] send private reply request", {
    endpointFamily: apiFamily,
    endpointName: "ig_messages_private_reply",
    hasIgBusinessAccountId: Boolean(igBusinessAccountId),
    hasCommentId: Boolean(commentId),
    messageShape: "attachment" in message ? "button_template" : "text",
  });
  try {
    await axios.post(
      url,
      { recipient: { comment_id: commentId }, message },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return "ok";
  } catch (err) {
    if (isCapabilityError(err)) return "capability_error";
    throw err;
  }
}

async function tryPrivateReplyOnInstagramGraph(
  igBusinessAccountId: string,
  commentId: string,
  message: InstagramMessagePayload,
  token: string
): Promise<"ok" | "capability_error"> {
  try {
    return await tryPrivateReplyOnFamily(
      "instagram_graph",
      igBusinessAccountId,
      commentId,
      message,
      token
    );
  } catch (instagramErr) {
    if (isCapabilityError(instagramErr)) return "capability_error";
    throw instagramErr;
  }
}

async function tryPrivateReply(
  igBusinessAccountId: string,
  commentId: string,
  message: InstagramMessagePayload,
  token: string
): Promise<"ok" | "capability_error"> {
  try {
    const facebookResult = await tryPrivateReplyOnFamily(
      "facebook_graph_instagram_business",
      igBusinessAccountId,
      commentId,
      message,
      token
    );

    if (facebookResult === "ok") return "ok";

    // Facebook Graph can return code=3 for Instagram Login tokens or for apps whose
    // messaging capability is available only on graph.instagram.com. Do not stop here;
    // try the Instagram Graph host before classifying the send as impossible.
    console.warn("[meta-api] facebook graph private reply capability missing — trying instagram graph", {
      endpointName: "ig_messages_private_reply",
      facebookGraphError: {
        code: 3,
        message: "(#3) Application does not have the capability to make this API call",
      },
    });
    return await tryPrivateReplyOnInstagramGraph(igBusinessAccountId, commentId, message, token);
  } catch (facebookErr) {
    if (!shouldTryInstagramGraph(facebookErr)) throw facebookErr;
    console.warn("[meta-api] facebook graph private reply failed — trying instagram graph", {
      endpointName: "ig_messages_private_reply",
      facebookGraphError: getSafeMetaError(facebookErr),
    });
    return await tryPrivateReplyOnInstagramGraph(igBusinessAccountId, commentId, message, token);
  }
}

async function tryDirectDmOnFamily(
  apiFamily: MessageApiFamily,
  igBusinessAccountId: string,
  commenterId: string,
  message: InstagramMessagePayload,
  token: string
): Promise<"ok" | "capability_error"> {
  const url = `${messageBaseUrl(apiFamily)}/${igBusinessAccountId}/messages`;
  console.log("[meta-api] send direct DM fallback request", {
    endpointFamily: apiFamily,
    endpointName: "ig_messages_direct_dm",
    hasIgBusinessAccountId: Boolean(igBusinessAccountId),
    hasCommenterId: Boolean(commenterId),
    messageShape: "attachment" in message ? "button_template" : "text",
  });
  try {
    await axios.post(
      url,
      { recipient: { id: commenterId }, message },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return "ok";
  } catch (err) {
    if (isCapabilityError(err)) return "capability_error";
    throw err;
  }
}

async function tryDirectDmOnInstagramGraph(
  igBusinessAccountId: string,
  commenterId: string,
  message: InstagramMessagePayload,
  token: string
): Promise<"ok" | "capability_error"> {
  try {
    return await tryDirectDmOnFamily(
      "instagram_graph",
      igBusinessAccountId,
      commenterId,
      message,
      token
    );
  } catch (instagramErr) {
    if (isCapabilityError(instagramErr)) return "capability_error";
    throw instagramErr;
  }
}

async function tryDirectDm(
  igBusinessAccountId: string,
  commenterId: string,
  message: InstagramMessagePayload,
  token: string
): Promise<"ok" | "capability_error"> {
  try {
    const facebookResult = await tryDirectDmOnFamily(
      "facebook_graph_instagram_business",
      igBusinessAccountId,
      commenterId,
      message,
      token
    );

    if (facebookResult === "ok") return "ok";

    console.warn("[meta-api] facebook graph direct DM capability missing — trying instagram graph", {
      endpointName: "ig_messages_direct_dm",
      facebookGraphError: {
        code: 3,
        message: "(#3) Application does not have the capability to make this API call",
      },
    });
    return await tryDirectDmOnInstagramGraph(igBusinessAccountId, commenterId, message, token);
  } catch (facebookErr) {
    if (!shouldTryInstagramGraph(facebookErr)) throw facebookErr;
    console.warn("[meta-api] facebook graph direct DM failed — trying instagram graph", {
      endpointName: "ig_messages_direct_dm",
      facebookGraphError: getSafeMetaError(facebookErr),
    });
    return await tryDirectDmOnInstagramGraph(igBusinessAccountId, commenterId, message, token);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends an Instagram private reply to a comment.
 *
 * Primary:  POST /{ig-business-account-id}/messages  { recipient: { comment_id } }
 *   → links DM visibly to the comment in-thread.
 *
 * Fallback: POST /{ig-business-account-id}/messages  { recipient: { id: commenterId } }
 *   → plain direct DM, used only when primary fails for a non-capability reason.
 *
 * CTA behavior:
 * - If a CTA URL is configured, AP3k first sends a real Instagram button template.
 * - Only if Meta rejects that template does AP3k fall back to text + link.
 *
 * Host compatibility:
 * - Legacy Facebook Login/Page tokens use graph.facebook.com.
 * - New Instagram Login tokens use graph.instagram.com.
 * The sender tries the legacy host first, then falls back to Instagram Graph on
 * token/host/capability-shaped errors so both integration paths can coexist.
 *
 * Never logs the token.
 */
export async function sendInstagramCommentPrivateReply(params: {
  token: string;
  igBusinessAccountId: string;
  commentId: string;
  commenterId: string;
  message: string;
  ctaTitle?: string | null;
  ctaUrl?: string | null;
}): Promise<PrivateReplyResult> {
  const { token, igBusinessAccountId, commentId, commenterId } = params;
  const preferred = buildButtonPayload(params.message, params.ctaTitle, params.ctaUrl);
  const textFallback = buildTextFallbackPayload(params.message, params.ctaTitle, params.ctaUrl);

  // ── Primary: private reply linked to the comment ──────────────────────────
  try {
    const primary = await tryPrivateReply(igBusinessAccountId, commentId, preferred.message, token);
    if (primary === "ok") {
      return { ok: true, endpoint: "ig_messages_private_reply", ctaMode: preferred.ctaMode };
    }
    // code=3 after both Facebook Graph and Instagram Graph — same permission guards
    // the fallback; skip it only after both hosts were tried.
    console.warn("[meta-api] dm_capability_missing on private reply — skipping fallback", {
      endpointName: "ig_messages_private_reply",
      requiredCapabilityHint:
        "instagram_manage_messages or instagram_business_manage_messages must be enabled in Meta App Dashboard with Standard or Advanced Access",
    });
    return {
      ok: false,
      reason: "dm_capability_missing",
      endpoint: "ig_messages_private_reply",
      metaError: { code: 3, message: "(#3) Application does not have the capability to make this API call" },
      ctaMode: preferred.ctaMode,
    };
  } catch (primaryErr) {
    const primaryMeta = buildMetaError(primaryErr);

    if (preferred.ctaMode === "button_template" && shouldTryTextFallback(primaryErr)) {
      console.warn("[meta-api] private reply button template failed — trying text fallback", {
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
        return {
          ok: false,
          reason: "dm_capability_missing",
          endpoint: "ig_messages_private_reply",
          metaError: { code: 3, message: "(#3) Application does not have the capability to make this API call" },
          ctaMode: textFallback.ctaMode,
        };
      } catch (textFallbackErr) {
        const textFallbackMeta = buildMetaError(textFallbackErr);
        console.warn("[meta-api] private reply text fallback failed — trying direct DM fallback", {
          endpointName: "ig_messages_private_reply",
          status: textFallbackMeta.status,
          code: textFallbackMeta.code,
          type: textFallbackMeta.type,
        });
      }
    } else {
      console.warn("[meta-api] private reply failed — trying direct DM fallback", {
        endpointName: "ig_messages_private_reply",
        status: primaryMeta.status,
        code: primaryMeta.code,
      });
    }

    // ── Fallback: direct DM ───────────────────────────────────────────────
    try {
      const fallback = await tryDirectDm(igBusinessAccountId, commenterId, preferred.message, token);
      if (fallback === "ok") {
        return { ok: true, endpoint: "ig_messages_direct_dm", ctaMode: preferred.ctaMode };
      }
      // code=3 on fallback too
      console.warn("[meta-api] dm_capability_missing on direct DM fallback", {
        endpointName: "ig_messages_direct_dm",
        requiredCapabilityHint:
          "instagram_manage_messages or instagram_business_manage_messages must be enabled in Meta App Dashboard with Standard or Advanced Access",
      });
      return {
        ok: false,
        reason: "dm_capability_missing",
        endpoint: "ig_messages_direct_dm",
        metaError: { code: 3, message: "(#3) Application does not have the capability to make this API call" },
        ctaMode: preferred.ctaMode,
      };
    } catch (fallbackErr) {
      if (preferred.ctaMode === "button_template" && shouldTryTextFallback(fallbackErr)) {
        console.warn("[meta-api] direct DM button template failed — trying text fallback", {
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
        } catch (fallbackTextErr) {
          const fallbackTextMeta = buildMetaError(fallbackTextErr);
          return {
            ok: false,
            reason: "meta_api_error",
            endpoint: "ig_messages_direct_dm",
            metaError: fallbackTextMeta,
            ctaMode: textFallback.ctaMode,
          };
        }
      }

      const fallbackMeta = buildMetaError(fallbackErr);
      console.warn("[meta-api] direct DM fallback also failed", {
        endpointName: "ig_messages_direct_dm",
        status: fallbackMeta.status,
        code: fallbackMeta.code,
        type: fallbackMeta.type,
      });
      return {
        ok: false,
        reason: "meta_api_error",
        endpoint: "ig_messages_direct_dm",
        metaError: fallbackMeta,
        ctaMode: preferred.ctaMode,
      };
    }
  }
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
