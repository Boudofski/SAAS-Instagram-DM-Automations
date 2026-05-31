import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireOwnerAdmin = vi.fn();
const mockAuditCreate = vi.fn();
const mockIntegrationsFindUnique = vi.fn();
const mockIntegrationsUpdate = vi.fn();
const mockSnapshotCreate = vi.fn();
const mockSnapshotFindFirst = vi.fn();
const mockAutomationUpdateMany = vi.fn();
const mockRevalidatePath = vi.fn();
const mockFetch = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireOwnerAdmin: (...args: any[]) => mockRequireOwnerAdmin(...args),
}));
vi.mock("@/lib/prisma", () => ({
  client: {
    adminAuditLog: { create: (...args: any[]) => mockAuditCreate(...args) },
    integrations: {
      findUnique: (...args: any[]) => mockIntegrationsFindUnique(...args),
      update: (...args: any[]) => mockIntegrationsUpdate(...args),
    },
    instagramAccountSnapshot: {
      create: (...args: any[]) => mockSnapshotCreate(...args),
      findFirst: (...args: any[]) => mockSnapshotFindFirst(...args),
    },
    automation: {
      updateMany: (...args: any[]) => mockAutomationUpdateMany(...args),
    },
  },
}));
vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));
vi.stubGlobal("fetch", mockFetch);

import {
  adminRefreshProfileSnapshotAction,
  adminMarkReconnectRequiredAction,
  adminSoftDisconnectAction,
  adminPauseCampaignsForAccountAction,
} from "./account-actions";

const ADMIN = { clerkId: "clerk_admin", email: "admin@example.com" };

function integration(overrides: Record<string, unknown> = {}) {
  return {
    id: "int-1",
    instagramId: "ig-123",
    instagramUsername: "test_user",
    profilePictureUrl: "https://example.com/pic.jpg",
    status: "CONNECTED",
    reconnectRequired: false,
    userId: "user-1",
    token: "EAA_test_token",
    lastAdminNote: null,
    lastAdminActionAt: null,
    ...overrides,
  };
}

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

