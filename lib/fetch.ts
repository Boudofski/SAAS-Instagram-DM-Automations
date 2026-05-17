import axios from "axios";

export const META_GRAPH_BASE_URL =
  process.env.META_GRAPH_BASE_URL ?? "https://graph.facebook.com";
export const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v25.0";
export const META_GRAPH_API_BASE_URL = `${META_GRAPH_BASE_URL}/${META_GRAPH_VERSION}`;

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
  return exchangeLongLivedFacebookUserToken(token);
};

export const sendDm = async (
  userId: string,
  receiverId: string,
  prompt: string,
  token: string
) => {
  console.log("[meta-api] send DM request", {
    endpointFamily: "facebook_graph_instagram_business",
    hasUserId: Boolean(userId),
    hasReceiverId: Boolean(receiverId),
  });
  return await axios.post(
    `${META_GRAPH_API_BASE_URL}/${userId}/messages`,
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
    endpointFamily: "facebook_graph_instagram_business",
    hasUserId: Boolean(userId),
    hasCommentId: Boolean(commentId),
  });
  return await axios.post(
    `${META_GRAPH_API_BASE_URL}/${userId}/messages`,
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
 * Posts a threaded reply directly under a comment (Advanced Access).
 * Endpoint: POST /{commentId}/replies
 * Requires instagram_manage_comments at Advanced Access level after App Review.
 */
export const sendCommentReply = async (
  commentId: string,
  message: string,
  token: string
) => {
  console.log("[meta-api] send threaded comment reply (Advanced Access)", {
    endpointFamily: "facebook_graph_instagram_business",
    accessMode: "advanced",
    endpoint: "comment_replies",
    hasCommentId: Boolean(commentId),
  });
  return await axios.post(
    `${META_GRAPH_API_BASE_URL}/${commentId}/replies`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

/**
 * Posts a top-level comment on a media object (Standard Access).
 * Endpoint: POST /{mediaId}/comments
 * Works without App Review. Use with an @mention prefix as a fallback
 * when threaded replies are blocked by capability restrictions.
 */
export const sendMediaComment = async (
  mediaId: string,
  message: string,
  token: string
) => {
  console.log("[meta-api] send media comment (Standard Access)", {
    endpointFamily: "facebook_graph_instagram_business",
    accessMode: "standard",
    endpoint: "media_comments",
    hasMediaId: Boolean(mediaId),
  });
  return await axios.post(
    `${META_GRAPH_API_BASE_URL}/${mediaId}/comments`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const subscribePageWebhooks = async (
  pageId: string,
  token: string
) => {
  console.log("[meta-api] subscribed_apps request", {
    endpointFamily: "facebook_graph_page",
    hasPageId: Boolean(pageId),
  });
  return await axios.post(
    `${META_GRAPH_API_BASE_URL}/${pageId}/subscribed_apps`,
    null,
    {
      params: {
        subscribed_fields: "comments,messages",
        access_token: token,
      },
    }
  );
};

export const subscribeInstagramWebhooks = subscribePageWebhooks;

function getMetaOAuthConfig() {
  const redirectUri =
    process.env.META_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_HOST_URL
      ? `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`
      : undefined);

  if (!redirectUri) {
    throw new Error("META_REDIRECT_URI is not configured");
  }

  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET are required for Facebook Business OAuth");
  }

  return { clientId, clientSecret, redirectUri };
}

function assertAccessToken(value: unknown) {
  return typeof value === "string" && value.trim().length > 20 ? value : null;
}

export const exchangeLongLivedFacebookUserToken = async (shortUserToken: string) => {
  const { clientId, clientSecret } = getMetaOAuthConfig();
  const longToken = await axios.get(`${META_GRAPH_API_BASE_URL}/oauth/access_token`, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: shortUserToken,
    },
  });

  const accessToken = assertAccessToken(longToken.data?.access_token);
  if (!accessToken) return null;

  return {
    accessToken,
    expiresIn:
      typeof longToken.data?.expires_in === "number"
        ? longToken.data.expires_in
        : undefined,
  };
};

export const generateToken = async (code: string) => {
  const { clientId, clientSecret, redirectUri } = getMetaOAuthConfig();

  const shortTokenRes = await axios.get(`${META_GRAPH_API_BASE_URL}/oauth/access_token`, {
    params: {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    },
  });

  const shortAccessToken = assertAccessToken(shortTokenRes.data?.access_token);
  console.log("[oauth] facebook code exchange result", {
    endpointFamily: "facebook_graph_oauth",
    tokenExchangeStatus: shortTokenRes.status,
    hasAccessToken: Boolean(shortAccessToken),
    authProduct: "facebook_login_for_business",
  });

  if (!shortAccessToken) {
    console.error("[oauth] facebook code exchange failed: missing access_token");
    return null;
  }

  const longToken = await exchangeLongLivedFacebookUserToken(shortAccessToken);
  console.log("[oauth] facebook long-lived token exchange result", {
    endpointFamily: "facebook_graph_oauth",
    hasAccessToken: Boolean(longToken?.accessToken),
    authProduct: "facebook_login_for_business",
  });

  return longToken;
};

export type EligibleInstagramAccount = {
  pageId: string;
  pageName?: string;
  pageAccessToken: string;
  instagramBusinessAccountId: string;
  instagramUsername?: string;
  profilePictureUrl?: string;
  igAccountSource: "instagram_business_account" | "connected_instagram_account";
  tasks: string[];
  diagnostics: {
    pagesReturned: number;
    pageLookupAttempts: Array<{
      pageId: string;
      pageName?: string;
      hasPageAccessToken: boolean;
      status: "skipped_missing_page_token" | "ok" | "failed";
      foundInstagramField?: "instagram_business_account" | "connected_instagram_account" | "none";
      error?: string;
    }>;
    foundInstagramField: string;
    igAccountSource: string;
    selectedPageName?: string;
    selectedPageId?: string;
    selectedInstagramUsername?: string;
  };
};

export const getEligibleFacebookInstagramAccounts = async (userToken: string) => {
  const accounts = await axios.get(`${META_GRAPH_API_BASE_URL}/me/accounts`, {
    params: {
      fields:
        "id,name,access_token,tasks,instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url}",
      access_token: userToken,
    },
  });

  const pages = Array.isArray(accounts.data?.data) ? accounts.data.data : [];
  const pageLookupAttempts: Array<{
    pageId: string;
    pageName?: string;
    hasPageAccessToken: boolean;
    status: "skipped_missing_page_token" | "ok" | "failed";
    foundInstagramField?: "instagram_business_account" | "connected_instagram_account" | "none";
    error?: string;
  }> = [];

  console.log("[oauth] step me/accounts_success", {
    endpointFamily: "facebook_graph_page",
    pageCount: pages.length,
  });

  const eligibleAccounts: EligibleInstagramAccount[] = [];

  for (const page of pages) {
    const pageId = String(page?.id ?? "");
    const pageName = page?.name as string | undefined;
    const pageAccessToken = assertAccessToken(page?.access_token);
    const tasks = Array.isArray(page?.tasks) ? page.tasks.map(String) : [];

    if (!pageId || !pageAccessToken) {
      pageLookupAttempts.push({
        pageId,
        pageName,
        hasPageAccessToken: Boolean(pageAccessToken),
        status: "skipped_missing_page_token",
      });
      continue;
    }

    try {
      const directInstagramBusinessAccount = page?.instagram_business_account;
      const directConnectedInstagramAccount = page?.connected_instagram_account;
      const pageLookup = await axios.get(`${META_GRAPH_API_BASE_URL}/${pageId}`, {
        params: {
          fields:
            "id,name,instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url}",
          access_token: pageAccessToken,
        },
      });
      const instagramBusinessAccount =
        pageLookup.data?.instagram_business_account ?? directInstagramBusinessAccount;
      const connectedInstagramAccount =
        pageLookup.data?.connected_instagram_account ?? directConnectedInstagramAccount;
      const account = instagramBusinessAccount ?? connectedInstagramAccount;
      const igAccountSource = instagramBusinessAccount
        ? ("instagram_business_account" as const)
        : connectedInstagramAccount
          ? ("connected_instagram_account" as const)
          : undefined;

      pageLookupAttempts.push({
        pageId,
        pageName,
        hasPageAccessToken: true,
        status: "ok",
        foundInstagramField: igAccountSource ?? "none",
      });

      if (account?.id && igAccountSource) {
        const diagnostics = {
          pagesReturned: pages.length,
          pageLookupAttempts,
          foundInstagramField: igAccountSource,
          igAccountSource,
          selectedPageName: pageName,
          selectedPageId: pageId,
          selectedInstagramUsername: account.username as string | undefined,
        };
        eligibleAccounts.push({
          pageId,
          pageName,
          pageAccessToken,
          instagramBusinessAccountId: String(account.id),
          instagramUsername: account.username as string | undefined,
          profilePictureUrl: account.profile_picture_url as string | undefined,
          igAccountSource,
          tasks,
          diagnostics,
        });
      }
    } catch (error) {
      pageLookupAttempts.push({
        pageId,
        pageName,
        hasPageAccessToken: true,
        status: "failed",
        error: formatSafeMetaError(error) || "page_lookup_failed",
      });
    }
  }

  console.log("[oauth] step page_instagram_lookup_result", {
    pagesReturned: pages.length,
    pageLookupAttempts: pageLookupAttempts.length,
    eligibleAccounts: eligibleAccounts.length,
    eligibleWithMessagingAndModerate: eligibleAccounts.filter((account) => {
      if (!account.tasks.length) return true;
      return account.tasks.includes("MESSAGING") && account.tasks.includes("MODERATE");
    }).length,
  });

  return {
    pagesReturned: pages.length,
    pageLookupAttempts,
    eligibleAccounts: eligibleAccounts.filter((account) => {
      if (!account.tasks.length) return true;
      return account.tasks.includes("MESSAGING") && account.tasks.includes("MODERATE");
    }),
  };
};

export const resolveFacebookBusinessInstagramAccount = async (userToken: string) => {
  const result = await getEligibleFacebookInstagramAccounts(userToken);
  const account = result.eligibleAccounts[0];

  if (account) return account;

  if (
    !result.pagesReturned ||
    result.pageLookupAttempts.every((attempt) => !attempt.hasPageAccessToken)
  ) {
    const error = new Error("page_token_missing");
    (error as any).diagnostics = {
      pagesReturned: result.pagesReturned,
      pageLookupAttempts: result.pageLookupAttempts,
      foundInstagramField: "none",
    };
    throw error;
  }

  const error = new Error("ig_business_not_linked");
  (error as any).diagnostics = {
    pagesReturned: result.pagesReturned,
    pageLookupAttempts: result.pageLookupAttempts,
    foundInstagramField: "none",
  };
  throw error;
};

export const debugPageToken = async (token: string) => {
  const { clientId, clientSecret } = getMetaOAuthConfig();
  return await axios.get(`${META_GRAPH_API_BASE_URL}/debug_token`, {
    params: {
      input_token: token,
      access_token: `${clientId}|${clientSecret}`,
    },
  });
};

export const getPageWebhookSubscriptions = async (pageId: string, pageToken: string) => {
  return await axios.get(`${META_GRAPH_API_BASE_URL}/${pageId}/subscribed_apps`, {
    params: { access_token: pageToken },
  });
};

export const getPageTokenPermissions = async (pageToken: string) => {
  return await axios.get(`${META_GRAPH_API_BASE_URL}/me/permissions`, {
    params: { access_token: pageToken },
  });
};

export const getLinkedInstagramBusinessAccount = async (
  pageId: string,
  pageToken: string
) => {
  return await axios.get(
    `${META_GRAPH_API_BASE_URL}/${pageId}`,
    {
      params: {
        fields: "id,name,instagram_business_account{id,username,profile_picture_url}",
        access_token: pageToken,
      },
    }
  );
};
