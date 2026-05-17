import axios from "axios";
import { META_GRAPH_API_BASE_URL, getSafeMetaError } from "@/lib/fetch";

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
      ctaMode: "text_link_fallback" | "none";
    }
  | {
      ok: false;
      reason: "dm_capability_missing" | "meta_api_error";
      endpoint: string;
      metaError: SafeMetaApiError;
      ctaMode: "text_link_fallback" | "none";
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

function buildFinalMessage(
  message: string,
  ctaTitle?: string | null,
  ctaUrl?: string | null
): { text: string; ctaMode: "text_link_fallback" | "none" } {
  if (!ctaUrl || message.includes(ctaUrl)) {
    return { text: message, ctaMode: "none" };
  }
  const suffix = ctaTitle ? `\n\n${ctaTitle}: ${ctaUrl}` : `\n\n${ctaUrl}`;
  return { text: message + suffix, ctaMode: "text_link_fallback" };
}

// ---------------------------------------------------------------------------
// Primary sender — POST /{ig-user-id}/messages with recipient.comment_id
// Returns null on capability error so caller can skip fallback.
// Throws on other axios errors so caller can try fallback.
// ---------------------------------------------------------------------------

async function tryPrivateReply(
  igBusinessAccountId: string,
  commentId: string,
  text: string,
  token: string
): Promise<"ok" | "capability_error"> {
  const url = `${META_GRAPH_API_BASE_URL}/${igBusinessAccountId}/messages`;
  console.log("[meta-api] send private reply request", {
    endpointFamily: "facebook_graph_instagram_business",
    endpointName: "ig_messages_private_reply",
    hasIgBusinessAccountId: Boolean(igBusinessAccountId),
    hasCommentId: Boolean(commentId),
  });
  try {
    await axios.post(
      url,
      { recipient: { comment_id: commentId }, message: { text } },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return "ok";
  } catch (err) {
    if (isCapabilityError(err)) return "capability_error";
    throw err;
  }
}

// Fallback — POST /{ig-user-id}/messages with recipient.id (direct DM)
async function tryDirectDm(
  igBusinessAccountId: string,
  commenterId: string,
  text: string,
  token: string
): Promise<"ok" | "capability_error"> {
  const url = `${META_GRAPH_API_BASE_URL}/${igBusinessAccountId}/messages`;
  console.log("[meta-api] send direct DM fallback request", {
    endpointFamily: "facebook_graph_instagram_business",
    endpointName: "ig_messages_direct_dm",
    hasIgBusinessAccountId: Boolean(igBusinessAccountId),
    hasCommenterId: Boolean(commenterId),
  });
  try {
    await axios.post(
      url,
      { recipient: { id: commenterId }, message: { text } },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return "ok";
  } catch (err) {
    if (isCapabilityError(err)) return "capability_error";
    throw err;
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
 * On Meta error code=3 ("Application does not have the capability") from either
 * attempt, returns { ok: false, reason: "dm_capability_missing" } immediately
 * without further retries — the same permission is required for both endpoints.
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
  const { text, ctaMode } = buildFinalMessage(params.message, params.ctaTitle, params.ctaUrl);

  // ── Primary: private reply linked to the comment ──────────────────────────
  try {
    const primary = await tryPrivateReply(igBusinessAccountId, commentId, text, token);
    if (primary === "ok") {
      return { ok: true, endpoint: "ig_messages_private_reply", ctaMode };
    }
    // code=3 — same permission guards the fallback; skip it
    console.warn("[meta-api] dm_capability_missing on private reply — skipping fallback", {
      endpointName: "ig_messages_private_reply",
      requiredCapabilityHint:
        "instagram_manage_messages must be enabled in Meta App Dashboard with Standard or Advanced Access",
    });
    return {
      ok: false,
      reason: "dm_capability_missing",
      endpoint: "ig_messages_private_reply",
      metaError: { code: 3, message: "(#3) Application does not have the capability to make this API call" },
      ctaMode,
    };
  } catch (primaryErr) {
    const primaryMeta = buildMetaError(primaryErr);
    console.warn("[meta-api] private reply failed — trying direct DM fallback", {
      endpointName: "ig_messages_private_reply",
      status: primaryMeta.status,
      code: primaryMeta.code,
    });

    // ── Fallback: direct DM ───────────────────────────────────────────────
    try {
      const fallback = await tryDirectDm(igBusinessAccountId, commenterId, text, token);
      if (fallback === "ok") {
        return { ok: true, endpoint: "ig_messages_direct_dm", ctaMode };
      }
      // code=3 on fallback too
      console.warn("[meta-api] dm_capability_missing on direct DM fallback", {
        endpointName: "ig_messages_direct_dm",
        requiredCapabilityHint:
          "instagram_manage_messages must be enabled in Meta App Dashboard with Standard or Advanced Access",
      });
      return {
        ok: false,
        reason: "dm_capability_missing",
        endpoint: "ig_messages_direct_dm",
        metaError: { code: 3, message: "(#3) Application does not have the capability to make this API call" },
        ctaMode,
      };
    } catch (fallbackErr) {
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
        ctaMode,
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
