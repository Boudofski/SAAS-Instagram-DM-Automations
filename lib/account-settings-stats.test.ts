import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUserFacingMetrics = vi.fn();
const mockGetInstagramSnapshotComparisonForUser = vi.fn();

vi.mock("@/lib/user-facing-metrics", () => ({
  getUserFacingMetrics: (...args: any[]) => mockGetUserFacingMetrics(...args),
}));

vi.mock("@/lib/instagram-profile-snapshot", () => ({
  getInstagramSnapshotComparisonForUser: (...args: any[]) => mockGetInstagramSnapshotComparisonForUser(...args),
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
  mockGetInstagramSnapshotComparisonForUser.mockResolvedValue(null);
});

describe("instagram account settings stats", () => {
  it("uses the canonical user-facing metric source", async () => {
    const range = { gte: new Date("2026-05-01T00:00:00Z"), lt: new Date("2026-06-01T00:00:00Z") };

    const stats = await getInstagramAccountSettingsStats("user-a", "integration-a", range);

    expect(mockGetUserFacingMetrics).toHaveBeenCalledWith("user-a", range);
    expect(mockGetInstagramSnapshotComparisonForUser).toHaveBeenCalledWith("user-a", "integration-a", "month");
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

    expect(stats.followers).toEqual({ value: "Refresh needed", enabled: false, subtitle: "Refresh profile to load from Meta" });
    expect(stats.posts).toEqual({ value: "Refresh needed", enabled: false, subtitle: "Refresh profile to load from Meta" });
    expect(stats.removed).toEqual({ value: "Not tracked", enabled: false, subtitle: "Removed comments are not tracked in account stats" });
    expect(stats.dmsIn).toEqual({ value: "Messaging approval required", enabled: false, subtitle: "Inbound DMs require Meta messaging approval" });
  });

  it("uses follower and post counts from the latest snapshot", async () => {
    mockGetInstagramSnapshotComparisonForUser.mockResolvedValue({
      current: {
        followersCount: 12345,
        mediaCount: 87,
      },
      followerChange: 25,
      followerChangePercent: 1,
    });

    const stats = await getInstagramAccountSettingsStats("user-a", "integration-a");

    expect(stats.followers).toEqual({ value: 12345, enabled: true, subtitle: "+25 followers · +1% since last snapshot" });
    expect(stats.posts).toEqual({ value: 87, enabled: true, subtitle: "Instagram posts" });
  });

  it("marks missing snapshot fields unavailable after a partial snapshot is stored", async () => {
    mockGetInstagramSnapshotComparisonForUser.mockResolvedValue({
      current: {
        followersCount: null,
        mediaCount: null,
      },
      followerChange: null,
    });

    const stats = await getInstagramAccountSettingsStats("user-a", "integration-a");

    expect(stats.followers).toEqual({ value: "Unavailable", enabled: false, subtitle: "Meta does not expose follower count for this connection." });
    expect(stats.posts).toEqual({ value: "Unavailable", enabled: false, subtitle: "Meta did not return media count" });
  });

  it("uses baseline copy when there is no previous follower snapshot", async () => {
    mockGetInstagramSnapshotComparisonForUser.mockResolvedValue({
      current: {
        followersCount: 8965,
        mediaCount: 15,
      },
      followerChange: null,
    });

    const stats = await getInstagramAccountSettingsStats("user-a", "integration-a");

    expect(stats.followers).toEqual({
      value: 8965,
      enabled: true,
      subtitle: "Baseline established. Growth tracking starts after next sync.",
    });
  });
});
