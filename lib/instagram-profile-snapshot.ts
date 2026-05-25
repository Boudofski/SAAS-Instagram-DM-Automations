import { type InstagramAccountSnapshot } from "@prisma/client";
import { getInstagramBusinessProfile, getSafeMetaError } from "@/lib/fetch";
import { client } from "@/lib/prisma";
import {
  type ChangeSummary,
  type DashboardPeriod,
  getPeriodRange,
  percentChange,
} from "@/lib/dashboard-metrics";

const SNAPSHOT_FRESH_MS = 6 * 60 * 60 * 1000;
const FORCE_REFRESH_LIMIT_MS = 15 * 60 * 1000;

export type SerializableInstagramSnapshot = {
  id: string;
  integrationId: string;
  instagramId: string | null;
  username: string | null;
  profilePictureUrl: string | null;
  followersCount: number | null;
  mediaCount: number | null;
  accountType: string | null;
  source: string;
  fetchedAt: string;
  createdAt: string;
};

export type InstagramSnapshotComparison = {
  current: InstagramAccountSnapshot | null;
  previous: InstagramAccountSnapshot | null;
  followerChange: number | null;
  followerChangePercent: number | null;
  change: ChangeSummary;
};

export type RefreshInstagramSnapshotResult = {
  status: number;
  data: SerializableInstagramSnapshot | null;
  cached: boolean;
  error?: string;
  message?: string;
};

type RefreshOptions = {
  force?: boolean;
  now?: Date;
};

function hasFollowers(snapshot: InstagramAccountSnapshot | null | undefined) {
  return typeof snapshot?.followersCount === "number";
}

export function serializeInstagramSnapshot(
  snapshot: InstagramAccountSnapshot | null
): SerializableInstagramSnapshot | null {
  if (!snapshot) return null;
  return {
    id: snapshot.id,
    integrationId: snapshot.integrationId,
    instagramId: snapshot.instagramId,
    username: snapshot.username,
    profilePictureUrl: snapshot.profilePictureUrl,
    followersCount: snapshot.followersCount,
    mediaCount: snapshot.mediaCount,
    accountType: snapshot.accountType,
    source: snapshot.source,
    fetchedAt: snapshot.fetchedAt.toISOString(),
    createdAt: snapshot.createdAt.toISOString(),
  };
}

export async function getLatestInstagramSnapshot(integrationId: string) {
  return client.instagramAccountSnapshot.findFirst({
    where: { integrationId },
    orderBy: { fetchedAt: "desc" },
  });
}

export async function getInstagramSnapshotComparison(
  integrationId: string,
  period: DashboardPeriod,
  now = new Date()
): Promise<InstagramSnapshotComparison> {
  const range = getPeriodRange(period, now);
  const [current, previous] = await Promise.all([
    getLatestInstagramSnapshot(integrationId),
    client.instagramAccountSnapshot.findFirst({
      where: { integrationId, fetchedAt: { lte: range.currentStart } },
      orderBy: { fetchedAt: "desc" },
    }),
  ]);

  const followerChange =
    hasFollowers(current) && hasFollowers(previous)
      ? current!.followersCount! - previous!.followersCount!
      : null;
  const followerChangePercent =
    followerChange !== null && previous!.followersCount && previous!.followersCount > 0
      ? Math.round((followerChange / previous!.followersCount) * 100)
      : null;

  return {
    current,
    previous,
    followerChange,
    followerChangePercent,
    change:
      hasFollowers(current) && hasFollowers(previous)
        ? percentChange(current!.followersCount!, previous!.followersCount!)
        : hasFollowers(current)
          ? { label: "—", tone: "neutral", value: null }
          : { label: "—", tone: "neutral", value: null },
  };
}

export async function getInstagramSnapshotComparisonForUser(
  userId: string,
  integrationId: string | undefined,
  period: DashboardPeriod,
  now = new Date()
) {
  if (!integrationId) return null;
  const integration = await client.integrations.findFirst({
    where: { id: integrationId, userId },
    select: { id: true },
  });
  if (!integration) return null;
  return getInstagramSnapshotComparison(integration.id, period, now);
}

export function getProfileSnapshotStatus(
  snapshot: Pick<InstagramAccountSnapshot, "fetchedAt" | "followersCount" | "mediaCount"> | null | undefined,
  now = new Date()
): { label: "Missing" | "Partial" | "Fresh" | "Stale"; ok: boolean } {
  if (!snapshot) return { label: "Missing", ok: false };
  const hasStats =
    typeof snapshot.followersCount === "number" || typeof snapshot.mediaCount === "number";
  if (!hasStats) return { label: "Partial", ok: false };
  const age = now.getTime() - snapshot.fetchedAt.getTime();
  if (age <= SNAPSHOT_FRESH_MS) return { label: "Fresh", ok: true };
  return { label: "Stale", ok: false };
}

