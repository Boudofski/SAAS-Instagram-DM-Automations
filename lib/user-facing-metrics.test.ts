import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWebhookEventFindMany = vi.fn();
const mockWebhookEventFindFirst = vi.fn();
const mockAutomationEventFindMany = vi.fn();
const mockAutomationEventFindFirst = vi.fn();
const mockMessageLogFindMany = vi.fn();
const mockMessageLogFindFirst = vi.fn();
const mockMessageLogCount = vi.fn();
const mockLeadCount = vi.fn();
const mockAutomationCount = vi.fn();
const mockIntegrationCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  client: {
    webhookEvent: {
      findMany: (...args: any[]) => mockWebhookEventFindMany(...args),
      findFirst: (...args: any[]) => mockWebhookEventFindFirst(...args),
    },
    automationEvent: {
      findMany: (...args: any[]) => mockAutomationEventFindMany(...args),
      findFirst: (...args: any[]) => mockAutomationEventFindFirst(...args),
    },
    messageLog: {
      findMany: (...args: any[]) => mockMessageLogFindMany(...args),
      findFirst: (...args: any[]) => mockMessageLogFindFirst(...args),
      count: (...args: any[]) => mockMessageLogCount(...args),
    },
    lead: { count: (...args: any[]) => mockLeadCount(...args) },
    automation: { count: (...args: any[]) => mockAutomationCount(...args) },
    integrations: { count: (...args: any[]) => mockIntegrationCount(...args) },
  },
}));

import { getUserFacingMetrics, getUserFacingStats } from "@/lib/user-facing-metrics";

beforeEach(() => {
  vi.clearAllMocks();
  mockWebhookEventFindMany.mockResolvedValue([]);
  mockWebhookEventFindFirst.mockResolvedValue(null);
  mockAutomationEventFindMany.mockResolvedValue([]);
  mockAutomationEventFindFirst.mockResolvedValue(null);
  mockMessageLogFindMany.mockResolvedValue([]);
  mockMessageLogFindFirst.mockResolvedValue(null);
  mockMessageLogCount.mockResolvedValue(0);
  mockLeadCount.mockResolvedValue(0);
  mockAutomationCount.mockResolvedValue(0);
  mockIntegrationCount.mockResolvedValue(0);
});

describe("user-facing metrics", () => {
  it("dedupes real comments by commentId and scopes to the current user", async () => {
    mockWebhookEventFindMany.mockResolvedValueOnce([
      { id: "w1", commentId: "c1" },
      { id: "w2", commentId: "c1" },
      { id: "w3", commentId: "c2" },
    ]);

    const metrics = await getUserFacingMetrics("user-1");

    expect(metrics.commentsReceived).toBe(2);
    expect(mockWebhookEventFindMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        automation: { userId: "user-1" },
        commentId: { not: null },
        eventType: { in: ["REAL_COMMENT_EVENT", "COMMENT_WEBHOOK_RECEIVED", "COMMENT_RECEIVED"] },
      }),
      select: { id: true, commentId: true },
    });
  });

  it("does not query skipped or loop guard events as user-facing comments", async () => {
    await getUserFacingMetrics("user-1");

    expect(mockWebhookEventFindMany).not.toHaveBeenCalledWith({
      where: expect.objectContaining({
        eventType: { in: ["SELF_COMMENT_SKIPPED", "DUPLICATE_SKIPPED", "LOOP_GUARD_TRIGGERED"] },
      }),
      select: expect.anything(),
    });
  });

  it("dedupes trigger matches by source comment", async () => {
    mockAutomationEventFindMany
      .mockResolvedValueOnce([
        { id: "m1", commentId: "c1", meta: null },
        { id: "m2", commentId: "c1", meta: null },
        { id: "m3", commentId: null, meta: { sourceCommentId: "c2" } },
      ])
      .mockResolvedValueOnce([]);

    const metrics = await getUserFacingMetrics("user-1");

    expect(metrics.commentsMatched).toBe(2);
  });

  it("counts public replies only from sent logs or confirmed event reply IDs", async () => {
    mockMessageLogFindMany.mockResolvedValueOnce([]);
    mockAutomationEventFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "r1", commentId: "source-1", meta: { publicReplyCommentId: "reply-1" } },
        { id: "r2", commentId: "source-2", meta: {} },
      ]);

    const metrics = await getUserFacingMetrics("user-1");

    expect(metrics.publicRepliesSent).toBe(1);
  });

  it("counts DMs out only from MessageLog DM SENT", async () => {
    mockMessageLogCount.mockResolvedValueOnce(4);

    const metrics = await getUserFacingMetrics("user-1");

    expect(metrics.dmsSent).toBe(4);
    expect(mockMessageLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({ messageType: "DM", status: "SENT" }),
    });
  });

  it("uses public replies plus sent DMs for static reply usage", async () => {
    mockMessageLogFindMany.mockResolvedValueOnce([{ id: "p1", commentId: "reply-1" }]);
    mockMessageLogCount.mockResolvedValueOnce(2);

    const metrics = await getUserFacingMetrics("user-1");

    expect(metrics.staticRepliesUsed).toBe(3);
  });

  it("uses confirmed public replies over matched comments for reply rate", async () => {
    mockAutomationEventFindMany.mockResolvedValueOnce([
      { id: "m1", commentId: "c1", meta: null },
      { id: "m2", commentId: "c2", meta: null },
    ]);
    mockMessageLogFindMany.mockResolvedValueOnce([{ id: "p1", commentId: "reply-1" }]);

    const metrics = await getUserFacingMetrics("user-1");

    expect(metrics.replyRate).toBe(50);
  });

  it("uses the same selected period for current and previous stats", async () => {
    await getUserFacingStats("user-1", "7d", new Date("2026-05-24T12:00:00Z"));

    expect(mockWebhookEventFindMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        createdAt: {
          gte: new Date("2026-05-17T12:00:00Z"),
          lt: new Date("2026-05-24T12:00:00Z"),
        },
      }),
      select: { id: true, commentId: true },
    });
  });
});
