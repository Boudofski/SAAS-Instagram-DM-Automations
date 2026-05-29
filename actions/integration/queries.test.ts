import { beforeEach, describe, expect, it, vi } from "vitest";
import { softDisconnectIntegrationForUser } from "./queries";
import { client } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  client: {
    user: {
      findUnique: vi.fn(),
    },
    integrations: {
      update: vi.fn(),
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
    mockClient.automation.updateMany.mockResolvedValue({ count: 2 });
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
});