export function formatSnapshotRefreshTime(value?: Date | string | null) {
  if (!value) return "Never refreshed";
  return new Date(value).toLocaleString();
}

function safeProfileStatsError(error: unknown) {
  const safe = getSafeMetaError(error);
  const message = String(safe.message ?? "").toLowerCase();
  if (message.includes("expired") || message.includes("invalid oauth") || safe.code === 190) {
    return "Reconnect Instagram to refresh profile stats.";
  }
  if (
    safe.code === 10 ||
    safe.code === 100 ||
    safe.code === 200 ||
    message.includes("permission") ||
    message.includes("followers_count") ||
    message.includes("media_count")
  ) {
    return "Meta did not return follower/post fields. Reconnect Instagram or check account permissions.";
  }
  if (safe.code === 4 || safe.code === 17 || safe.code === 613) {
    return "Refresh recently completed. Try again later.";
  }
  return "Instagram profile stats unavailable.";
}

export async function getInstagramSnapshotComparisonWithMissingRefresh(
  clerkId: string,
  userId: string,
  integrationId: string | undefined,
  period: DashboardPeriod,
  now = new Date()
): Promise<{
  comparison: InstagramSnapshotComparison | null;
  refresh: RefreshInstagramSnapshotResult | null;
}> {
  const initial = await getInstagramSnapshotComparisonForUser(userId, integrationId, period, now);
  if (!integrationId || initial?.current) {
    return { comparison: initial, refresh: null };
  }

  const refresh = await refreshInstagramProfileSnapshotForUser(clerkId, integrationId, { now });
  const comparison = await getInstagramSnapshotComparisonForUser(userId, integrationId, period, now);

  return { comparison, refresh };
}

export async function refreshInstagramProfileSnapshotForUser(
  clerkId: string,
  integrationId: string,
  options: RefreshOptions = {}
): Promise<RefreshInstagramSnapshotResult> {
  const now = options.now ?? new Date();
  const integration = await client.integrations.findFirst({
    where: { id: integrationId, User: { clerkId } },
    select: {
      id: true,
      token: true,
      expiresAt: true,
      instagramId: true,
      instagramUsername: true,
      profilePictureUrl: true,
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });

  if (!integration) {
    return { status: 404, data: null, cached: false, error: "Instagram account not found." };
  }

  const latest = integration.snapshots[0] ?? null;
  const latestAgeMs = latest ? now.getTime() - latest.fetchedAt.getTime() : Number.POSITIVE_INFINITY;

  if (latest && !options.force && latestAgeMs < SNAPSHOT_FRESH_MS) {
    return { status: 200, data: serializeInstagramSnapshot(latest), cached: true };
  }

  if (latest && options.force && latestAgeMs < FORCE_REFRESH_LIMIT_MS) {
    return {
      status: 200,
      data: serializeInstagramSnapshot(latest),
      cached: true,
      message: "Refresh recently completed. Try again later.",
    };
  }

  if (!integration.instagramId || !integration.token) {
    return {
      status: 404,
      data: serializeInstagramSnapshot(latest),
      cached: Boolean(latest),
      error: "Connect Instagram to enable profile stats.",
    };
  }

  if (integration.expiresAt && integration.expiresAt.getTime() < now.getTime()) {
    return {
      status: 401,
      data: serializeInstagramSnapshot(latest),
      cached: Boolean(latest),
      error: "Reconnect Instagram to refresh profile stats.",
    };
  }

  try {
    const profile = await getInstagramBusinessProfile(integration.instagramId, integration.token);
    const data = profile.data ?? {};
    const snapshot = await client.instagramAccountSnapshot.create({
      data: {
        integrationId: integration.id,
        instagramId: String(data.id ?? integration.instagramId),
        username: typeof data.username === "string" ? data.username : integration.instagramUsername,
        profilePictureUrl:
          typeof data.profile_picture_url === "string"
            ? data.profile_picture_url
            : integration.profilePictureUrl,
        followersCount:
          typeof data.followers_count === "number" ? Math.max(0, data.followers_count) : null,
        mediaCount: typeof data.media_count === "number" ? Math.max(0, data.media_count) : null,
        accountType: typeof data.account_type === "string" ? data.account_type : null,
        fetchedAt: now,
      },
    });

    await client.integrations.update({
      where: { id: integration.id },
      data: {
        instagramUsername: snapshot.username ?? integration.instagramUsername,
        profilePictureUrl: snapshot.profilePictureUrl ?? integration.profilePictureUrl,
      },
    });

    return { status: 200, data: serializeInstagramSnapshot(snapshot), cached: false };
  } catch (error) {
    return {
      status: 200,
      data: serializeInstagramSnapshot(latest),
      cached: Boolean(latest),
      error: safeProfileStatsError(error),
    };
  }
}
