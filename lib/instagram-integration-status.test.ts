import { describe, expect, it } from "vitest";
import {
  getCanonicalInstagramIntegration,
  hasDisconnectedOrMissingInstagramIntegration,
  isCanonicalInstagramConnected,
  shouldReconnectInstagram,
} from "./instagram-integration-status";

const connected = {
  id: "connected",
  name: "INSTAGRAM",
  instagramId: "ig-connected",
  status: "CONNECTED",
  reconnectRequired: false,
  tokenPresent: true,
};

describe("canonical Instagram integration status", () => {
  it("uses CONNECTED status, an Instagram id, and reconnect state as the canonical connected source", () => {
    expect(isCanonicalInstagramConnected(connected)).toBe(true);
    expect(isCanonicalInstagramConnected({ ...connected, status: "DISCONNECTED" })).toBe(false);
    expect(isCanonicalInstagramConnected({ ...connected, name: "CRM" })).toBe(false);
    expect(isCanonicalInstagramConnected({ ...connected, instagramId: null })).toBe(false);
    expect(isCanonicalInstagramConnected({ ...connected, reconnectRequired: true })).toBe(false);
    expect(isCanonicalInstagramConnected({ ...connected, tokenPresent: false })).toBe(false);
    expect(isCanonicalInstagramConnected({ ...connected, tokenPresent: undefined, token: "stored-token" })).toBe(true);
    expect(isCanonicalInstagramConnected({ ...connected, tokenPresent: undefined, token: null })).toBe(false);
  });

  it("prefers the current connected integration over stale disconnected history", () => {
    const disconnected = {
      id: "old",
      name: "INSTAGRAM",
      instagramId: "ig-old",
      status: "DISCONNECTED",
      reconnectRequired: false,
    };

    expect(getCanonicalInstagramIntegration([disconnected, connected])?.id).toBe("connected");
  });

  it("treats missing and disconnected-only integration lists as disconnected", () => {
    expect(hasDisconnectedOrMissingInstagramIntegration([])).toBe(true);
    expect(hasDisconnectedOrMissingInstagramIntegration([{ ...connected, status: "DISCONNECTED" }])).toBe(true);
    expect(hasDisconnectedOrMissingInstagramIntegration([connected])).toBe(false);
  });

  it("detects an existing Instagram account that needs authorization again", () => {
    expect(shouldReconnectInstagram({ ...connected, reconnectRequired: true })).toBe(true);
    expect(shouldReconnectInstagram({ ...connected, expiresAt: new Date(Date.now() - 60_000) })).toBe(true);
    expect(shouldReconnectInstagram({ ...connected, tokenPresent: false })).toBe(true);
    expect(shouldReconnectInstagram(connected)).toBe(false);
    expect(shouldReconnectInstagram({ ...connected, status: "DISCONNECTED" })).toBe(false);
    expect(shouldReconnectInstagram({ ...connected, planLocked: true })).toBe(false);
  });
});
