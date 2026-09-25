import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({
  automationFlowSession: {
    findUnique: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
  automationEngagementJob: { updateMany: vi.fn() },
  automationFlowReceipt: { createMany: vi.fn() },
  automationFlowEntry: { createMany: vi.fn(), updateMany: vi.fn() },
  automation: { findFirst: vi.fn() },
  inboxMessage: { findFirst: vi.fn() },
  lead: { upsert: vi.fn() },
}));
const send = vi.hoisted(() => vi.fn());
const quota = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ client: db }));
vi.mock("@/lib/send-token", () => ({
  resolveIntegrationSendToken: () => ({ ok: true, token: "test" }),
}));
vi.mock("@/lib/instagram-dm", () => ({ sendInstagramDirectResponse: send }));
vi.mock("@/actions/usage/queries", () => ({ canSendStaticReply: quota }));
vi.mock("@/actions/webhook/queries", () => ({
  createMessageLog: vi.fn(),
  createAutomationEvent: vi.fn(),
  recordOutboundInboxMessage: vi.fn(),
  trackResponse: vi.fn(),
}));
import { processAutomationFlow } from "./runtime";
import { templateFlow } from "./templates";
const now = new Date("2026-09-25T08:00:00Z");
const input = {
  integrationId: "i1",
  recipientIgId: "r1",
  text: "EBOOK",
  inboundAt: now,
  eventId: "mid1",
  automationId: "a1",
};
function automation(flow = configuredEmail()) {
  return {
    id: "a1",
    userId: "u1",
    integrationId: "i1",
    active: true,
    listener: { flowDefinition: flow },
    User: { status: "ACTIVE", subscription: { plan: "PRO" } },
    integration: { id: "i1", status: "CONNECTED", instagramId: "ig1" },
  };
}
function session() {
  return {
    id: "s1",
    automationId: "a1",
    integrationId: "i1",
    recipientIgId: "r1",
    definition: configuredEmail(),
    values: {},
    nodeId: "email",
    status: "WAITING",
    expiresAt: new Date(now.getTime() + 3600000),
    updatedAt: new Date(now.getTime() - 1000),
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  db.automationFlowSession.findUnique.mockResolvedValue(null);
  db.automation.findFirst.mockResolvedValue(automation());
  db.automationFlowSession.create.mockResolvedValue({
    ...session(),
    status: "READY",
  });
  db.automationFlowSession.updateMany.mockResolvedValue({ count: 1 });
  db.automationFlowSession.findFirst.mockResolvedValue({ id: "s1" });
  db.automationFlowReceipt.createMany.mockResolvedValue({ count: 1 });
  db.automationFlowEntry.createMany.mockResolvedValue({ count: 1 });
  db.inboxMessage.findFirst.mockResolvedValue(null);
  quota.mockResolvedValue({ ok: true });
  send.mockResolvedValue({ ok: true, messageIds: ["out1"] });
});
afterEach(() => vi.useRealTimers());
describe("persistent flow delivery", () => {
  it("starts email collection without delivering the resource early", async () => {
    expect(await processAutomationFlow(input)).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].message).toContain("SKIP");
    expect(db.automationFlowSession.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "WAITING", nodeId: "email" }),
      }),
    );
  });
  it("saves an explicit email and resumes the waiting step", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue(session());
    await processAutomationFlow({
      ...input,
      automationId: undefined,
      text: "Person@Example.com",
    });
    expect(db.lead.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ email: "person@example.com" }),
      }),
    );
    expect(send.mock.calls[0][0].message).toContain("resource you requested");
  });
  it("does not save a lead on SKIP", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue(session());
    await processAutomationFlow({
      ...input,
      automationId: undefined,
      text: "SKIP",
    });
    expect(db.lead.upsert).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("leaves invalid email replies waiting without delivering links", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue(session());
    await processAutomationFlow({
      ...input,
      automationId: undefined,
      text: "not an email",
    });
    expect(send).not.toHaveBeenCalled();
    expect(db.lead.upsert).not.toHaveBeenCalled();
  });
  it("cancels STOP and blocks further messages during the opt-out window", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue(session());
    await processAutomationFlow({ ...input, text: "STOP" });
    expect(db.automationFlowSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "STOPPED" }),
      }),
    );
    db.automationFlowSession.findUnique.mockResolvedValue({
      ...session(),
      status: "STOPPED",
    });
    await processAutomationFlow(input);
    expect(send).not.toHaveBeenCalled();
  });
  it("releases a stale lease without retrying its uncertain send", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue({
      ...session(),
      status: "PROCESSING:old",
      updatedAt: new Date(now.getTime() - 100000),
    });
    await processAutomationFlow(input);
    expect(send).not.toHaveBeenCalled();
    expect(db.automationFlowSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    );
  });
  it("cancels an earlier email request when a new flow takes over", async () => {
    await processAutomationFlow(input);
    expect(db.automationEngagementJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recipientIgId: "r1",
          automation: { integrationId: "i1" },
        }),
        data: { status: "CANCELLED" },
      }),
    );
  });
  it("does not replay a receipt from an earlier turn", async () => {
    db.automationFlowReceipt.createMany.mockResolvedValue({ count: 0 });
    await processAutomationFlow(input);
    expect(send).not.toHaveBeenCalled();
  });
  it("does not restart from a duplicate opening button", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue({
      ...session(),
      startEventId: "comment1",
    });
    await processAutomationFlow({ ...input, startEventId: "comment1" });
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects concurrent turn claims", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue(session());
    db.automationFlowSession.updateMany.mockResolvedValue({ count: 0 });
    await processAutomationFlow({ ...input, automationId: undefined });
    expect(send).not.toHaveBeenCalled();
  });
  it("does not retry an ambiguous crashed send", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue({
      ...session(),
      status: "PROCESSING:old",
    });
    await processAutomationFlow(input);
    expect(send).not.toHaveBeenCalled();
  });
  it("enforces one entry per person before drawing an outcome", async () => {
    db.automation.findFirst.mockResolvedValue(
      automation(templateFlow("giveaway")),
    );
    db.automationFlowEntry.createMany.mockResolvedValue({ count: 0 });
    await processAutomationFlow(input);
    expect(send).not.toHaveBeenCalled();
  });
  it("uses the receiving account and blocks an expired window", async () => {
    await processAutomationFlow({
      ...input,
      inboundAt: new Date(now.getTime() - 86400001),
    });
    expect(send).not.toHaveBeenCalled();
    expect(db.automation.findFirst).not.toHaveBeenCalled();
  });
  it("honors Pro publishing access at delivery time", async () => {
    const a = automation();
    a.User.subscription.plan = "FREE";
    db.automation.findFirst.mockResolvedValue(a);
    await processAutomationFlow(input);
    expect(send).not.toHaveBeenCalled();
  });
  it("does not consume messages for a paused custom flow", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue(session());
    db.automation.findFirst.mockResolvedValue(null);
    expect(
      await processAutomationFlow({ ...input, automationId: undefined }),
    ).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
  it("stops when a human has replied after the bot question", async () => {
    db.automationFlowSession.findUnique.mockResolvedValue(session());
    db.inboxMessage.findFirst.mockResolvedValue({ id: "manual" });
    await processAutomationFlow({ ...input, automationId: undefined });
    expect(send).not.toHaveBeenCalled();
  });
  it("does not bypass a exhausted action budget", async () => {
    quota.mockResolvedValue({ ok: false });
    await processAutomationFlow(input);
    expect(send).not.toHaveBeenCalled();
    expect(db.automationFlowSession.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });
});

function configuredEmail() {
  const flow = templateFlow("email");
  for (const node of flow.nodes)
    if (node.kind === "message")
      node.links = [
        { label: "Get resource", url: "https://ap3k.com/resource" },
      ];
  return flow;
}
