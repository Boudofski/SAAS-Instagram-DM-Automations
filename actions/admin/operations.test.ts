import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireOwnerAdmin = vi.fn();
const mockAuditCreate = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockAutomationUpdateMany = vi.fn();
const mockSubscriptionFindUnique = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireOwnerAdmin: (...args: any[]) => mockRequireOwnerAdmin(...args),
}));

vi.mock("@/lib/prisma", () => ({
  client: {
    adminAuditLog: { create: (...args: any[]) => mockAuditCreate(...args) },
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
      update: (...args: any[]) => mockUserUpdate(...args),
    },
    automation: {
      updateMany: (...args: any[]) => mockAutomationUpdateMany(...args),
    },
    subscription: {
      findUnique: (...args: any[]) => mockSubscriptionFindUnique(...args),
      update: (...args: any[]) => mockSubscriptionUpdate(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/fetch", () => ({
  subscribeInstagramWebhooks: vi.fn(),
  formatSafeMetaError: () => "safe meta error",
}));

vi.mock("@/actions/usage/queries", () => ({
  canActivateCampaign: vi.fn(async () => ({ ok: true })),
}));

import {
  blockedAdminAction,
  changeUserPlanAction,
  suspendUserAction,
  updateStaticReplyLimitAction,
} from "./operations";

describe("admin operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireOwnerAdmin.mockResolvedValue({ clerkId: "clerk_admin", email: "admin@example.com" });
    mockAuditCreate.mockResolvedValue({ id: "audit-1" });
    mockUserFindUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      status: "ACTIVE",
      suspendedAt: null,
      suspendedReason: null,
    });
    mockUserUpdate.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      status: "SUSPENDED",
      suspendedAt: new Date("2026-05-24T09:30:00Z"),
      suspendedReason: "abuse report",
    });
    mockAutomationUpdateMany.mockResolvedValue({ count: 2 });
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub-1",
      userId: "user-1",
      plan: "FREE",
      customerId: "cus_123",
      staticReplyLimitOverride: null,
      staticReplyCreditsCurrentMonth: 0,
      User: { email: "user@example.com" },
    });
    mockSubscriptionUpdate.mockResolvedValue({
      id: "sub-1",
      userId: "user-1",
      plan: "PRO",
      customerId: "cus_123",
      staticReplyLimitOverride: 10000,
      staticReplyCreditsCurrentMonth: 0,
      updatedAt: new Date("2026-05-24T09:30:00Z"),
      User: { email: "user@example.com" },
    });
  });

  it("suspends a user, pauses campaigns, and writes a SUCCESS audit", async () => {
    const form = new FormData();
    form.set("userId", "user-1");
    form.set("reason", "abuse report");
    form.set("confirmation", "SUSPEND");

    await expect(suspendUserAction(form)).resolves.toMatchObject({ status: 200 });

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ status: "SUSPENDED", suspendedReason: "abuse report" }),
      })
    );
    expect(mockAutomationUpdateMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { active: false },
    });
    expect(mockAuditCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "SUSPEND_USER",
          status: "SUCCESS",
          reason: "abuse report",
        }),
      })
    );
  });

  it("changes a subscription plan as an audited internal override", async () => {
    const form = new FormData();
    form.set("subscriptionId", "sub-1");
    form.set("plan", "PRO");
    form.set("reason", "support comp");
    form.set("confirmation", "CHANGE_PLAN");

    await expect(changeUserPlanAction(form)).resolves.toMatchObject({ status: 200 });

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-1" },
        data: { plan: "PRO" },
      })
    );
    expect(mockAuditCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "CHANGE_SUBSCRIPTION_PLAN",
          status: "SUCCESS",
          reason: "support comp",
        }),
      })
    );
  });

  it("updates a static reply limit override and audits before/after", async () => {
    const form = new FormData();
    form.set("subscriptionId", "sub-1");
    form.set("limitMode", "override");
    form.set("staticReplyLimitOverride", "10000");
    form.set("reason", "launch week allowance");
    form.set("confirmation", "UPDATE_LIMIT");

    await expect(updateStaticReplyLimitAction(form)).resolves.toMatchObject({ status: 200 });

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { staticReplyLimitOverride: 10000 },
      })
    );
    expect(mockAuditCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "UPDATE_STATIC_REPLY_LIMIT",
          status: "SUCCESS",
        }),
      })
    );
  });

  it("blocks invalid static reply limits and writes a BLOCKED audit", async () => {
    const form = new FormData();
    form.set("subscriptionId", "sub-1");
    form.set("limitMode", "override");
    form.set("staticReplyLimitOverride", "-1");
    form.set("reason", "bad limit");
    form.set("confirmation", "UPDATE_LIMIT");

    await expect(updateStaticReplyLimitAction(form)).resolves.toMatchObject({ status: 400 });

    expect(mockSubscriptionUpdate).not.toHaveBeenCalled();
    expect(mockAuditCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "UPDATE_STATIC_REPLY_LIMIT",
          status: "BLOCKED",
        }),
      })
    );
  });

  it("audits blocked destructive attempts without deleting data", async () => {
    const form = new FormData();
    form.set("action", "DELETE_USER_DATA_BLOCKED");
    form.set("targetType", "User");
    form.set("targetId", "user-1");
    form.set("reason", "operator clicked disabled delete");
    form.set("disabledReason", "Hard delete disabled.");

    await expect(blockedAdminAction(form)).resolves.toMatchObject({ status: 403 });

    expect(mockAuditCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "DELETE_USER_DATA_BLOCKED",
          status: "BLOCKED",
          error: "Hard delete disabled.",
        }),
      })
    );
  });
});