// ---------------------------------------------------------------------------
describe("adminRefreshProfileSnapshotAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireOwnerAdmin.mockResolvedValue(ADMIN);
    mockAuditCreate.mockResolvedValue({ id: "audit-1" });
    mockIntegrationsFindUnique.mockResolvedValue(integration());
    mockSnapshotCreate.mockResolvedValue({ id: "snap-1" });
    mockIntegrationsUpdate.mockResolvedValue({ id: "int-1" });
    // Ensure once-queue is clear, then set default: both basic + stats succeed
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "ig-123",
        username: "test_user",
        profile_picture_url: "https://example.com/newpic.jpg",
        followers_count: 500,
        media_count: 20,
        account_type: "BUSINESS",
      }),
    });
    // Default: no previous snapshot (first-ever refresh)
    mockSnapshotFindFirst.mockResolvedValue(null);
  });

  it("rejects reason shorter than 5 characters", async () => {
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "shor" }));
    expect(result.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks non-admin callers", async () => {
    mockRequireOwnerAdmin.mockRejectedValue(new Error("Unauthorized"));
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Valid reason" }));
    expect(result.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 404 when integration not found", async () => {
    mockIntegrationsFindUnique.mockResolvedValue(null);
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "none", reason: "Valid reason" }));
    expect(result.status).toBe(404);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("first fetch uses only basic fields, second uses only stats fields, token in Bearer header not URL", async () => {
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [basicUrl, basicOpts] = mockFetch.mock.calls[0] as [string, RequestInit];
    const [statsUrl] = mockFetch.mock.calls[1] as [string, RequestInit];
    // Basic URL contains id/username/profile_picture_url but NOT optional fields
    expect(basicUrl).toContain("ig-123");
    expect(basicUrl).toContain("username");
    expect(basicUrl).not.toContain("followers_count");
    expect(basicUrl).not.toContain("EAA_test_token");
    expect((basicOpts?.headers as Record<string, string>)?.Authorization).toMatch(/^Bearer /);
    // Stats URL contains optional fields
    expect(statsUrl).toContain("followers_count");
    expect(statsUrl).toContain("media_count");
    expect(statsUrl).toContain("account_type");
    // Snapshot written with data from both calls
    expect(mockSnapshotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ integrationId: "int-1", source: "admin_refresh", followersCount: 500 }),
      })
    );
  });

  it("audit SUCCESS log does not contain the token", async () => {
    await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    const serialized = JSON.stringify(mockAuditCreate.mock.calls);
    expect(serialized).not.toContain("EAA_test_token");
  });

  it("returns 500 with safe Meta error details when basic fetch returns non-2xx", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: 190, error_subcode: 463, type: "OAuthException", message: "Error validating access token" },
      }),
    });
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(500);
    expect(String(result.data)).toContain("400");
    expect(String(result.data)).toContain("190");
    expect(String(result.data)).toContain("OAuthException");
    expect(mockSnapshotCreate).not.toHaveBeenCalled();
  });

  it("stores Meta error code, subcode, type, sanitized message in FAILED audit after field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: 190, error_subcode: 463, type: "OAuthException", message: "Error validating access token: Session has expired" },
      }),
    });
    await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          after: expect.objectContaining({
            httpStatus: 400,
            metaCode: 190,
            metaSubcode: 463,
            metaType: "OAuthException",
          }),
        }),
      })
    );
  });

  it("redacts EAA token patterns from Meta error messages in audit log and user response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: 190, type: "OAuthException", message: "Token EAAsecretabc123 is invalid" },
      }),
    });
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    const serialized = JSON.stringify(mockAuditCreate.mock.calls);
    expect(serialized).not.toContain("EAAsecretabc123");
    expect(String(result.data)).not.toContain("EAAsecretabc123");
    expect(String(result.data)).not.toContain("EAA_test_token");
  });

  it("optional stats failure with no previous snapshot writes null counts and returns 200", async () => {
    // No previous snapshot
    mockSnapshotFindFirst.mockResolvedValue(null);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "ig-123", username: "test_user", profile_picture_url: "https://example.com/pic.jpg" }),
      })
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}) });
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(200);
    expect(mockSnapshotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ username: "test_user", followersCount: null, mediaCount: null }),
      })
    );
  });

  it("optional stats failure preserves previous followersCount and mediaCount from latest snapshot", async () => {
    mockSnapshotFindFirst.mockResolvedValue({ followersCount: 1200, mediaCount: 45, accountType: "BUSINESS" });
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "ig-123", username: "test_user", profile_picture_url: "https://example.com/pic.jpg" }),
      })
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}) });
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(200);
    expect(mockSnapshotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          followersCount: 1200,
          mediaCount: 45,
          accountType: "BUSINESS",
          source: "admin_refresh_partial",
        }),
      })
    );
  });

  it("optional stats null does not overwrite previous counts — fresh null values fall back to previous snapshot", async () => {
    mockSnapshotFindFirst.mockResolvedValue({ followersCount: 800, mediaCount: 30, accountType: null });
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "ig-123", username: "test_user", profile_picture_url: "https://example.com/pic.jpg" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        // Stats endpoint returns but without followers_count (omitted field, treated as undefined)
        json: async () => ({ id: "ig-123" }),
      });
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(200);
    expect(mockSnapshotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ followersCount: 800, mediaCount: 30 }),
      })
    );
  });

  it("returns partial-sync warning message when stats are preserved from previous snapshot", async () => {
    mockSnapshotFindFirst.mockResolvedValue({ followersCount: 500, mediaCount: 20, accountType: "BUSINESS" });
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "ig-123", username: "test_user", profile_picture_url: "https://example.com/pic.jpg" }),
      })
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}) });
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(200);
    expect(String(result.data).toLowerCase()).toContain("previous");
  });

  it("full success uses source admin_refresh (not partial) when stats fetch succeeds", async () => {
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(200);
    expect(mockSnapshotCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ source: "admin_refresh" }) })
    );
  });

  it("does not update integration status or reconnectRequired", async () => {
    await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    const updateCall = mockIntegrationsUpdate.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("status");
    expect(updateCall.data).not.toHaveProperty("reconnectRequired");
  });
});

