import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  automationDeliveryJob: { createMany: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ client: db }));
vi.mock("@/lib/qstash-delivery-wake", () => ({ scheduleDeliveryWake: vi.fn() }));
vi.mock("@/lib/meta-webhook-handler", () => ({ resumeAutomationDelivery: vi.fn() }));

import { claimFinalPayload, finalPayloadEventKey, isDefinitiveRejection, releaseFinalPayload } from "./automation-delivery";

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
    expect(await releaseFinalPayload("automation", "person", "comment-1", { status: 400, code: 100, deliveredMessageIds: [] })).toBe(true);
    expect(await claimFinalPayload("automation", "person", "comment-1")).toBe(true);
  });

  it.each([
    ["no response (timeout or network)", {}],
    ["HTTP 500", { status: 500 }],
    ["HTTP 503", { status: 503 }],
    ["HTTP 408 request timeout", { status: 408 }],
    ["Graph unknown error code 1", { status: 400, code: 1 }],
    ["Graph transient error code 2", { status: 400, code: 2 }],
    ["a 4xx after the media part was already delivered", { status: 400, code: 100, deliveredMessageIds: ["mid.media"] }],
  ])("keeps the receipt when the outcome is ambiguous: %s", async (_label, failure) => {
    await claimFinalPayload("automation", "person", "comment-1");
    expect(isDefinitiveRejection(failure)).toBe(false);
    expect(await releaseFinalPayload("automation", "person", "comment-1", failure)).toBe(false);
    expect(db.automationDeliveryJob.deleteMany).not.toHaveBeenCalled();
    expect(await claimFinalPayload("automation", "person", "comment-1")).toBe(false);
  });

  it("keeps the receipt and does not throw when releasing it fails", async () => {
    db.automationDeliveryJob.deleteMany.mockRejectedValueOnce(new Error("db unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(releaseFinalPayload("automation", "person", "comment-1", { status: 400, code: 10 })).resolves.toBe(false);
  });

  it("only removes the completed receipt for that journey", async () => {
    await releaseFinalPayload("automation", "person", "comment-1", { status: 403, code: 10 });
    expect(db.automationDeliveryJob.deleteMany).toHaveBeenCalledWith({
      where: { automationId: "automation", eventKey: finalPayloadEventKey("person", "comment-1"), status: "COMPLETED" },
    });
  });
});
