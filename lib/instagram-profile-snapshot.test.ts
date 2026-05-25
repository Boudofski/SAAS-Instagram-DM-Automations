import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindSnapshotFirst = vi.fn();
const mockCreateSnapshot = vi.fn();
const mockFindIntegrationFirst = vi.fn();
const mockUpdateIntegration = vi.fn();
const mockGetInstagramBusinessProfile = vi.fn();

vi.mock("@/lib/prisma", () => ({
  client: {
    instagramAccountSnapshot: {
      findFirst: (...args: any[]) => mockFindSnapshotFirst(...args),
      create: (...args: any[]) => mockCreateSnapshot(...args),
    },
    integrations: {
      findFirst: (...args: any[]) => mockFindIntegrationFirst(...args),
      update: (...args: any[]) => mockUpdateIntegration(...args),
    },
  },
}));

vi.mock("@/lib/fetch", () => ({
  getInstagramBusinessProfile: (...args: any[]) => mockGetInstagramBusinessProfile(...args),
  getSafeMetaError: (error: any) => error?.safe ?? { message: error?.message ?? String(error) },
}));

import {
  getInstagramSnapshotComparison,
  getInstagramSnapshotComparisonWithMissingRefresh,
  getInstagramSnapshotComparisonForUser,
  getLatestInstagramSnapshot,
  getProfileSnapshotStatus,
  refreshInstagramProfileSnapshotForUser,
} from "@/lib/instagram-profile-snapshot";

const now = new Date("2026-05-24T12:00:00Z");

