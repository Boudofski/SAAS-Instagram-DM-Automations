import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWebhookEventCount = vi.fn();
const mockWebhookEventFindFirst = vi.fn();
const mockAutomationEventCount = vi.fn();
const mockAutomationEventFindFirst = vi.fn();
const mockAutomationEventGroupBy = vi.fn();
const mockMessageLogCount = vi.fn();
const mockMessageLogFindFirst = vi.fn();
const mockLeadCount = vi.fn();
const mockLeadGroupBy = vi.fn();
const mockAutomationCount = vi.fn();
const mockIntegrationCount = vi.fn();
const mockIntegrationFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  client: {
    webhookEvent: {
      count: (...args: any[]) => mockWebhookEventCount(...args),
      findFirst: (...args: any[]) => mockWebhookEventFindFirst(...args),
    },
    automationEvent: {
      count: (...args: any[]) => mockAutomationEventCount(...args),
      findFirst: (...args: any[]) => mockAutomationEventFindFirst(...args),
      groupBy: (...args: any[]) => mockAutomationEventGroupBy(...args),
    },
    messageLog: {
      count: (...args: any[]) => mockMessageLogCount(...args),
      findFirst: (...args: any[]) => mockMessageLogFindFirst(...args),
    },
    lead: {
      count: (...args: any[]) => mockLeadCount(...args),
      groupBy: (...args: any[]) => mockLeadGroupBy(...args),
    },
    automation: { count: (...args: any[]) => mockAutomationCount(...args) },
    integrations: {
      count: (...args: any[]) => mockIntegrationCount(...args),
      findFirst: (...args: any[]) => mockIntegrationFindFirst(...args),
    },
  },
}));

import {
  formatReplyRate,
  getCampaignTableMetrics,
  getDashboardGreeting,
  getIntegrationHealth,
  getUserDashboardMetrics,
} from "@/lib/dashboard-metrics";

beforeEach(() => {
  vi.clearAllMocks();
  mockWebhookEventCount.mockResolvedValue(0);
  mockWebhookEventFindFirst.mockResolvedValue(null);
  mockAutomationEventCount.mockResolvedValue(0);
  mockAutomationEventFindFirst.mockResolvedValue(null);
  mockAutomationEventGroupBy.mockResolvedValue([]);
  mockMessageLogCount.mockResolvedValue(0);
  mockMessageLogFindFirst.mockResolvedValue(null);
  mockLeadCount.mockResolvedValue(0);
  mockLeadGroupBy.mockResolvedValue([]);
  mockAutomationCount.mockResolvedValue(0);
  mockIntegrationCount.mockResolvedValue(0);
  mockIntegrationFindFirst.mockResolvedValue(null);
});

describe("dashboard metrics", () => {
  it("counts KEYWORD_MATCHED as comments matched", async () => {
    mockAutomationEventCount.mockResolvedValueOnce(9);

    const metrics = await getUserDashboardMetrics("user-1");

    expect(metrics.commentsMatched).toBe(9);
    expect(mockAutomationEventCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        eventType: { in: ["KEYWORD_MATCHED"] },
        automation: { userId: "user-1" },
      }),
    });
  });

  it("does not count SELF_COMMENT_SKIPPED as matched", async () => {
    await getUserDashboardMetrics("user-1");

    expect(mockAutomationEventCount).not.toHaveBeenCalledWith({
      where: expect.objectContaining({ eventType: "SELF_COMMENT_SKIPPED" }),
    });
  });

  it("counts sent public replies and DMs from MessageLog", async () => {
    mockAutomationEventCount.mockResolvedValueOnce(4).mockResolvedValueOnce(10).mockResolvedValueOnce(0);
    mockMessageLogCount
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);

    const metrics = await getUserDashboardMetrics("user-1");

    expect(metrics.publicRepliesSent).toBe(6);
    expect(metrics.dmsSent).toBe(2);
    expect(metrics.dmsFailed).toBe(1);
    expect(metrics.dmsSkipped).toBe(3);
    expect(metrics.staticRepliesUsed).toBe(8);
  });

  it("uses Lead table for captured leads", async () => {
    mockLeadCount.mockResolvedValue(5);

    const metrics = await getUserDashboardMetrics("user-1");

    expect(metrics.leadsCaptured).toBe(5);
    expect(mockLeadCount).toHaveBeenCalledWith({
      where: expect.objectContaining({ automation: { userId: "user-1" } }),
    });
  });

  it("uses automation-specific KEYWORD_MATCHED and Lead counts for campaign rows", async () => {
    mockAutomationEventGroupBy.mockResolvedValue([{ automationId: "a1", _count: { _all: 7 } }]);
    mockLeadGroupBy.mockResolvedValue([{ automationId: "a1", _count: { _all: 2 } }]);

    const metrics = await getCampaignTableMetrics("user-1");

    expect(metrics.a1).toEqual({ automationId: "a1", runs: 7, leads: 2 });
  });

  it("shows integration active when a recent real comment exists", async () => {
    const createdAt = new Date("2026-05-23T12:00:00Z");
    mockIntegrationFindFirst.mockResolvedValue({ pageId: "page-1", instagramId: "ig-1", webhookAccountId: null });
    mockWebhookEventFindFirst.mockResolvedValue({ eventType: "REAL_COMMENT_EVENT", status: "PROCESSED", createdAt });

    const health = await getIntegrationHealth("user-1");

    expect(health.commentDeliveryActive).toBe(true);
    expect(health.lastRealComment?.createdAt).toBe(createdAt);
  });

  it("formats reply rate without NaN and clamps above 100", () => {
    expect(formatReplyRate(0, 4)).toBe(0);
    expect(formatReplyRate(4, 10)).toBe(100);
    expect(formatReplyRate(4, 2)).toBe(50);
  });

  it("does not return a raw Clerk ID when a name or email exists", () => {
    expect(getDashboardGreeting({ firstname: "Abdelkhalek", clerkId: "user_123" })).toBe("Abdelkhalek");
    expect(getDashboardGreeting({ email: "creator@example.com", clerkId: "user_123" })).toBe("creator");
    expect(getDashboardGreeting({ clerkId: "user_123" })).toBe("there");
  });
});
