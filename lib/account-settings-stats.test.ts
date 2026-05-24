import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIntegrationFindFirst = vi.fn();
const mockWebhookEventCount = vi.fn();
const mockAutomationEventCount = vi.fn();
const mockMessageLogCount = vi.fn();
const mockLeadCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  client: {
    integrations: { findFirst: (...args: any[]) => mockIntegrationFindFirst(...args) },
    webhookEvent: { count: (...args: any[]) => mockWebhookEventCount(...args) },
    automationEvent: { count: (...args: any[]) => mockAutomationEventCount(...args) },
    messageLog: { count: (...args: any[]) => mockMessageLogCount(...args) },
    lead: { count: (...args: any[]) => mockLeadCount(...args) },
  },
}));

import { getInstagramAccountSettingsStats } from "@/lib/account-settings-stats";

beforeEach(() => {
  vi.clearAllMocks();
  mockIntegrationFindFirst.mockResolvedValue({ pageId: "page-1", instagramId: "ig-1", webhookAccountId: "hook-1" });
  mockWebhookEventCount.mockResolvedValue(0);
  mockAutomationEventCount.mockResolvedValue(0);
  mockMessageLogCount.mockResolvedValue(0);
  mockLeadCount.mockResolvedValue(0);
});

describe("instagram account settings stats", () => {
  it("counts comments for the current user and selected integration only", async () => {
    mockWebhookEventCount.mockResolvedValueOnce(12);

    const stats = await getInstagramAccountSettingsStats("user-a", "integration-a");

    expect(stats.comments.value).toBe(12);
    expect(mockIntegrationFindFirst).toHaveBeenCalledWith({
      where: { id: "integration-a", userId: "user-a" },
      select: { pageId: true, instagramId: true, webhookAccountId: true },
    });
    expect(mockWebhookEventCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        eventType: { in: ["REAL_COMMENT_EVENT", "COMMENT_WEBHOOK_RECEIVED"] },
        OR: [{ igAccountId: { in: ["page-1", "ig-1", "hook-1"] } }, { automation: { userId: "user-a" } }],
      }),
    });
  });

  it("counts contacts for the current user only", async () => {
    mockLeadCount.mockResolvedValueOnce(7);

    const stats = await getInstagramAccountSettingsStats("user-a");

    expect(stats.contacts.value).toBe(7);
    expect(mockLeadCount).toHaveBeenCalledWith({
      where: expect.objectContaining({ automation: { userId: "user-a" } }),
    });
  });

  it("counts DMs out from MessageLog DM SENT only", async () => {
    mockMessageLogCount.mockResolvedValueOnce(0).mockResolvedValueOnce(3);

    const stats = await getInstagramAccountSettingsStats("user-a");

    expect(stats.dmsOut.value).toBe(3);
    expect(mockMessageLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        automation: { userId: "user-a" },
        messageType: "DM",
        status: "SENT",
      }),
    });
  });

  it("does not count failed or skipped DMs as sent", async () => {
    await getInstagramAccountSettingsStats("user-a");

    expect(mockMessageLogCount).not.toHaveBeenCalledWith({
      where: expect.objectContaining({ messageType: "DM", status: { in: ["FAILED", "SKIPPED"] } }),
    });
  });

  it("formats reply rate from sent replies over matched comments", async () => {
    mockAutomationEventCount.mockResolvedValueOnce(10).mockResolvedValueOnce(0);
    mockMessageLogCount.mockResolvedValueOnce(4).mockResolvedValueOnce(1);

    const stats = await getInstagramAccountSettingsStats("user-a");

    expect(stats.replyRate.value).toBe("50%");
  });

  it("returns intentional unavailable states for unsupported data sources", async () => {
    const stats = await getInstagramAccountSettingsStats("user-a");

    expect(stats.followers).toEqual({ value: "Not enabled", enabled: false, subtitle: "Follower snapshots coming soon" });
    expect(stats.posts).toEqual({ value: "Not enabled", enabled: false, subtitle: "Media sync coming soon" });
    expect(stats.removed).toEqual({ value: "Not enabled", enabled: false, subtitle: "Moderation not enabled" });
    expect(stats.dmsIn).toEqual({ value: "Not enabled", enabled: false, subtitle: "DM inbox pending approval" });
  });
});
