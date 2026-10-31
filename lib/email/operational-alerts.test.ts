import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), enqueue: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ client: { automation: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/email/owner-alerts", () => ({ enqueueOwnerAlert: mocks.enqueue, notifyOwnerAlert: mocks.notify }));

import { classifyOperationalFailure, enqueueOperationalDeliveryAlert } from "./operational-alerts";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findUnique.mockResolvedValue({
    id: "automation-1",
    name: "Viral Reel",
    userId: "user-1",
    integrationId: "integration-1",
    integration: { instagramUsername: "creator" },
    User: { email: "creator@example.com", firstname: "Ada", lastname: "Creator" },
  });
  mocks.enqueue.mockResolvedValue({ id: "delivery-1" });
});

describe("operational Instagram alerts", () => {
  it("classifies actionable failures and ignores normal policy outcomes", () => {
    expect(classifyOperationalFailure({ status: "FAILED", errorMessage: "dm_access_disabled" })).toBe("authorization");
    expect(classifyOperationalFailure({ status: "SKIPPED", errorMessage: "static_reply_limit_reached" })).toBe("quota");
    expect(classifyOperationalFailure({ status: "FAILED", errorMessage: "Meta 429 rate limit" })).toBe("rate_limit");
    expect(classifyOperationalFailure({ status: "FAILED", errorMessage: "upstream unavailable" })).toBe("delivery");
    expect(classifyOperationalFailure({ status: "FAILED", errorMessage: "403: 10: This message is sent outside of allowed window. 2534022" })).toBeNull();
    expect(classifyOperationalFailure({ status: "SKIPPED", errorMessage: "one_dm_per_user" })).toBeNull();
  });

  it("uses a shared six-hour incident key so viral traffic creates one owner email", async () => {
    const occurredAt = new Date("2026-10-31T07:25:00Z");
    await enqueueOperationalDeliveryAlert({ automationId: "automation-1", status: "FAILED", messageType: "DM", errorMessage: "dm_access_disabled", occurredAt });
    expect(mocks.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      kind: "system",
      key: "instagram:authorization:integration-1:2026-10-31T06:00:00.000Z",
      userId: "user-1",
      reference: "@creator · Viral Reel",
    }));
  });

  it("deduplicates quota warnings for the full calendar month", async () => {
    await enqueueOperationalDeliveryAlert({ automationId: "automation-1", status: "SKIPPED", messageType: "DM", errorMessage: "static_reply_limit_reached", occurredAt: new Date("2026-10-31T23:00:00Z") });
    expect(mocks.enqueue.mock.calls[0][0].key).toBe("instagram:quota:integration-1:2026-10");
  });
});
