import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindUnique = vi.fn();
const mockMessageLogCount = vi.fn();
const mockAutomationEventCount = vi.fn();
const mockAutomationCount = vi.fn();
const mockIntegrationCount = vi.fn();
const mockAutomationFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  client: {
    user: { findUnique: (...args: any[]) => mockUserFindUnique(...args) },
    messageLog: { count: (...args: any[]) => mockMessageLogCount(...args) },
    automationEvent: { count: (...args: any[]) => mockAutomationEventCount(...args) },
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
  mockAutomationEventCount.mockResolvedValue(0);
  mockAutomationCount.mockResolvedValue(0);
  mockIntegrationCount.mockResolvedValue(0);
  mockAutomationFindFirst.mockResolvedValue(null);
});

describe("usage query helpers", () => {
  it("counts sent comment replies and DMs as static monthly replies", async () => {
    mockMessageLogCount.mockResolvedValueOnce(4).mockResolvedValueOnce(3);

    const usage = await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(usage.staticReplies.used).toBe(7);
    expect(mockMessageLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: "SENT",
        messageType: "COMMENT_REPLY",
        automation: { userId: "user-1" },
      }),
    });
    expect(mockMessageLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: "SENT",
        messageType: "DM",
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
    mockMessageLogCount.mockResolvedValueOnce(50).mockResolvedValueOnce(0);

    const result = await canSendStaticReply("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("static_reply_limit_reached");
  });

  it("uses the one-time 500-reply window during an active launch trial", async () => {
    const startsAt = new Date("2026-05-20T12:00:00Z");
    const endsAt = new Date("2026-06-03T12:00:00Z");
    mockUserFindUnique.mockResolvedValue({
      subscription: {
        plan: "FREE",
        welcomeTrialStartedAt: startsAt,
        welcomeTrialEndsAt: endsAt,
        welcomeTrialReplyLimit: 500,
      },
    });
    mockMessageLogCount.mockResolvedValueOnce(300).mockResolvedValueOnce(120);

    const usage = await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(usage.staticReplies).toMatchObject({ used: 420, limit: 500, remaining: 80, blocked: false });
    expect(usage.periodStart).toEqual(startsAt);
    expect(usage.periodEnd).toEqual(endsAt);
    expect(usage.periodLabel).toBe("14-day launch trial");
    expect(usage.welcomeTrial).toMatchObject({ active: true, replyLimit: 500 });
  });

  it("starts the normal Free allowance fresh after the launch trial ends", async () => {
    const endsAt = new Date("2026-05-20T12:00:00Z");
    mockUserFindUnique.mockResolvedValue({
      subscription: {
        plan: "FREE",
        welcomeTrialStartedAt: new Date("2026-05-06T12:00:00Z"),
        welcomeTrialEndsAt: endsAt,
        welcomeTrialReplyLimit: 500,
      },
    });

    const usage = await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(usage.staticReplies.limit).toBe(50);
    expect(usage.periodStart).toEqual(endsAt);
    expect(usage.welcomeTrial?.active).toBe(false);
    expect(mockMessageLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        createdAt: { gte: endsAt, lt: new Date("2026-06-01T00:00:00Z") },
      }),
    });
  });

  it("does not reset the 500-reply trial when it crosses a month boundary", async () => {
    const startsAt = new Date("2026-08-25T12:00:00Z");
    const endsAt = new Date("2026-09-08T12:00:00Z");
    mockUserFindUnique.mockResolvedValue({
      subscription: {
        plan: "FREE",
        welcomeTrialStartedAt: startsAt,
        welcomeTrialEndsAt: endsAt,
        welcomeTrialReplyLimit: 500,
      },
    });

    const usage = await getUserMonthlyUsage("user-1", new Date("2026-09-02T12:00:00Z"));

    expect(usage.periodStart).toEqual(startsAt);
    expect(usage.periodEnd).toEqual(endsAt);
    expect(mockMessageLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        createdAt: { gte: startsAt, lt: endsAt },
      }),
    });
  });

  it("falls back to sent automation events when message logs are missing", async () => {
    mockMessageLogCount.mockResolvedValue(0);
    mockAutomationEventCount.mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    const usage = await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(usage.staticReplies.used).toBe(5);
    expect(mockAutomationEventCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        eventType: "PUBLIC_REPLY_SENT",
        automation: { userId: "user-1" },
      }),
    });
    expect(mockAutomationEventCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        eventType: "DM_SENT",
        automation: { userId: "user-1" },
      }),
    });
  });

  it("allows unlimited active campaigns on Free", async () => {
    mockAutomationCount.mockResolvedValue(1);

    const result = await canActivateCampaign("user-1");

    expect(result.ok).toBe(true);
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

  it.each(["true", "false"])(
    "keeps the shared Creator campaign limit in App Review mode=%s",
    async (appReviewMode) => {
      vi.stubEnv("NEXT_PUBLIC_APP_REVIEW_MODE", appReviewMode);
      mockUserFindUnique.mockResolvedValue({ subscription: { plan: "PRO" } });
      mockAutomationCount.mockResolvedValue(12);

      const usage = await getUserMonthlyUsage("user-1");

      expect(usage.activeCampaigns).toMatchObject({
        used: 12,
        limit: "unlimited",
        remaining: null,
        blocked: false,
      });
    }
  );

  it("respects usageResetAt if it is after enforcementStart", async () => {
    vi.stubEnv("USAGE_LIMITS_ENFORCED_FROM", "2026-05-23T00:00:00Z");
    const resetAt = new Date("2026-05-24T00:00:00Z");
    mockUserFindUnique.mockResolvedValue({
      subscription: { plan: "FREE", usageResetAt: resetAt },
    });

    await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(mockMessageLogCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: resetAt,
            lt: new Date("2026-06-01T00:00:00Z"),
          },
        }),
      })
    );
  });

  it("keeps published plan limits authoritative over legacy internal overrides", async () => {
    mockUserFindUnique.mockResolvedValue({
      subscription: {
        plan: "FREE",
        monthlyReplyLimitOverride: 500,
        activeCampaignLimitOverride: 10,
        connectedAccountLimitOverride: 5,
        overrideReason: "Test",
        overrideExpiresAt: null,
      },
    });

    const usage = await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(usage.staticReplies.limit).toBe(50);
    expect(usage.activeCampaigns.limit).toBe("unlimited");
    expect(usage.connectedAccounts.limit).toBe(1);
  });

  it("ignores expired billing overrides", async () => {
    mockUserFindUnique.mockResolvedValue({
      subscription: {
        plan: "FREE",
        monthlyReplyLimitOverride: 500,
        overrideReason: "Test",
        overrideExpiresAt: new Date("2026-05-20T00:00:00Z"), // Expired
      },
    });

    const usage = await getUserMonthlyUsage("user-1", new Date("2026-05-24T12:00:00Z"));

    expect(usage.staticReplies.limit).toBe(50); // Plan default
  });
});
