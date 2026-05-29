export type InstagramIntegrationStatusBase = {
  id?: string | null;
  name?: string | null;
  instagramId?: string | null;
  status?: string | null;
  reconnectRequired?: boolean | null;
  token?: string | null;
  tokenPresent?: boolean | null;
};

export type InstagramIntegrationStatusInput = InstagramIntegrationStatusBase | null | undefined;

export function isCanonicalInstagramConnected(integration: InstagramIntegrationStatusInput) {
  return Boolean(
    integration?.name === "INSTAGRAM" &&
    integration.instagramId &&
    integration.status === "CONNECTED" &&
    !integration.reconnectRequired &&
    hasUsableIntegrationToken(integration)
  );
}

export function getCanonicalInstagramIntegration<T extends InstagramIntegrationStatusBase>(integrations?: T[] | null) {
  return integrations?.find(isCanonicalInstagramConnected) ?? null;
}

export function hasDisconnectedOrMissingInstagramIntegration(integrations?: InstagramIntegrationStatusInput[] | null) {
  return !integrations?.some(isCanonicalInstagramConnected);
}

function hasUsableIntegrationToken(integration: InstagramIntegrationStatusBase) {
  if (typeof integration.tokenPresent === "boolean") return integration.tokenPresent;
  return typeof integration.token === "string" && integration.token.trim().length > 0;
}
