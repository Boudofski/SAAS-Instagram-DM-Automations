import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  automationDeliveryJob: { createMany: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ client: db }));
vi.mock("@/lib/qstash-delivery-wake", () => ({ scheduleDeliveryWake: vi.fn() }));
vi.mock("@/lib/meta-webhook-handler", () => ({ resumeAutomationDelivery: vi.fn() }));

import { claimFinalPayload, finalPayloadEventKey, releaseFinalPayload } from "./automation-delivery";

const receipts = new Set<string>();
beforeEach(() => {
  vi.clearAllMocks();
  receipts.clear();
  db.automationDeliveryJob.createMany.mockImplementation(async ({ data }) => {
    const key = `${data[0].automationId}|${data[0].eventKey}`;
    if (receipts.has(key)) return { count: 0 };
    receipts.add(key);
    return { count: 1 };
  });
  db.automationDeliveryJob.deleteMany.mockImplementation(async ({ where }) => {
    receipts.delete(`${where.automationId}|${where.eventKey}`);
    return { count: 1 };
  });
});

describe("final payload claim for button callbacks", () => {
  it("lets exactly one of two simultaneous taps release the final DM", async () => {
    expect(
      await Promise.all([
        claimFinalPayload("automation", "person", "comment-1"),
        claimFinalPayload("automation", "person", "comment-1"),
      ]),
    ).toEqual([true, false]);
  });

  it("keeps other journeys, people and automations independent", async () => {
    expect(await claimFinalPayload("automation", "person", "comment-1")).toBe(true);
    expect(await claimFinalPayload("automation", "person", "comment-2")).toBe(true);
    expect(await claimFinalPayload("automation", "other-person", "comment-1")).toBe(true);
    expect(await claimFinalPayload("other-automation", "person", "comment-1")).toBe(true);
  });

  it("writes an inert completed receipt that the delivery worker never picks up", async () => {
    await claimFinalPayload("automation", "person", "comment-1");
    expect(db.automationDeliveryJob.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ eventKey: finalPayloadEventKey("person", "comment-1"), status: "COMPLETED" })],
      skipDuplicates: true,
    });
  });

  it("releases after a definite Meta rejection so a later tap can deliver", async () => {
    await claimFinalPayload("automation", "person", "comment-1");
    expect(await releaseFinalPayload("automation", "person", "comment-1", 400)).toBe(true);
    expect(await claimFinalPayload("automation", "person", "comment-1")).toBe(true);
  });

  it("keeps the receipt when the outcome is ambiguous", async () => {
    await claimFinalPayload("automation", "person", "comment-1");
    for (const status of [undefined, 500, 503]) {
      expect(await releaseFinalPayload("automation", "person", "comment-1", status)).toBe(false);
    }
    expect(db.automationDeliveryJob.deleteMany).not.toHaveBeenCalled();
    expect(await claimFinalPayload("automation", "person", "comment-1")).toBe(false);
  });
});