function snapshot(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? "snap-1",
    integrationId: overrides.integrationId ?? "integration-a",
    instagramId: overrides.instagramId ?? "ig-1",
    username: overrides.username ?? "ap3k",
    profilePictureUrl: overrides.profilePictureUrl ?? "https://example.com/avatar.jpg",
    followersCount: Object.prototype.hasOwnProperty.call(overrides, "followersCount") ? overrides.followersCount : 100,
    mediaCount: Object.prototype.hasOwnProperty.call(overrides, "mediaCount") ? overrides.mediaCount : 10,
    accountType: overrides.accountType ?? "BUSINESS",
    source: "meta_graph",
    fetchedAt: overrides.fetchedAt ?? now,
    createdAt: overrides.createdAt ?? now,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("instagram profile snapshots", () => {
  it("latest snapshot returns newest by fetchedAt", async () => {
    mockFindSnapshotFirst.mockResolvedValue(snapshot({ id: "newest" }));

    const latest = await getLatestInstagramSnapshot("integration-a");

    expect(latest?.id).toBe("newest");
    expect(mockFindSnapshotFirst).toHaveBeenCalledWith({
      where: { integrationId: "integration-a" },
      orderBy: { fetchedAt: "desc" },
    });
  });

  it("follower comparison calculates absolute and percent growth", async () => {
    mockFindSnapshotFirst
      .mockResolvedValueOnce(snapshot({ followersCount: 150 }))
      .mockResolvedValueOnce(snapshot({ followersCount: 100 }));

    const result = await getInstagramSnapshotComparison("integration-a", "7d", now);

    expect(result.followerChange).toBe(50);
    expect(result.followerChangePercent).toBe(50);
    expect(result.change).toEqual({ value: 50, label: "+50%", tone: "positive" });
  });

  it("no previous snapshot returns neutral change", async () => {
    mockFindSnapshotFirst
      .mockResolvedValueOnce(snapshot({ followersCount: 150 }))
      .mockResolvedValueOnce(null);

    const result = await getInstagramSnapshotComparison("integration-a", "7d", now);

    expect(result.followerChange).toBeNull();
    expect(result.change).toEqual({ value: null, label: "—", tone: "neutral" });
  });

  it("tenant scoped comparison refuses cross-user integration", async () => {
    mockFindIntegrationFirst.mockResolvedValue(null);

    const result = await getInstagramSnapshotComparisonForUser("user-a", "integration-b", "month", now);

    expect(result).toBeNull();
    expect(mockFindIntegrationFirst).toHaveBeenCalledWith({
      where: { id: "integration-b", userId: "user-a" },
      select: { id: true },
    });
  });

  it("refresh helper returns cached snapshot when fresh", async () => {
    const fresh = snapshot({ fetchedAt: new Date("2026-05-24T10:00:00Z") });
    mockFindIntegrationFirst.mockResolvedValue({
      id: "integration-a",
      token: "page-token-secret",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
      instagramId: "ig-1",
      instagramUsername: "olduser",
      profilePictureUrl: null,
      snapshots: [fresh],
    });

    const result = await refreshInstagramProfileSnapshotForUser("clerk-a", "integration-a", { now });

    expect(result.cached).toBe(true);
    expect(result.data?.followersCount).toBe(100);
    expect(mockGetInstagramBusinessProfile).not.toHaveBeenCalled();
  });

  it("refresh helper fetches and stores profile stats when stale", async () => {
    mockFindIntegrationFirst.mockResolvedValue({
      id: "integration-a",
      token: "page-token-secret",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
      instagramId: "ig-1",
      instagramUsername: "olduser",
      profilePictureUrl: null,
      snapshots: [snapshot({ fetchedAt: new Date("2026-05-23T00:00:00Z") })],
    });
    mockGetInstagramBusinessProfile.mockResolvedValue({
      data: {
        id: "ig-1",
        username: "realuser",
        profile_picture_url: "https://example.com/real.jpg",
        followers_count: 120,
        media_count: 14,
        account_type: "CREATOR",
      },
    });
    mockCreateSnapshot.mockImplementation(async ({ data }) => snapshot({ ...data, id: "snap-new", createdAt: now }));
    mockUpdateIntegration.mockResolvedValue({});

    const result = await refreshInstagramProfileSnapshotForUser("clerk-a", "integration-a", { now });

    expect(mockGetInstagramBusinessProfile).toHaveBeenCalledWith("ig-1", "page-token-secret");
    expect(mockCreateSnapshot).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: "realuser",
        profilePictureUrl: "https://example.com/real.jpg",
        followersCount: 120,
        mediaCount: 14,
        accountType: "CREATOR",
      }),
    });
    expect(JSON.stringify(result)).not.toContain("page-token-secret");
    expect(result.cached).toBe(false);
  });

  it("refresh helper handles Meta permission errors safely", async () => {
    mockFindIntegrationFirst.mockResolvedValue({
      id: "integration-a",
      token: "page-token-secret",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
      instagramId: "ig-1",
      instagramUsername: "olduser",
      profilePictureUrl: null,
      snapshots: [],
    });
    mockGetInstagramBusinessProfile.mockRejectedValue({
      safe: { status: 400, code: 10, message: "Permissions error" },
    });

    const result = await refreshInstagramProfileSnapshotForUser("clerk-a", "integration-a", { now });

    expect(result.error).toBe("Meta did not return follower/post fields. Reconnect Instagram or check account permissions.");
    expect(JSON.stringify(result)).not.toContain("page-token-secret");
  });

  it("refresh helper returns reconnect message when token is expired", async () => {
    mockFindIntegrationFirst.mockResolvedValue({
      id: "integration-a",
      token: "page-token-secret",
      expiresAt: new Date("2026-05-01T00:00:00Z"),
      instagramId: "ig-1",
      instagramUsername: "olduser",
      profilePictureUrl: null,
      snapshots: [],
    });

    const result = await refreshInstagramProfileSnapshotForUser("clerk-a", "integration-a", { now });

    expect(result.status).toBe(401);
    expect(result.error).toBe("Reconnect Instagram to refresh profile stats.");
    expect(JSON.stringify(result)).not.toContain("page-token-secret");
  });

  it("refresh helper saves partial snapshot when followers missing but username present", async () => {
    mockFindIntegrationFirst.mockResolvedValue({
      id: "integration-a",
      token: "page-token-secret",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
      instagramId: "ig-1",
      instagramUsername: "olduser",
      profilePictureUrl: null,
      snapshots: [snapshot({ fetchedAt: new Date("2026-05-23T00:00:00Z") })],
    });
    mockGetInstagramBusinessProfile.mockResolvedValue({
      data: {
        id: "ig-1",
        username: "partialuser",
        profile_picture_url: "https://example.com/partial.jpg",
      },
    });
    mockCreateSnapshot.mockImplementation(async ({ data }) =>
      snapshot({ ...data, id: "snap-partial", followersCount: null, mediaCount: null, createdAt: now })
    );
    mockUpdateIntegration.mockResolvedValue({});

    const result = await refreshInstagramProfileSnapshotForUser("clerk-a", "integration-a", { now });

    expect(mockCreateSnapshot).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: "partialuser",
        profilePictureUrl: "https://example.com/partial.jpg",
        followersCount: null,
        mediaCount: null,
      }),
    });
    expect(result.cached).toBe(false);
    expect(JSON.stringify(result)).not.toContain("page-token-secret");
  });

  it("missing snapshot triggers one safe refresh attempt and returns the refreshed snapshot", async () => {
    mockFindIntegrationFirst
      .mockResolvedValueOnce({ id: "integration-a" })
      .mockResolvedValueOnce({
        id: "integration-a",
        token: "page-token-secret",
        expiresAt: new Date("2026-06-01T00:00:00Z"),
        instagramId: "ig-1",
        instagramUsername: "olduser",
        profilePictureUrl: null,
        snapshots: [],
      })
      .mockResolvedValueOnce({ id: "integration-a" });
    mockFindSnapshotFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(snapshot({ id: "snap-new", followersCount: 444, mediaCount: 12 }))
      .mockResolvedValueOnce(null);
    mockGetInstagramBusinessProfile.mockResolvedValue({
      data: { id: "ig-1", username: "realuser", followers_count: 444, media_count: 12 },
    });
    mockCreateSnapshot.mockImplementation(async ({ data }) => snapshot({ ...data, id: "snap-new", createdAt: now }));
    mockUpdateIntegration.mockResolvedValue({});

    const result = await getInstagramSnapshotComparisonWithMissingRefresh("clerk-a", "user-a", "integration-a", "month", now);

    expect(mockGetInstagramBusinessProfile).toHaveBeenCalledTimes(1);
    expect(result.refresh?.cached).toBe(false);
    expect(result.comparison?.current?.followersCount).toBe(444);
    expect(JSON.stringify(result)).not.toContain("page-token-secret");
  });

  it("refresh helper uses instagramId field, not pageId", async () => {
    mockFindIntegrationFirst.mockResolvedValue({
      id: "integration-a",
      token: "page-token-secret",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
      instagramId: "correct-ig-id",
      instagramUsername: "olduser",
      profilePictureUrl: null,
      snapshots: [snapshot({ fetchedAt: new Date("2026-05-23T00:00:00Z") })],
    });
    mockGetInstagramBusinessProfile.mockResolvedValue({
      data: { id: "correct-ig-id", username: "realuser", followers_count: 100, media_count: 5 },
    });
    mockCreateSnapshot.mockImplementation(async ({ data }) => snapshot({ ...data, id: "snap-new", createdAt: now }));
    mockUpdateIntegration.mockResolvedValue({});

    await refreshInstagramProfileSnapshotForUser("clerk-a", "integration-a", { now });

    expect(mockGetInstagramBusinessProfile).toHaveBeenCalledWith("correct-ig-id", "page-token-secret");
  });

  it("refresh helper returns missing-id error if instagramId absent", async () => {
    mockFindIntegrationFirst.mockResolvedValue({
      id: "integration-a",
      token: "page-token-secret",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
      instagramId: null,
      instagramUsername: null,
      profilePictureUrl: null,
      snapshots: [],
    });

    const result = await refreshInstagramProfileSnapshotForUser("clerk-a", "integration-a", { now });

    expect(result.status).toBe(404);
    expect(result.error).toBe("Connect Instagram to enable profile stats.");
    expect(mockGetInstagramBusinessProfile).not.toHaveBeenCalled();
  });

  it("getProfileSnapshotStatus returns Missing when no snapshot", () => {
    expect(getProfileSnapshotStatus(null)).toEqual({ label: "Missing", ok: false });
    expect(getProfileSnapshotStatus(undefined)).toEqual({ label: "Missing", ok: false });
  });

  it("getProfileSnapshotStatus returns Partial when snapshot has no followers or media", () => {
    const partial = { fetchedAt: now, followersCount: null, mediaCount: null };
    expect(getProfileSnapshotStatus(partial, now)).toEqual({ label: "Partial", ok: false });
  });

  it("getProfileSnapshotStatus returns Partial when only mediaCount is null", () => {
    const partial = { fetchedAt: now, followersCount: null, mediaCount: 5 };
    expect(getProfileSnapshotStatus(partial, now)).toEqual({ label: "Fresh", ok: true });
  });

  it("getProfileSnapshotStatus returns Fresh when snapshot has followers and is recent", () => {
    const fresh = { fetchedAt: now, followersCount: 1000, mediaCount: 20 };
    expect(getProfileSnapshotStatus(fresh, now)).toEqual({ label: "Fresh", ok: true });
  });

  it("getProfileSnapshotStatus returns Stale when snapshot has followers but is old", () => {
    const old = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const stale = { fetchedAt: old, followersCount: 1000, mediaCount: 20 };
    expect(getProfileSnapshotStatus(stale, now)).toEqual({ label: "Stale", ok: false });
  });

  it("latest snapshot query returns partial snapshot without followers", async () => {
    const partial = {
      id: "snap-partial",
      integrationId: "integration-a",
      instagramId: "ig-1",
      username: "ap3k",
      profilePictureUrl: "https://example.com/avatar.jpg",
      followersCount: null,
      mediaCount: null,
      accountType: "BUSINESS",
      source: "meta_graph",
      fetchedAt: now,
      createdAt: now,
    };
    mockFindSnapshotFirst.mockResolvedValue(partial);

    const result = await getLatestInstagramSnapshot("integration-a");

    expect(result?.followersCount).toBeNull();
    expect(result?.username).toBe("ap3k");
  });
});
