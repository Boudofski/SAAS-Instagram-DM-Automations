import { beforeEach, describe, expect, it, vi } from "vitest";
import { createIntegration, softDisconnectIntegrationForUser } from "./queries";
import { client } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  client: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    integrations: {
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    automation: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockClient = client as any;

describe("softDisconnectIntegrationForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.$transaction.mockImplementation(async (operations: any[]) => {
      return Promise.all(operations);
    });
    mockClient.integrations.update.mockResolvedValue({ id: "current-integration" });
    mockClient.integrations.findUnique.mockResolvedValue(null);
    mockClient.automation.updateMany.mockResolvedValue({ count: 2 });
    mockClient.user.update = vi.fn().mockResolvedValue({
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
    });
  });

  it("soft-disconnects only the current user's canonical Instagram integration and preserves history", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      integrations: [
        {
          id: "stale-disconnected",
          name: "INSTAGRAM",
          instagramId: "ig-old",
          pageId: "page-old",
          status: "DISCONNECTED",
          reconnectRequired: false,
          token: "old-token",
        },
        {
          id: "current-integration",
          name: "INSTAGRAM",
          instagramId: "ig-current",
          pageId: "page-current",
          status: "CONNECTED",
          reconnectRequired: false,
          token: "current-token",
        },
        {
          id: "other-provider",
          name: "STRIPE",
          instagramId: "ig-other",
          pageId: "page-other",
          status: "CONNECTED",
          reconnectRequired: false,
          token: "other-token",
        },
      ],
    });

    const result = await softDisconnectIntegrationForUser("clerk-user-1");

    expect(result).toEqual({ id: "current-integration", pausedCampaigns: 2 });
    expect(mockClient.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { clerkId: "clerk-user-1" },
    }));
    expect(mockClient.integrations.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "current-integration" },
      data: expect.objectContaining({
        status: "DISCONNECTED",
        disconnectedReason: "User disconnected Instagram from AP3k",
      }),
    }));
    expect(mockClient.automation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-1", archivedAt: null, active: true },
      data: expect.objectContaining({
        active: false,
        needsReview: true,
      }),
    }));
    expect(mockClient.integrations.delete).not.toHaveBeenCalled();
  });

  it("does not disconnect stale rows when no canonical connected integration exists", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      integrations: [
        {
          id: "soft-disconnected",
          name: "INSTAGRAM",
          instagramId: "ig-old",
          pageId: "page-old",
          status: "DISCONNECTED",
          reconnectRequired: false,
          token: "old-token",
        },
        {
          id: "missing-token",
          name: "INSTAGRAM",
          instagramId: "ig-current",
          pageId: "page-current",
          status: "CONNECTED",
          reconnectRequired: false,
          token: null,
        },
      ],
    });

    await expect(softDisconnectIntegrationForUser("clerk-user-1")).resolves.toBeNull();
    expect(mockClient.integrations.update).not.toHaveBeenCalled();
    expect(mockClient.automation.updateMany).not.toHaveBeenCalled();
  });

  it("reclaims a soft-disconnected same-workspace Instagram row on reconnect", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
      subscription: { plan: "FREE" },
      integrations: [
        {
          id: "soft-disconnected",
          name: "INSTAGRAM",
          userId: "user-1",
          instagramId: "ig-1",
          status: "DISCONNECTED",
          reconnectRequired: false,
          token: "old-token",
        },
      ],
    });
    mockClient.integrations.update.mockResolvedValue({ id: "soft-disconnected" });

    await expect(createIntegration("clerk-user-1", "x".repeat(24), new Date("2026-01-01"), "ig-1")).resolves.toMatchObject({
      integrationId: "soft-disconnected",
    });

    expect(mockClient.integrations.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "soft-disconnected" },
      data: expect.objectContaining({
        status: "CONNECTED",
        disconnectedAt: null,
        reconnectRequired: false,
      }),
    }));
    expect(mockClient.user.update).not.toHaveBeenCalled();
  });

  it("updates a same-workspace current Instagram row on reconnect", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
      subscription: { plan: "FREE" },
      integrations: [
        {
          id: "current",
          name: "INSTAGRAM",
          userId: "user-1",
          instagramId: "ig-1",
          status: "CONNECTED",
          reconnectRequired: false,
          token: "old-token",
        },
      ],
    });
    mockClient.integrations.update.mockResolvedValue({ id: "current" });

    await expect(createIntegration("clerk-user-1", "x".repeat(24), new Date("2026-01-01"), "ig-1")).resolves.toMatchObject({
      integrationId: "current",
    });
    expect(mockClient.user.update).not.toHaveBeenCalled();
  });

  it("blocks duplicate active Instagram accounts in another workspace", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
      subscription: { plan: "FREE" },
      integrations: [],
    });
    mockClient.integrations.findUnique.mockResolvedValue({
      id: "other",
      userId: "user-2",
      status: "CONNECTED",
      reconnectRequired: false,
      disconnectedAt: null,
    });

    await expect(createIntegration("clerk-user-1", "x".repeat(24), new Date("2026-01-01"), "ig-1")).rejects.toMatchObject({
      code: "DUPLICATE_INSTAGRAM_ACCOUNT",
    });
    expect(mockClient.user.update).not.toHaveBeenCalled();
  });

  it("blocks plan limit before creating another Instagram connection", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
      subscription: { plan: "FREE" },
      integrations: [
        {
          id: "current",
          name: "INSTAGRAM",
          userId: "user-1",
          instagramId: "ig-current",
          status: "CONNECTED",
          reconnectRequired: false,
          token: "old-token",
        },
      ],
    });

    await expect(createIntegration("clerk-user-1", "x".repeat(24), new Date("2026-01-01"), "ig-new")).rejects.toMatchObject({
      code: "PLAN_LIMIT_REACHED",
    });
    expect(mockClient.user.update).not.toHaveBeenCalled();
  });

  it("reclaims same-workspace row by businessId when instagramId is null", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
      subscription: { plan: "FREE" },
      integrations: [
        {
          id: "existing-row",
          name: "INSTAGRAM",
          userId: "user-1",
          instagramId: null,
          businessId: "biz-1",
          pageId: "page-1",
          instagramUsername: "myaccount",
          status: "CONNECTED",
          reconnectRequired: false,
          token: "old-token",
        },
      ],
    });
    mockClient.integrations.update.mockResolvedValue({ id: "existing-row" });

    // instagramId "ig-new" does not match null, but businessId "biz-1" does
    await expect(
      createIntegration("clerk-user-1", "x".repeat(24), new Date("2026-01-01"), "ig-new", undefined, undefined, undefined, undefined, "biz-1")
    ).resolves.toMatchObject({ integrationId: "existing-row" });

    expect(mockClient.integrations.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "existing-row" },
      data: expect.objectContaining({ status: "CONNECTED" }),
    }));
    expect(mockClient.user.update).not.toHaveBeenCalled();
  });

  it("reclaims same-workspace row by pageId when instagramId and businessId are null", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
      subscription: { plan: "FREE" },
      integrations: [
        {
          id: "existing-row",
          name: "INSTAGRAM",
          userId: "user-1",
          instagramId: null,
          businessId: null,
          pageId: "page-1",
          instagramUsername: "myaccount",
          status: "CONNECTED",
          reconnectRequired: false,
          token: "old-token",
        },
      ],
    });
    mockClient.integrations.update.mockResolvedValue({ id: "existing-row" });

    await expect(
      createIntegration("clerk-user-1", "x".repeat(24), new Date("2026-01-01"), "ig-new", undefined, undefined, "page-1")
    ).resolves.toMatchObject({ integrationId: "existing-row" });

    expect(mockClient.integrations.update).toHaveBeenCalled();
    expect(mockClient.user.update).not.toHaveBeenCalled();
  });

  it("reclaims same-workspace row by username (case-insensitive) as final fallback", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
      subscription: { plan: "FREE" },
      integrations: [
        {
          id: "existing-row",
          name: "INSTAGRAM",
          userId: "user-1",
          instagramId: null,
          businessId: null,
          pageId: null,
          instagramUsername: "MyAccount",
          status: "CONNECTED",
          reconnectRequired: false,
          token: "old-token",
        },
      ],
    });
    mockClient.integrations.update.mockResolvedValue({ id: "existing-row" });

    // Username "myaccount" (lowercase) should match "MyAccount" stored in DB
    await expect(
      createIntegration("clerk-user-1", "x".repeat(24), new Date("2026-01-01"), "ig-new", "myaccount")
    ).resolves.toMatchObject({ integrationId: "existing-row" });

    expect(mockClient.integrations.update).toHaveBeenCalled();
    expect(mockClient.user.update).not.toHaveBeenCalled();
  });

  it("classifies generic create failures as database save failures", async () => {
    mockClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      firstname: "A",
      lastname: "User",
      clerkId: "clerk-user-1",
      subscription: { plan: "FREE" },
      integrations: [],
    });
    mockClient.user.update.mockRejectedValue(new Error("database down"));

    await expect(createIntegration("clerk-user-1", "x".repeat(24), new Date("2026-01-01"), "ig-1")).rejects.toMatchObject({
      code: "DATABASE_SAVE_FAILED",
    });
  });
});
