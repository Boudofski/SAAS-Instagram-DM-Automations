import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireOwnerAdmin = vi.fn();
const mockAuditCreate = vi.fn();
const mockIntegrationsFindUnique = vi.fn();
const mockIntegrationsUpdate = vi.fn();
const mockSnapshotCreate = vi.fn();
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

  it("calls Meta Graph API with instagramId in URL, token in Authorization header (not URL), and writes snapshot", async () => {
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(200);
    const [fetchUrl, fetchOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchUrl).toContain("ig-123");
    expect(fetchUrl).not.toContain("EAA_test_token"); // token must NOT appear in URL
    expect((fetchOptions?.headers as Record<string, string>)?.Authorization).toMatch(/^Bearer /);
    expect(mockSnapshotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ integrationId: "int-1", source: "admin_refresh", followersCount: 500 }),
      })
    );
  });

  it("audit log before/after does not contain the token", async () => {
    await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    const callArg = mockAuditCreate.mock.calls[0][0];
    const serialized = JSON.stringify(callArg);
    expect(serialized).not.toContain("EAA_test_token");
  });

  it("returns 500 when Meta API returns non-ok status", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400 });
    const result = await adminRefreshProfileSnapshotAction(form({ integrationId: "int-1", reason: "Refreshing data" }));
    expect(result.status).toBe(500);
    expect(mockSnapshotCreate).not.toHaveBeenCalled();
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
