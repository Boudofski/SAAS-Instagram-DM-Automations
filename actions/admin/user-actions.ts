"use server";

import {
  requireAdminAction,
  adminFormString,
  createAdminAuditLog,
} from "@/actions/admin/safe-actions";
import { client } from "@/lib/prisma";
import { SUBSCRIPTION_PLAN } from "@prisma/client";
import { revalidatePath } from "next/cache";

const MIN_REASON = 5;

function safeError(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

function userPaths(userId: string) {
  return [
    "/ap3k-admin-v2/users",
    "/ap3k-admin-v2/overview",
    `/ap3k-admin-v2/users/${userId}`,
  ] as const;
}

export async function adminSuspendUserAction(formData: FormData) {
  const userId = adminFormString(formData, "userId");
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

  if (confirmation !== "SUSPEND") {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_SUSPENDED",
      targetType: "User",
      targetId: userId,
      reason,
      confirmation,
      status: "BLOCKED",
      error: "Typed confirmation mismatch.",
    });
    return { status: 400 as const, data: "Type SUSPEND to confirm this action." };
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true, suspendedAt: true, suspendedReason: true },
  });

  if (!user) {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_SUSPENDED",
      targetType: "User",
      targetId: userId,
      reason,
      status: "FAILED",
      error: "User not found.",
    });
    return { status: 404 as const, data: "User not found." };
  }

  try {
    const now = new Date();
    const [updated, paused] = await Promise.all([
      client.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED", suspendedAt: now, suspendedReason: reason },
        select: { id: true, email: true, status: true, suspendedAt: true },
      }),
      client.automation.updateMany({
        where: { userId, active: true },
        data: { active: false },
      }),
    ]);

    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_SUSPENDED",
      targetType: "User",
      targetId: userId,
      targetLabel: user.email,
      reason,
      confirmation,
      before: { status: user.status, suspendedAt: user.suspendedAt },
      after: { status: updated.status, suspendedAt: updated.suspendedAt },
      metadata: { pausedCampaigns: paused.count },
      status: "SUCCESS",
    });

    for (const path of userPaths(userId)) {
      revalidatePath(path);
    }

    return {
      status: 200 as const,
      data: `User suspended. ${paused.count} campaign(s) paused.`,
    };
  } catch (error) {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_SUSPENDED",
      targetType: "User",
      targetId: userId,
      targetLabel: user.email,
      reason,
      before: { status: user.status, suspendedAt: user.suspendedAt },
      status: "FAILED",
      error: safeError(error),
    });
    return { status: 500 as const, data: safeError(error) };
  }
}

export async function adminReactivateUserAction(formData: FormData) {
  const userId = adminFormString(formData, "userId");
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

  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true, suspendedAt: true, suspendedReason: true },
  });

  if (!user) {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_REACTIVATED",
      targetType: "User",
      targetId: userId,
      reason,
      status: "FAILED",
      error: "User not found.",
    });
    return { status: 404 as const, data: "User not found." };
  }

  try {
    const updated = await client.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
      select: { id: true, email: true, status: true },
    });

    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_REACTIVATED",
      targetType: "User",
      targetId: userId,
      targetLabel: user.email,
      reason,
      before: {
        status: user.status,
        suspendedAt: user.suspendedAt,
        suspendedReason: user.suspendedReason,
      },
      after: { status: updated.status },
      status: "SUCCESS",
    });

    for (const path of userPaths(userId)) {
      revalidatePath(path);
    }

    return {
      status: 200 as const,
      data: "User reactivated. Campaigns remain paused — reactivate manually if needed.",
    };
  } catch (error) {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_REACTIVATED",
      targetType: "User",
      targetId: userId,
      targetLabel: user.email,
      reason,
      before: { status: user.status, suspendedAt: user.suspendedAt },
      status: "FAILED",
      error: safeError(error),
    });
    return { status: 500 as const, data: safeError(error) };
  }
}

export async function adminChangeUserPlanAction(formData: FormData) {
  const userId = adminFormString(formData, "userId");
  const plan = adminFormString(formData, "plan") as SUBSCRIPTION_PLAN;
  const reason = adminFormString(formData, "reason");

  if (!["FREE", "PRO"].includes(plan)) {
    return { status: 400 as const, data: "Invalid plan selected." };
  }

  if (reason.length < MIN_REASON) {
    return { status: 400 as const, data: "Reason must be at least 5 characters." };
  }

  let admin: Awaited<ReturnType<typeof requireAdminAction>>;
  try {
    admin = await requireAdminAction();
  } catch {
    return { status: 403 as const, data: "Unauthorized." };
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscription: {
        select: {
          plan: true,
        },
      },
    },
  });

  if (!user) {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_PLAN_CHANGED",
      targetType: "User",
      targetId: userId,
      reason,
      status: "FAILED",
      error: "User not found.",
    });
    return { status: 404 as const, data: "User not found." };
  }

  const currentPlan = user.subscription?.plan ?? "FREE";

  try {
    const updated = await client.subscription.upsert({
      where: { userId },
      update: { plan },
      create: { userId, plan },
    });

    await createAdminAuditLog({
      admin,
      action: "ADMIN_PLAN_CHANGED",
      targetType: "User",
      targetId: userId,
      targetLabel: user.email,
      reason,
      before: { plan: currentPlan },
      after: { plan: updated.plan },
      status: "SUCCESS",
    });

    for (const path of userPaths(userId)) {
      revalidatePath(path);
    }

    return {
      status: 200 as const,
      data: `Plan changed from ${currentPlan} to ${updated.plan}.`,
    };
  } catch (error) {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_PLAN_CHANGED",
      targetType: "User",
      targetId: userId,
      targetLabel: user.email,
      reason,
      before: { plan: currentPlan },
      status: "FAILED",
      error: safeError(error),
    });
    return { status: 500 as const, data: safeError(error) };
  }
}

export async function adminResetUserUsageAction(formData: FormData) {
  const userId = adminFormString(formData, "userId");
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

  if (confirmation !== "RESET USAGE") {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_USAGE_RESET",
      targetType: "User",
      targetId: userId,
      reason,
      confirmation,
      status: "BLOCKED",
      error: "Typed confirmation mismatch.",
    });
    return { status: 400 as const, data: "Type RESET USAGE to confirm this action." };
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscription: {
        select: {
          usageResetAt: true,
        },
      },
    },
  });

  if (!user) {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_USAGE_RESET",
      targetType: "User",
      targetId: userId,
      reason,
      status: "FAILED",
      error: "User not found.",
    });
    return { status: 404 as const, data: "User not found." };
  }

  try {
    const now = new Date();
    const updated = await client.subscription.upsert({
      where: { userId },
      update: { usageResetAt: now },
      create: { userId, usageResetAt: now },
    });

    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_USAGE_RESET",
      targetType: "User",
      targetId: userId,
      targetLabel: user.email,
      reason,
      confirmation,
      before: { usageResetAt: user.subscription?.usageResetAt },
      after: { usageResetAt: updated.usageResetAt },
      status: "SUCCESS",
    });

    for (const path of userPaths(userId)) {
      revalidatePath(path);
    }

    return {
      status: 200 as const,
      data: "User monthly usage reset. Displayed counts now start from this moment forward.",
    };
  } catch (error) {
    await createAdminAuditLog({
      admin,
      action: "ADMIN_USER_USAGE_RESET",
      targetType: "User",
      targetId: userId,
      targetLabel: user.email,
      reason,
      before: { usageResetAt: user.subscription?.usageResetAt },
      status: "FAILED",
      error: safeError(error),
    });
    return { status: 500 as const, data: safeError(error) };
  }
}
