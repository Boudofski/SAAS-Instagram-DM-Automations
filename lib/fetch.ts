import axios from "axios";

export const INSTAGRAM_GRAPH_BASE_URL =
  process.env.INSTAGRAM_GRAPH_BASE_URL ??
  process.env.INSTAGRAM_BASE_URL ??
  "https://graph.instagram.com";
export const META_GRAPH_BASE_URL =
  process.env.META_GRAPH_BASE_URL ?? "https://graph.facebook.com";
const INSTAGRAM_TOKEN_URL =
  process.env.INSTAGRAM_TOKEN_URL ?? "https://api.instagram.com/oauth/access_token";

export function getSafeMetaError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { error?: { message?: string; type?: string; code?: number; error_subcode?: number } }
      | undefined;

    return {
      status,
      message: data?.error?.message ?? error.message,
      type: data?.error?.type,
      code: data?.error?.code,
      subcode: data?.error?.error_subcode,
    };
  }

  return {
    message: error instanceof Error ? error.message : String(error),
  };
}

export function formatSafeMetaError(error: unknown) {
  const safe = getSafeMetaError(error);
  return [
    safe.status ? `status=${safe.status}` : null,
    safe.code ? `code=${safe.code}` : null,
    safe.subcode ? `subcode=${safe.subcode}` : null,
    safe.message ? `message=${safe.message}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export const refreshToken = async (token: string) => {
  console.log("[meta-api] refresh token request", {
    endpointFamily: "instagram_graph",
  });
  const refresh_token = await axios.get(
    `${INSTAGRAM_GRAPH_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
  );
  return refresh_token.data;
};

export const sendDm = async (
  userId: string,
  receiverId: string,
  prompt: string,
  token: string
) => {
  console.log("[meta-api] send DM request", {
    endpointFamily: "meta_graph",
    hasUserId: Boolean(userId),
    hasReceiverId: Boolean(receiverId),
  });
  return await axios.post(
    `${META_GRAPH_BASE_URL}/v21.0/${userId}/messages`,
    {
      recipient: { id: receiverId },
      message: { text: prompt },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const sendPrivateMessage = async (
  userId: string,
  commentId: string,
  message: string,
  token: string
) => {
  console.log("[meta-api] send private reply request", {
    endpointFamily: "meta_graph",
    hasUserId: Boolean(userId),
    hasCommentId: Boolean(commentId),
  });
  return await axios.post(
    `${META_GRAPH_BASE_URL}/v21.0/${userId}/messages`,
    {
      recipient: { comment_id: commentId },
      message: { text: message },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

/**
 * Posts a visible public reply under a comment.
 * Uses the Facebook Graph API — this endpoint lives on graph.facebook.com
 * for all Business/Creator accounts.
 */
export const sendCommentReply = async (
  commentId: string,
  message: string,
  token: string
) => {
  console.log("[meta-api] send comment reply request", {
    endpointFamily: "meta_graph",
    hasCommentId: Boolean(commentId),
  });
  return await axios.post(
    `${META_GRAPH_BASE_URL}/v21.0/${commentId}/replies`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const subscribeInstagramWebhooks = async (
  igAccountId: string,
  token: string
) => {
  console.log("[meta-api] subscribed_apps request", {
    endpointFamily: "meta_graph",
    hasIgAccountId: Boolean(igAccountId),
  });
  return await axios.post(
    `${META_GRAPH_BASE_URL}/v21.0/${igAccountId}/subscribed_apps`,
    null,
    {
      params: {
        subscribed_fields: "comments,messages",
        access_token: token,
      },
    }
  );
};

export const generateToken = async (code: string) => {
  const redirectUri =
    process.env.META_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_HOST_URL
      ? `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`
      : undefined);

  if (!redirectUri) {
    throw new Error("META_REDIRECT_URI is not configured");
  }

  const clientId =
    process.env.INSTAGRAM_APP_ID ??
    process.env.INSTAGRAM_CLIENT_ID ??
    process.env.META_APP_ID;
  const clientSecret =
    process.env.INSTAGRAM_APP_SECRET ??
    process.env.INSTAGRAM_CLIENT_SECRET ?? process.env.META_APP_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Meta Instagram OAuth client credentials are not configured");
  }

  const insta_form = new FormData();
  insta_form.append("client_id", clientId);
  insta_form.append("client_secret", clientSecret);
  insta_form.append("grant_type", "authorization_code");
  insta_form.append("redirect_uri", redirectUri);
  insta_form.append("code", code);

  const shortTokenRes = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    body: insta_form,
  });

  const token = await shortTokenRes.json();
  console.log("[oauth] token exchange result", {
    tokenExchangeStatus: shortTokenRes.status,
    hasAccessToken: Boolean(token.access_token),
  });

  if (shortTokenRes.ok && token.access_token) {
    const long_token = await axios.get(
      `${INSTAGRAM_GRAPH_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${token.access_token}`
    );
    return long_token.data;
  }

  console.error("[oauth] token exchange failed:", token?.error_message ?? token?.error?.message ?? "unknown error");
};
