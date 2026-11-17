export type IntegrationAlertState = {
  status: string;
  reconnectRequired: boolean;
  expiresAt: Date | null;
  oauthLastErrorAt: Date | null;
  webhookSubscriptionSubscribed: boolean | null;
  webhookSubscriptionError: string | null;
  webhookSubscriptionLastAttemptedAt: Date | null;
};

export function currentIntegrationIncident(state: IntegrationAlertState) {
  if (state.status === "DISCONNECTED") return null;
  if (state.reconnectRequired) {
    return { kind: "authorization" as const, key: `authorization:${state.oauthLastErrorAt?.toISOString() ?? state.expiresAt?.toISOString() ?? "current"}`, at: state.oauthLastErrorAt };
  }
  // A successful subscription supersedes a historical error string.
  if (state.webhookSubscriptionSubscribed === false && state.webhookSubscriptionError) {
    return { kind: "subscription" as const, key: `subscription:${state.expiresAt?.toISOString() ?? "current"}`, at: state.webhookSubscriptionLastAttemptedAt };
  }
  return null;
}

export const integrationAlertSelect = {
  status: true, reconnectRequired: true, expiresAt: true, oauthLastErrorAt: true,
  webhookSubscriptionSubscribed: true, webhookSubscriptionError: true,
  webhookSubscriptionLastAttemptedAt: true,
} as const;
