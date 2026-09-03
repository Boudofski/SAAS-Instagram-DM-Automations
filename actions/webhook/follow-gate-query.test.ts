import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMessageLogFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  client: {
    messageLog: {
      findFirst: (...args: unknown[]) => mockMessageLogFindFirst(...args),
    },
  },
}));

import { hasDeliveredFollowGatePayload } from "./queries";

describe("hasDeliveredFollowGatePayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks only the explicit protected-payload delivery marker", async () => {
    mockMessageLogFindFirst.mockResolvedValue({ id: "message-log-1" });

    await expect(hasDeliveredFollowGatePayload("automation-1", "recipient-1")).resolves.toBe(true);
    expect(mockMessageLogFindFirst).toHaveBeenCalledWith({
      where: {
        automationId: "automation-1",
        recipientIgId: "recipient-1",
        messageType: "DM",
        status: "SENT",
        errorMessage: "follow_gate_payload_sent",
      },
      select: { id: true },
    });
  });

  it("does not treat a gate prompt as delivered protected content", async () => {
    mockMessageLogFindFirst.mockResolvedValue(null);

    await expect(hasDeliveredFollowGatePayload("automation-1", "recipient-1")).resolves.toBe(false);
  });
});
