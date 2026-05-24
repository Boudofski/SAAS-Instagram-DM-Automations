import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUserFacingMetrics = vi.fn();

vi.mock("@/lib/user-facing-metrics", () => ({
  getUserFacingMetrics: (...args: any[]) => mockGetUserFacingMetrics(...args),
}));

import { getInstagramAccountSettingsStats } from "@/lib/account-settings-stats";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserFacingMetrics.mockResolvedValue({
    commentsReceived: 22,
    commentsMatched: 12,
    publicRepliesSent: 9,
    dmsSent: 0,
    dmsFailed: 0,
    dmsSkipped: 0,
    leadsCaptured: 3,
    replyRate: 75,
    staticRepliesUsed: 9,
    aiRepliesUsed: 0,
    activeCampaigns: 1,
    connectedAccounts: 1,
    lastRealCommentAt: null,
    lastPublicReplyAt: null,
    lastDmAt: null,
  });
});

describe("instagram account settings stats", () => {
  it("uses the canonical user-facing metric source", async () => {
    const range = { gte: new Date("2026-05-01T00:00:00Z"), lt: new Date("2026-06-01T00:00:00Z") };

    const stats = await getInstagramAccountSettingsStats("user-a", "integration-a", range);

    expect(mockGetUserFacingMetrics).toHaveBeenCalledWith("user-a", range);
    expect(stats.comments.value).toBe(22);
  });

  it("maps contacts from canonical leads captured", async () => {
    const stats = await getInstagramAccountSettingsStats("user-a");

    expect(stats.contacts.value).toBe(3);
  });

  it("maps DMs out from canonical sent AP3k DMs only", async () => {
    const stats = await getInstagramAccountSettingsStats("user-a");

    expect(stats.dmsOut).toEqual({ value: 0, enabled: true, subtitle: "AP3k private DMs sent" });
  });

  it("maps reply rate from canonical confirmed replies over matched comments", async () => {
    const stats = await getInstagramAccountSettingsStats("user-a");

    expect(stats.replyRate.value).toBe("75%");
    expect(stats.replyRate.subtitle).toBe("Confirmed replies / matched comments");
  });

  it("returns intentional unavailable states for unsupported data sources", async () => {
    const stats = await getInstagramAccountSettingsStats("user-a");

    expect(stats.followers).toEqual({ value: "Not enabled", enabled: false, subtitle: "Follower snapshots coming soon" });
    expect(stats.posts).toEqual({ value: "Not enabled", enabled: false, subtitle: "Media sync coming soon" });
    expect(stats.removed).toEqual({ value: "Not enabled", enabled: false, subtitle: "Moderation not enabled" });
    expect(stats.dmsIn).toEqual({ value: "Not enabled", enabled: false, subtitle: "DM webhooks require messaging approval" });
  });
});
