"use server";

import {
  requireAdminAction,
  adminFormString,
  createAdminAuditLog,
} from "@/actions/admin/safe-actions";
import { client } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const MIN_REASON = 5;
const META_GRAPH_VERSION = "v21.0";

const V2_PATHS = [
  "/ap3k-admin-v2/accounts",
  "/ap3k-admin-v2/overview",
  "/ap3k-admin-v2/activity",
] as const;

function safeError(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

// ---------------------------------------------------------------------------
// Action 1: Refresh Profile Snapshot
// Token is read server-side only for Meta Graph API call — never returned,
// never logged, never written to audit before/after.
// ---------------------------------------------------------------------------
export async function adminRefreshProfileSnapshotAction(formData: FormData) {
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason");

  if (reason.length < MIN_REASON) {
    return { status: 400 as const, data: "Reason must be at least 5 characters." };
  }

  let admin: Awaited<ReturnType<typeof requireAdminAction>>;
  try {
    admin = await requireAdminAction();
  } catch {
    return { status: 403 as const, data: "Unauthorized." };
  }

  const row = await client.integrations.findUnique({
    where: { id: integrationId },
    select: {
      id: true,
      instagramId: true,
      instagramUsername: true,
      profilePictureUrl: true,
      token: true, // used only for Meta API call below — never returned or logged
    },
  });

  if (!row || !row.instagramId) {
    const error = !row ? "Integration not found." : "No instagramId on integration.";
    await createAdminAuditLog({ admin, action: "ADMIN_REFRESH_PROFILE_SNAPSHOT", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error });
    return { status: 404 as const, data: !row ? "Integration not found." : "No Instagram ID on this account." };
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${row.instagramId}?fields=id,username,profile_picture_url,followers_count,media_count,account_type`;

  let apiData: {
    id: string;
    username?: string;
    profile_picture_url?: string;
    followers_count?: number;
    media_count?: number;
    account_type?: string;
  };

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${row.token}` } });
    if (!res.ok) throw new Error(`Meta API returned HTTP ${res.status}`);
    apiData = await res.json();
  } catch (error) {
    await createAdminAuditLog({ admin, action: "ADMIN_REFRESH_PROFILE_SNAPSHOT", targetType: "INTEGRATION", targetId: integrationId, reason, before: { instagramUsername: row.instagramUsername }, status: "FAILED", error: safeError(error) });
    return { status: 500 as const, data: safeError(error) };
  }

  try {
    await client.instagramAccountSnapshot.create({
      data: {
        integrationId,
        instagramId: apiData.id,
        username: apiData.username ?? null,
        profilePictureUrl: apiData.profile_picture_url ?? null,
        followersCount: apiData.followers_count ?? null,
        mediaCount: apiData.media_count ?? null,
        accountType: apiData.account_type ?? null,
        source: "admin_refresh",
      },
    });

    await client.integrations.update({
      where: { id: integrationId },
      data: {
        instagramUsername: apiData.username ?? row.instagramUsername,
        profilePictureUrl: apiData.profile_picture_url ?? row.profilePictureUrl,
        lastAdminNote: reason,
        lastAdminActionAt: new Date(),
      },
    });

    await createAdminAuditLog({
      admin, action: "ADMIN_REFRESH_PROFILE_SNAPSHOT", targetType: "INTEGRATION", targetId: integrationId, reason,
      before: { instagramUsername: row.instagramUsername, profilePictureUrl: row.profilePictureUrl },
      after: { username: apiData.username, followersCount: apiData.followers_count },
      status: "SUCCESS",
    });

    for (const path of V2_PATHS) revalidatePath(path);
    return { status: 200 as const, data: "Profile snapshot refreshed." };
  } catch (error) {
    await createAdminAuditLog({ admin, action: "ADMIN_REFRESH_PROFILE_SNAPSHOT", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error: safeError(error) });
    return { status: 500 as const, data: safeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Action 2: Mark Reconnect Required
// ---------------------------------------------------------------------------
export async function adminMarkReconnectRequiredAction(formData: FormData) {
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason");

  if (reason.length < MIN_REASON) {
    return { status: 400 as const, data: "Reason must be at least 5 characters." };
  }

  let admin: Awaited<ReturnType<typeof requireAdminAction>>;
  try {
    admin = await requireAdminAction();
  } catch {
    return { status: 403 as const, data: "Unauthorized." };
  }

  const before = await client.integrations.findUnique({
    where: { id: integrationId },
    select: { id: true, instagramUsername: true, reconnectRequired: true },
  });

  if (!before) {
    await createAdminAuditLog({ admin, action: "ADMIN_MARK_RECONNECT_REQUIRED", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error: "Integration not found." });
    return { status: 404 as const, data: "Integration not found." };
  }

  if (before.reconnectRequired) {
    await createAdminAuditLog({ admin, action: "ADMIN_MARK_RECONNECT_REQUIRED", targetType: "INTEGRATION", targetId: integrationId, targetLabel: before.instagramUsername ?? undefined, reason, before: { reconnectRequired: true }, status: "BLOCKED", error: "Already marked for reconnect." });
    return { status: 400 as const, data: "Account is already marked for reconnect." };
  }

  try {
    await client.integrations.update({
      where: { id: integrationId },
      data: { reconnectRequired: true, lastAdminNote: reason, lastAdminActionAt: new Date() },
    });
    await createAdminAuditLog({ admin, action: "ADMIN_MARK_RECONNECT_REQUIRED", targetType: "INTEGRATION", targetId: integrationId, targetLabel: before.instagramUsername ?? undefined, reason, before: { reconnectRequired: false }, after: { reconnectRequired: true }, status: "SUCCESS" });
    for (const path of V2_PATHS) revalidatePath(path);
    return { status: 200 as const, data: "Account marked for reconnect." };
  } catch (error) {
    await createAdminAuditLog({ admin, action: "ADMIN_MARK_RECONNECT_REQUIRED", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error: safeError(error) });
    return { status: 500 as const, data: safeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Action 3: Soft Disconnect
// Does NOT pause campaigns — that is a separate admin action.
// Requires typed confirmation: "DISCONNECT"
// ---------------------------------------------------------------------------
export async function adminSoftDisconnectAction(formData: FormData) {
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");

  if (reason.length < MIN_REASON) {
    return { status: 400 as const, data: "Reason must be at least 5 characters." };
  }
  if (confirmation !== "DISCONNECT") {
    return { status: 400 as const, data: "Type DISCONNECT to confirm this action." };
  }

  let admin: Awaited<ReturnType<typeof requireAdminAction>>;
  try {
    admin = await requireAdminAction();
  } catch {
    return { status: 403 as const, data: "Unauthorized." };
  }

  const before = await client.integrations.findUnique({
    where: { id: integrationId },
    select: { id: true, instagramUsername: true, status: true, reconnectRequired: true },
  });

  if (!before) {
    await createAdminAuditLog({ admin, action: "ADMIN_SOFT_DISCONNECT_ACCOUNT", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error: "Integration not found." });
    return { status: 404 as const, data: "Integration not found." };
  }

  if (before.status === "DISCONNECTED") {
    await createAdminAuditLog({ admin, action: "ADMIN_SOFT_DISCONNECT_ACCOUNT", targetType: "INTEGRATION", targetId: integrationId, targetLabel: before.instagramUsername ?? undefined, reason, before: { status: before.status }, status: "BLOCKED", error: "Already disconnected." });
    return { status: 400 as const, data: "Account is already disconnected." };
  }

  try {
    await client.integrations.update({
      where: { id: integrationId },
      data: {
        status: "DISCONNECTED",
        disconnectedAt: new Date(),
        disconnectedReason: reason,
        lastAdminNote: reason,
        lastAdminActionAt: new Date(),
      },
    });
    await createAdminAuditLog({ admin, action: "ADMIN_SOFT_DISCONNECT_ACCOUNT", targetType: "INTEGRATION", targetId: integrationId, targetLabel: before.instagramUsername ?? undefined, reason, confirmation, before: { status: before.status, reconnectRequired: before.reconnectRequired }, after: { status: "DISCONNECTED" }, status: "SUCCESS" });
    for (const path of V2_PATHS) revalidatePath(path);
    return { status: 200 as const, data: "Account soft disconnected." };
  } catch (error) {
    await createAdminAuditLog({ admin, action: "ADMIN_SOFT_DISCONNECT_ACCOUNT", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error: safeError(error) });
    return { status: 500 as const, data: safeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Action 4: Pause All Campaigns for Account
// Sets active=false, needsReview=true on all active non-archived Automations
// for the account owner. Mirrors field pattern in softDisconnectIntegrationForUser
// (actions/integration/queries.ts:146) but as an explicit separate admin action.
// ---------------------------------------------------------------------------
export async function adminPauseCampaignsForAccountAction(formData: FormData) {
  const integrationId = adminFormString(formData, "integrationId");
  const reason = adminFormString(formData, "reason");
  const confirmation = adminFormString(formData, "confirmation");

  if (reason.length < MIN_REASON) {
    return { status: 400 as const, data: "Reason must be at least 5 characters." };
  }

  let admin: Awaited<ReturnType<typeof requireAdminAction>>;
  try {
    admin = await requireAdminAction();
  } catch {
    return { status: 403 as const, data: "Unauthorized." };
  }

  if (confirmation !== "PAUSE") {
    await createAdminAuditLog({ admin, action: "ADMIN_PAUSE_ACCOUNT_CAMPAIGNS", targetType: "INTEGRATION", targetId: integrationId, reason, confirmation, status: "BLOCKED", error: "Typed confirmation mismatch. Expected PAUSE." });
    return { status: 400 as const, data: "Type PAUSE to confirm this action." };
  }

  const row = await client.integrations.findUnique({
    where: { id: integrationId },
    select: { id: true, instagramUsername: true, userId: true },
  });

  if (!row) {
    await createAdminAuditLog({ admin, action: "ADMIN_PAUSE_ACCOUNT_CAMPAIGNS", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error: "Integration not found." });
    return { status: 404 as const, data: "Integration not found." };
  }

  if (!row.userId) {
    await createAdminAuditLog({ admin, action: "ADMIN_PAUSE_ACCOUNT_CAMPAIGNS", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error: "Integration has no owner." });
    return { status: 400 as const, data: "Integration has no owner user." };
  }

  try {
    const result = await client.automation.updateMany({
      where: { userId: row.userId, active: true, archivedAt: null },
      data: { active: false, needsReview: true, reviewReason: `Admin paused: ${reason}` },
    });

    if (result.count === 0) {
      await createAdminAuditLog({ admin, action: "ADMIN_PAUSE_ACCOUNT_CAMPAIGNS", targetType: "INTEGRATION", targetId: integrationId, targetLabel: row.instagramUsername ?? undefined, reason, status: "BLOCKED", error: "No active campaigns to pause." });
      return { status: 400 as const, data: "No active campaigns found for this account." };
    }

    await client.integrations.update({
      where: { id: integrationId },
      data: { lastAdminNote: reason, lastAdminActionAt: new Date() },
    });

    await createAdminAuditLog({ admin, action: "ADMIN_PAUSE_ACCOUNT_CAMPAIGNS", targetType: "INTEGRATION", targetId: integrationId, targetLabel: row.instagramUsername ?? undefined, reason, after: { pausedCount: result.count }, status: "SUCCESS" });
    for (const path of V2_PATHS) revalidatePath(path);
    return { status: 200 as const, data: `${result.count} campaign(s) paused.` };
  } catch (error) {
    await createAdminAuditLog({ admin, action: "ADMIN_PAUSE_ACCOUNT_CAMPAIGNS", targetType: "INTEGRATION", targetId: integrationId, reason, status: "FAILED", error: safeError(error) });
    return { status: 500 as const, data: safeError(error) };
  }
}
