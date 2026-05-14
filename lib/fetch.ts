import axios from "axios";

export const refreshToken = async (token: string) => {
  const refresh_token = await axios.get(
    `${process.env.INSTAGRAM_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
  );
  return refresh_token.data;
};

export const sendDm = async (
  userId: string,
  receiverId: string,
  prompt: string,
  token: string
) => {
  return await axios.post(
    `${process.env.INSTAGRAM_BASE_URL}/v21.0/${userId}/messages`,
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
  return await axios.post(
    `${process.env.INSTAGRAM_BASE_URL}/v21.0/${userId}/messages`,
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
  return await axios.post(
    `https://graph.facebook.com/v21.0/${commentId}/replies`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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

  const insta_form = new FormData();
  insta_form.append("client_id", process.env.INSTAGRAM_CLIENT_ID as string);
  insta_form.append("client_secret", process.env.INSTAGRAM_CLIENT_SECRET as string);
  insta_form.append("grant_type", "authorization_code");
  insta_form.append("redirect_uri", redirectUri);
  insta_form.append("code", code);

  const shortTokenRes = await fetch(process.env.INSTAGRAM_TOKEN_URL as string, {
    method: "POST",
    body: insta_form,
  });

  const token = await shortTokenRes.json();
  if (shortTokenRes.ok && token.access_token) {
    const long_token = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${token.access_token}`
    );
    return long_token.data;
  }

  console.error("[oauth] token exchange failed:", token?.error_message ?? token?.error?.message ?? "unknown error");
};
