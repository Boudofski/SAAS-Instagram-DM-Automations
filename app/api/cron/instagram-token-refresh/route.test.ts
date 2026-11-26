import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findManyIntegrations, updateIntegration, pauseAutomations, notifyReconnect } = vi.hoisted(() => ({
  findManyIntegrations: vi.fn(),
  updateIntegration: vi.fn(),
  pauseAutomations: vi.fn(),
  notifyReconnect: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  client: {
    integrations: {
      findMany: (...args: any[]) => findManyIntegrations(...args),
      updateMany: (...args: any[]) => updateIntegration(...args),
    },
    $transaction: (fn: (tx: unknown) => unknown) => fn({ integrations: { updateMany: updateIntegration }, automation: { updateMany: pauseAutomations } }),
    automation: {
      updateMany: (...args: any[]) => pauseAutomations(...args),
    },
  },
}));

vi.mock("@/lib/email/events", () => ({
  notifyInstagramReconnectEmail: (...args: any[]) => notifyReconnect(...args),
}));

import { GET } from "./route";

describe("Instagram token refresh cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(["", "cron-secret"])("rejects spoofed schedule headers when secret is %s", async (secret) => {
    vi.stubEnv("CRON_SECRET", secret);
    const response = await GET(new Request("https://ap3k.com/api/cron/instagram-token-refresh", {
      headers: { "x-vercel-cron-schedule": "27 4 * * *" },
    }) as any);
    expect(response.status).toBe(401);
    expect(findManyIntegrations).not.toHaveBeenCalled();
  });

  it("checks already-expired tokens and skips stale observations after a reconnect", async () => {
    const expiry = new Date(Date.now() - 60_000);
    findManyIntegrations.mockResolvedValueOnce([{ id: "expired", expiresAt: expiry }, { id: "reconnected", expiresAt: expiry }]).mockResolvedValueOnce([]);
    updateIntegration.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    pauseAutomations.mockResolvedValueOnce({ count: 2 });
    const response = await GET(new Request("https://ap3k.com/api/cron/instagram-token-refresh", {
      headers: { authorization: "Bearer cron-secret" },
    }) as any);
    expect(await response.json()).toMatchObject({ expiredMarked: 1 });
    expect(updateIntegration).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "expired", expiresAt: expiry, reconnectRequired: false }),
    }));
    expect(notifyReconnect).toHaveBeenCalledTimes(1);
    expect(notifyReconnect).toHaveBeenCalledWith({ integrationId: "expired" });
    expect(pauseAutomations).toHaveBeenCalledTimes(1);
  });

  it("marks invalidated Meta tokens for reconnect and pauses active automations", async () => {
    findManyIntegrations.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: "integration-a",
        token: "long-lived-instagram-token-value",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ]);
    updateIntegration.mockResolvedValue({ count: 1 });
    pauseAutomations.mockResolvedValue({ count: 2 });

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 190,
          type: "OAuthException",
          message: "Error validating access token",
        },
      }),
    })));

    const response = await GET(
      new Request("https://ap3k.com/api/cron/instagram-token-refresh", {
        headers: { authorization: "Bearer cron-secret" },
      }) as any,
    );

    expect(response.status).toBe(207);
    expect(updateIntegration).toHaveBeenCalledWith({
      where: { id: "integration-a", token: "long-lived-instagram-token-value", status: "CONNECTED", reconnectRequired: false, planLocked: false },
      data: expect.objectContaining({
        reconnectRequired: true,
        oauthLastError: "instagram_token_invalidated",
        oauthLastErrorSource: "token_refresh",
      }),
    });
    expect(pauseAutomations).toHaveBeenCalledWith({
      where: { integrationId: "integration-a", active: true, archivedAt: null },
      data: expect.objectContaining({
        active: false,
        needsReview: true,
      }),
    });
    expect(notifyReconnect).toHaveBeenCalledWith({ integrationId: "integration-a" });
  });
});
