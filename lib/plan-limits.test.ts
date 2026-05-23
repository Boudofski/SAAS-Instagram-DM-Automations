import { describe, expect, it, vi } from "vitest";
import {
  getCurrentUsagePeriod,
  getPlanLimits,
  getUsagePercent,
  isUnlimited,
  makeUsageMetric,
  usageTone,
} from "@/lib/plan-limits";

describe("plan limits", () => {
  it("defines the Free limits", () => {
    expect(getPlanLimits("FREE")).toMatchObject({
      activeCampaigns: 1,
      staticRepliesPerMonth: 50,
      aiRepliesPerMonth: 0,
      connectedInstagramAccounts: 1,
      exportLeads: false,
    });
  });

  it("maps PRO to Creator limits", () => {
    expect(getPlanLimits("PRO")).toMatchObject({
      label: "Creator",
      activeCampaigns: "unlimited",
      staticRepliesPerMonth: 5000,
      aiRepliesPerMonth: 750,
      exportLeads: true,
    });
  });

  it("defines Agency limits without making it a DB subscription plan", () => {
    expect(getPlanLimits("AGENCY")).toMatchObject({
      label: "Agency",
      staticRepliesPerMonth: 20000,
      aiRepliesPerMonth: 5000,
      connectedInstagramAccounts: 10,
    });
  });

  it("calculates usage percent and unlimited usage", () => {
    expect(getUsagePercent(35, 50)).toBe(70);
    expect(getUsagePercent(9000, "unlimited")).toBe(0);
    expect(isUnlimited("unlimited")).toBe(true);
    expect(makeUsageMetric(50, 50)).toMatchObject({ remaining: 0, percent: 100, blocked: true });
  });

  it("classifies near and over-limit usage status", () => {
    expect(usageTone(50, false)).toBe("green");
    expect(usageTone(70, false)).toBe("amber");
    expect(usageTone(100, true)).toBe("red");
  });

  it("uses max(month start, USAGE_LIMITS_ENFORCED_FROM)", () => {
    vi.stubEnv("USAGE_LIMITS_ENFORCED_FROM", "2026-05-23T00:00:00.000Z");

    const period = getCurrentUsagePeriod(new Date("2026-05-24T12:00:00.000Z"));

    expect(period.monthStart.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(period.enforcementStart.toISOString()).toBe("2026-05-23T00:00:00.000Z");
    expect(period.periodLabel).toBe("May 2026");

    vi.unstubAllEnvs();
  });
});
