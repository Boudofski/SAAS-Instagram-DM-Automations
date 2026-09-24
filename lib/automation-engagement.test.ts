import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({
  automationEngagementJob: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), update: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  automationSchedulerHeartbeat: { findUnique: vi.fn(), upsert: vi.fn() },
  automation: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
  lead: { findUnique: vi.fn(), upsert: vi.fn() },
  conversation: { findUnique: vi.fn() }, inboxMessage: { findFirst: vi.fn() },
}));
const send = vi.hoisted(() => vi.fn());
const quota = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ client: db }));
vi.mock("@/actions/webhook/queries", () => ({ createMessageLog: vi.fn(), trackResponse: vi.fn(), recordOutboundInboxMessage: vi.fn() }));
vi.mock("@/actions/usage/queries", () => ({ canSendStaticReply: quota }));
vi.mock("@/lib/instagram-dm", () => ({ sendInstagramDirectResponse: send }));
vi.mock("@/lib/send-token", () => ({ resolveIntegrationSendToken: () => ({ ok: true, token: "test" }) }));
import { beginEmailRequest, followUpSchedulerReady, processAutomationFollowUps, scheduleFollowUp, takeEmailReply } from "./automation-engagement";
const now = new Date("2026-09-24T05:30:00Z");
const inboundAt = new Date("2026-09-24T05:00:00Z");
const job = { id: "job-1", automationId: "a1", recipientIgId: "r1", flowId: "comment-1", kind: "FOLLOW_UP", inboundAt, dueAt: now, expiresAt: new Date("2026-09-25T05:00:00Z"), createdAt: new Date("2026-09-24T05:00:01Z") };
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(now);
  db.automationEngagementJob.updateMany.mockResolvedValue({ count: 1 });
  db.automationEngagementJob.findMany.mockResolvedValue([job]);
  db.automation.findUnique.mockResolvedValue({ id: "a1", userId: "u1", active: true, sendPrivateDm: true, User: { status: "ACTIVE" }, integration: { id: "i1", instagramId: "ig1", status: "CONNECTED" }, listener: { followUpEnabled: true, followUpMessage: "Your link", ctaLink: "https://ap3k.com", ctaButtonTitle: "Open" } });
  db.conversation.findUnique.mockResolvedValue({ lastInboundAt: inboundAt });
  db.inboxMessage.findFirst.mockResolvedValue(null);
  quota.mockResolvedValue({ ok: true }); send.mockResolvedValue({ ok: true, messageIds: ["meta1"] });
});
afterEach(() => vi.useRealTimers());
describe("durable engagement delivery", () => {
  it("does not advertise a scheduler with an expired or missing heartbeat", async () => {
    db.automationSchedulerHeartbeat.findUnique.mockResolvedValue(null);
    expect(await followUpSchedulerReady()).toBe(false);
    await scheduleFollowUp("a1", "r1", "flow", inboundAt, 30);
    expect(db.automationEngagementJob.upsert).not.toHaveBeenCalled();
    db.automationSchedulerHeartbeat.findUnique.mockResolvedValue({ lastRunAt: new Date(now.getTime() - 21 * 60_000) });
    expect(await followUpSchedulerReady()).toBe(false);
  });
  it("scopes email collection to a live request on the receiving account", async () => {
    db.automationEngagementJob.findFirst.mockResolvedValue({ ...job, kind: "EMAIL" });
    expect(await takeEmailReply("i1", "r1", "Person@Example.com", now)).toMatchObject({ kind: "continue", jobId: "job-1" });
    expect(db.automationEngagementJob.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ recipientIgId: "r1", status: "WAITING", automation: expect.objectContaining({ integrationId: "i1", active: true }) }) }));
    expect(db.lead.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { email: "person@example.com", emailCollectedAt: now } }));
  });
  it("consumes a replayed email webhook before another automation can match", async () => {
    db.automationEngagementJob.findFirst.mockResolvedValue({ id: "already-handled" });
    expect(await takeEmailReply("i1", "r1", "person@example.com", now, "meta-email-1")).toEqual({ kind: "waiting" });
    expect(db.lead.upsert).not.toHaveBeenCalled();
    expect(db.automationEngagementJob.updateMany).not.toHaveBeenCalled();
  });
  it("allows skip without creating an email or a marketing subscription", async () => {
    db.automationEngagementJob.findFirst.mockResolvedValue(job);
    expect(await takeEmailReply("i1", "r1", "SKIP", now)).toMatchObject({ kind: "continue" });
    expect(db.lead.upsert).not.toHaveBeenCalled();
  });
  it("does not process an email when another webhook owns the claim", async () => {
    db.automationEngagementJob.findFirst.mockResolvedValue(job);
    db.automationEngagementJob.updateMany.mockResolvedValue({ count: 0 });
    expect(await takeEmailReply("i1", "r1", "person@example.com", now)).toEqual({ kind: "waiting" });
    expect(db.lead.upsert).not.toHaveBeenCalled();
  });
  it("does not issue a duplicate email request after a claim collision", async () => {
    db.lead.findUnique.mockResolvedValue(null); db.automationEngagementJob.findUnique.mockResolvedValue(null);
    db.automationEngagementJob.create.mockRejectedValue({ code: "P2002" });
    expect(await beginEmailRequest("a1", "r1", "flow", now)).toEqual({ kind: "waiting" });
  });
  it("claims a reminder once, sends saved buttons, then records terminal state", async () => {
    expect(await processAutomationFollowUps(now)).toEqual({ checked: 1, sent: 1 });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ responseFormat: "LINK", message: "Your link", recipientId: "r1", linkButtons: [{ label: "Open", url: "https://ap3k.com" }] }));
    expect(db.automationEngagementJob.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "COMPLETED" } }));
  });
  it.each(["replied", "human", "quota", "paused", "disconnected", "claimed"])("cancels delivery when %s", async reason => {
    if (reason === "replied") db.conversation.findUnique.mockResolvedValue({ lastInboundAt: new Date(now.getTime() - 1000) });
    if (reason === "human") db.inboxMessage.findFirst.mockResolvedValue({ id: "manual" });
    if (reason === "quota") quota.mockResolvedValue({ ok: false });
    if (reason === "paused") db.automation.findUnique.mockResolvedValue({ active: false });
    if (reason === "disconnected") db.automation.findUnique.mockResolvedValue({ active: true, integration: { status: "DISCONNECTED" } });
    if (reason === "claimed") db.automationEngagementJob.updateMany.mockResolvedValue({ count: 0 });
    expect((await processAutomationFollowUps(now)).sent).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
  it("does not retry an ambiguous Meta failure", async () => {
    send.mockRejectedValue(new Error("timeout"));
    await processAutomationFollowUps(now);
    expect(send).toHaveBeenCalledTimes(1);
    expect(db.automationEngagementJob.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "job-1" }), data: { status: "FAILED" } }));
  });
});
