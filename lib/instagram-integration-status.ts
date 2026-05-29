export type InstagramIntegrationStatusBase = {
  id?: string | null;
  name?: string | null;
  instagramId?: string | null;
  status?: string | null;
  reconnectRequired?: boolean | null;
};

export type InstagramIntegrationStatusInput = InstagramIntegrationStatusBase | null | undefined;

export function isCanonicalInstagramConnected(integration: InstagramIntegrationStatusInput) {
  return Boolean(
    integration?.name === "INSTAGRAM" &&
    integration.instagramId &&
    integration.status === "CONNECTED" &&
    !integration.reconnectRequired
  );
}

export function getCanonicalInstagramIntegration<T extends InstagramIntegrationStatusBase>(integrations?: T[] | null) {
  return integrations?.find(isCanonicalInstagramConnected) ?? null;
}

export function hasDisconnectedOrMissingInstagramIntegration(integrations?: InstagramIntegrationStatusInput[] | null) {
  return !integrations?.some(isCanonicalInstagramConnected);
}
