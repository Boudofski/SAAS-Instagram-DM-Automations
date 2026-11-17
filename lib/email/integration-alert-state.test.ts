import { describe, expect, it } from 'vitest';
import { currentIntegrationIncident, type IntegrationAlertState } from './integration-alert-state';
const healthy: IntegrationAlertState = { status: 'CONNECTED', reconnectRequired: false, expiresAt: new Date('2027-01-01'), oauthLastErrorAt: null, webhookSubscriptionSubscribed: true, webhookSubscriptionError: 'old failure', webhookSubscriptionLastAttemptedAt: new Date('2026-11-14') };
describe('current connection incidents', () => {
  it('ignores a historical failure when subscription succeeded', () => expect(currentIntegrationIncident(healthy)).toBeNull());
  it('ignores deliberately disconnected accounts', () => expect(currentIntegrationIncident({ ...healthy, status: 'DISCONNECTED', reconnectRequired: true })).toBeNull());
  it('keeps subscription retry timestamps out of the incident key', () => {
    const failed = { ...healthy, webhookSubscriptionSubscribed: false };
    expect(currentIntegrationIncident(failed)?.key).toBe(currentIntegrationIncident({ ...failed, webhookSubscriptionLastAttemptedAt: new Date() })?.key);
  });
  it('prioritizes actual reconnect state over stale subscription diagnostics', () => expect(currentIntegrationIncident({ ...healthy, reconnectRequired: true })?.kind).toBe('authorization'));
});
