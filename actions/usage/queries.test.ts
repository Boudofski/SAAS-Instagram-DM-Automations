import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindUnique = vi.fn();
const mockMessageLogCount = vi.fn();
const mockAutomationCount = vi.fn();
const mockIntegrationCount = vi.fn();
const mockAutomationFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  client: {
    user: { findUnique: (...args: any[]) => mockUserFindUnique(...args) },
    messageLog: { count: (...args: any[]) => mockMessageLogCount(...args) },
    automation: {
      count: (...args: any[]) => mockAutomationCount(...args),
      findFirst: (...args: any[]) => mockAutomationFindFirst(...args),
    },
    integrations: { count: (...args: any[]) => mockIntegrationCount(...args) },
  },
}));

import {
  canActivateCampaign,
  canSendStaticReply,
  getUserMonthlyUsage,
} from "@/actions/usage/queries";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mockUserFindUnique.mockResolvedValue({ subscription: { plan: "FREE" } });
  mockMessageLogCount.mockResolvedValue(0);
  mockAutomationCount.mockResolvedValue(0);
  mockIntegrationCount.mockResolvedValue(0);
  mockAutomationFindFirst.mockResolvedValue(null);
});

describe("usage query helpers", () => {
  it("counts sent comment replies and DMs as static monthly replies", async () => {
    mockMessageLogCount.mockResolvedValue(7);

    const usage = await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(usage.staticReplies.used).toBe(7);
    expect(mockMessageLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: "SENT",
        messageType: { in: ["COMMENT_REPLY", "DM"] },
        automation: { userId: "user-1" },
      }),
    });
  });

  it("does not count failed or skipped messages", async () => {
    await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(mockMessageLogCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ status: { in: ["FAILED", "SKIPPED"] } }),
      })
    );
  });

  it("respects the current usage period and enforcement start", async () => {
    vi.stubEnv("USAGE_LIMITS_ENFORCED_FROM", "2026-05-23T00:00:00Z");

    await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(mockMessageLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        createdAt: {
          gte: new Date("2026-05-23T00:00:00Z"),
          lt: new Date("2026-06-01T00:00:00Z"),
        },
      }),
    });
  });

  it("blocks static replies when the monthly limit is reached", async () => {
    mockMessageLogCount.mockResolvedValue(50);

    const result = await canSendStaticReply("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("static_reply_limit_reached");
  });

  it("blocks a second active campaign on Free", async () => {
    mockAutomationCount.mockResolvedValue(1);

    const result = await canActivateCampaign("user-1");

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("active_campaign_limit_reached");
  });

  it("allows saving an already-active campaign on Free", async () => {
    mockAutomationCount.mockResolvedValue(1);
    mockAutomationFindFirst.mockResolvedValue({ id: "automation-1" });

    const result = await canActivateCampaign("user-1", "automation-1");

    expect(result.ok).toBe(true);
  });

  it("allows Creator active campaigns", async () => {
    mockUserFindUnique.mockResolvedValue({ subscription: { plan: "PRO" } });
    mockAutomationCount.mockResolvedValue(12);

    const result = await canActivateCampaign("user-1");

    expect(result.ok).toBe(true);
  });
});