// ---------------------------------------------------------------------------
describe("adminMarkReconnectRequiredAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireOwnerAdmin.mockResolvedValue(ADMIN);
    mockAuditCreate.mockResolvedValue({ id: "audit-1" });
    mockIntegrationsFindUnique.mockResolvedValue(integration());
    mockIntegrationsUpdate.mockResolvedValue({ id: "int-1", reconnectRequired: true });
  });

  it("rejects reason shorter than 5 characters", async () => {
    const result = await adminMarkReconnectRequiredAction(form({ integrationId: "int-1", reason: "shor" }));
    expect(result.status).toBe(400);
    expect(mockIntegrationsUpdate).not.toHaveBeenCalled();
  });

  it("blocks non-admin callers", async () => {
    mockRequireOwnerAdmin.mockRejectedValue(new Error("Unauthorized"));
    const result = await adminMarkReconnectRequiredAction(form({ integrationId: "int-1", reason: "Valid reason" }));
    expect(result.status).toBe(403);
    expect(mockIntegrationsUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when integration not found", async () => {
    mockIntegrationsFindUnique.mockResolvedValue(null);
    const result = await adminMarkReconnectRequiredAction(form({ integrationId: "none", reason: "Valid reason" }));
    expect(result.status).toBe(404);
  });

  it("returns 400 when already marked for reconnect", async () => {
    mockIntegrationsFindUnique.mockResolvedValue(integration({ reconnectRequired: true }));
    const result = await adminMarkReconnectRequiredAction(form({ integrationId: "int-1", reason: "Valid reason" }));
    expect(result.status).toBe(400);
    expect(String(result.data).toLowerCase()).toContain("already");
    expect(mockIntegrationsUpdate).not.toHaveBeenCalled();
  });

  it("sets reconnectRequired=true and writes SUCCESS audit log", async () => {
    const result = await adminMarkReconnectRequiredAction(form({ integrationId: "int-1", reason: "Token expired" }));
    expect(result.status).toBe(200);
    expect(mockIntegrationsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reconnectRequired: true }) })
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "ADMIN_MARK_RECONNECT_REQUIRED", status: "SUCCESS" }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
describe("adminSoftDisconnectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireOwnerAdmin.mockResolvedValue(ADMIN);
    mockAuditCreate.mockResolvedValue({ id: "audit-1" });
    mockIntegrationsFindUnique.mockResolvedValue(integration());
    mockIntegrationsUpdate.mockResolvedValue({ id: "int-1", status: "DISCONNECTED" });
  });

  it("rejects reason shorter than 5 characters", async () => {
    const result = await adminSoftDisconnectAction(form({ integrationId: "int-1", reason: "shor", confirmation: "DISCONNECT" }));
    expect(result.status).toBe(400);
    expect(mockIntegrationsUpdate).not.toHaveBeenCalled();
  });

  it("blocks non-admin callers", async () => {
    mockRequireOwnerAdmin.mockRejectedValue(new Error("Unauthorized"));
    const result = await adminSoftDisconnectAction(form({ integrationId: "int-1", reason: "Valid reason", confirmation: "DISCONNECT" }));
    expect(result.status).toBe(403);
  });

  it("returns 404 when integration not found", async () => {
    mockIntegrationsFindUnique.mockResolvedValue(null);
    const result = await adminSoftDisconnectAction(form({ integrationId: "none", reason: "Valid reason", confirmation: "DISCONNECT" }));
    expect(result.status).toBe(404);
  });

  it("returns 400 when already disconnected", async () => {
    mockIntegrationsFindUnique.mockResolvedValue(integration({ status: "DISCONNECTED" }));
    const result = await adminSoftDisconnectAction(form({ integrationId: "int-1", reason: "Valid reason", confirmation: "DISCONNECT" }));
    expect(result.status).toBe(400);
    expect(String(result.data).toLowerCase()).toContain("already");
    expect(mockIntegrationsUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when typed confirmation is wrong (case-sensitive)", async () => {
    const result = await adminSoftDisconnectAction(form({ integrationId: "int-1", reason: "Valid reason", confirmation: "disconnect" }));
    expect(result.status).toBe(400);
    expect(String(result.data)).toContain("DISCONNECT");
    expect(mockIntegrationsUpdate).not.toHaveBeenCalled();
  });

  it("sets status=DISCONNECTED on correct confirmation and writes SUCCESS audit log", async () => {
    const result = await adminSoftDisconnectAction(form({ integrationId: "int-1", reason: "Policy violation", confirmation: "DISCONNECT" }));
    expect(result.status).toBe(200);
    expect(mockIntegrationsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "DISCONNECTED",
          disconnectedAt: expect.any(Date),
          disconnectedReason: "Policy violation",
        }),
      })
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "ADMIN_SOFT_DISCONNECT_ACCOUNT", status: "SUCCESS" }),
      })
    );
  });

  it("does not touch Automation table (campaigns paused separately)", async () => {
    await adminSoftDisconnectAction(form({ integrationId: "int-1", reason: "Policy violation", confirmation: "DISCONNECT" }));
    expect(mockAutomationUpdateMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe("adminPauseCampaignsForAccountAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireOwnerAdmin.mockResolvedValue(ADMIN);
    mockAuditCreate.mockResolvedValue({ id: "audit-1" });
    mockIntegrationsFindUnique.mockResolvedValue(integration());
    mockAutomationUpdateMany.mockResolvedValue({ count: 3 });
    mockIntegrationsUpdate.mockResolvedValue({ id: "int-1" });
  });

  it("rejects reason shorter than 5 characters", async () => {
    const result = await adminPauseCampaignsForAccountAction(form({ integrationId: "int-1", reason: "shor" }));
    expect(result.status).toBe(400);
    expect(mockAutomationUpdateMany).not.toHaveBeenCalled();
  });

  it("blocks non-admin callers", async () => {
    mockRequireOwnerAdmin.mockRejectedValue(new Error("Unauthorized"));
    const result = await adminPauseCampaignsForAccountAction(form({ integrationId: "int-1", reason: "Valid reason", confirmation: "PAUSE" }));
    expect(result.status).toBe(403);
  });

  it("returns 400 when typed confirmation is wrong (case-sensitive)", async () => {
    const result = await adminPauseCampaignsForAccountAction(form({ integrationId: "int-1", reason: "Valid reason", confirmation: "pause" }));
    expect(result.status).toBe(400);
    expect(String(result.data)).toContain("PAUSE");
    expect(mockAutomationUpdateMany).not.toHaveBeenCalled();
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "ADMIN_PAUSE_ACCOUNT_CAMPAIGNS", status: "BLOCKED" }),
      })
    );
  });

  it("returns 404 when integration not found", async () => {
    mockIntegrationsFindUnique.mockResolvedValue(null);
    const result = await adminPauseCampaignsForAccountAction(form({ integrationId: "none", reason: "Valid reason", confirmation: "PAUSE" }));
    expect(result.status).toBe(404);
  });

  it("returns 400 when integration has no userId", async () => {
    mockIntegrationsFindUnique.mockResolvedValue(integration({ userId: null }));
    const result = await adminPauseCampaignsForAccountAction(form({ integrationId: "int-1", reason: "Valid reason", confirmation: "PAUSE" }));
    expect(result.status).toBe(400);
  });

  it("returns 400 when no active campaigns found", async () => {
    mockAutomationUpdateMany.mockResolvedValue({ count: 0 });
    const result = await adminPauseCampaignsForAccountAction(form({ integrationId: "int-1", reason: "Valid reason", confirmation: "PAUSE" }));
    expect(result.status).toBe(400);
    expect(String(result.data).toLowerCase()).toContain("no active");
  });

  it("pauses all active non-archived campaigns and writes SUCCESS audit log with count", async () => {
    const result = await adminPauseCampaignsForAccountAction(form({ integrationId: "int-1", reason: "Health review", confirmation: "PAUSE" }));
    expect(result.status).toBe(200);
    expect(mockAutomationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", active: true, archivedAt: null }),
        data: expect.objectContaining({ active: false, needsReview: true }),
      })
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "ADMIN_PAUSE_ACCOUNT_CAMPAIGNS",
          status: "SUCCESS",
          after: expect.objectContaining({ pausedCount: 3 }),
        }),
      })
    );
  });
});
