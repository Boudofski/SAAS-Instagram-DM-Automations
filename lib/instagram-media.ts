export type InstagramMediaIntegration = {
  token?: string | null;
  instagramId?: string | null;
};

export function resolveInstagramMediaConnection(
  integrations: InstagramMediaIntegration[] | undefined
) {
  const integration = integrations?.find((item) => item.token && item.instagramId);
  if (!integration?.token || !integration.instagramId) {
    return { ok: false as const, error: "Reconnect Instagram to load posts." };
  }

  return {
    ok: true as const,
    token: integration.token,
    instagramBusinessAccountId: integration.instagramId,
  };
}

export function instagramMediaFetchError(status: number) {
  if (status === 401 || status === 403) {
    return "AP3k could not load posts. Check Instagram connection and permissions.";
  }

  return "AP3k could not load posts right now.";
}
