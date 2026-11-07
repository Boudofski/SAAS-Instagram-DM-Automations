import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), findFirst: vi.fn(), suppression: vi.fn(), count: vi.fn(), send: vi.fn(), slot: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ client: { user: { findMany: mocks.findMany, findFirst: mocks.findFirst }, emailDelivery: { findFirst: mocks.suppression, count: mocks.count } } }));
vi.mock("./delivery", () => ({ getEmailConfiguration: () => ({ configured: true, webhookConfigured: true }), sendAp3kEmail: mocks.send }));
vi.mock("@/lib/marketing/delivery", () => ({ takeMarketingSlot: mocks.slot }));
import { onboardingEligibility, processOnboardingReminders } from "./onboarding";
import { AP3K_TUTORIAL_URL, buildEmailTemplate } from "./catalog";

beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("AP3K_ONBOARDING_ENABLED", "true"); mocks.slot.mockResolvedValue(true); mocks.findMany.mockResolvedValue([{ id: "u1" }]); mocks.findFirst.mockResolvedValue({ id: "u1", clerkId: "user_1", email: "customer@example.com", firstname: "Sam" }); mocks.suppression.mockResolvedValue(null); mocks.count.mockResolvedValue(0); mocks.send.mockResolvedValue({ ok: true, status: "sent" }); });
describe("onboarding delivery safeguards", () => {
  it("selects active never-connected accounts at least one day old and honors opt-outs/history", () => {
    const filter = onboardingEligibility(new Date("2026-11-07T12:00:00Z"));
    expect(filter.status).toBe("ACTIVE");
    expect(filter.createdAt).toEqual({ lte: new Date("2026-11-06T12:00:00Z") });
    expect(filter.integrations).toEqual({ none: { name: "INSTAGRAM" } });
    expect(JSON.stringify(filter)).toContain('"productTips":true');
    expect(JSON.stringify(filter)).toContain('"connect_instagram"');
    expect(JSON.stringify(filter)).toContain('"COMPLAINED"');
  });
  it("does not send from previews", async () => { vi.stubEnv("VERCEL_ENV", "preview"); expect((await processOnboardingReminders()).enabled).toBe(false); expect(mocks.send).not.toHaveBeenCalled(); });
  it("does not overlap another batch", async () => { mocks.slot.mockResolvedValue(false); await processOnboardingReminders(); expect(mocks.findMany).not.toHaveBeenCalled(); });
  it("rechecks eligibility when an account connected or opted out after selection", async () => { mocks.findFirst.mockResolvedValue(null); expect((await processOnboardingReminders()).skipped).toBe(1); expect(mocks.send).not.toHaveBeenCalled(); });
  it("does not send to a suppressed address", async () => { mocks.suppression.mockResolvedValue({ id: "bounce" }); await processOnboardingReminders(); expect(mocks.send).not.toHaveBeenCalled(); });
  it("reserves transactional capacity", async () => { mocks.count.mockResolvedValue(80); expect((await processOnboardingReminders()).deferred).toBe(1); expect(mocks.send).not.toHaveBeenCalled(); });
  it("honors the daily reminder cap", async () => { mocks.slot.mockResolvedValueOnce(true).mockResolvedValueOnce(false); await processOnboardingReminders(); expect(mocks.send).not.toHaveBeenCalled(); });
  it("uses a stable per-user key and records campaign attribution", async () => { expect((await processOnboardingReminders()).sent).toBe(1); expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: "connect-instagram:v1:u1", userId: "u1", metadata: { source: "onboarding", campaign: "connect-instagram-v1" } })); });
  it("stops a batch on provider failure", async () => { mocks.send.mockResolvedValue({ ok: false, status: "failed" }); expect((await processOnboardingReminders()).failed).toBe(1); });
  it("includes the exact tutorial in welcome and reminder without promising a sale", () => { for (const id of ["welcome", "connect_instagram"] as const) { const email = buildEmailTemplate(id, {}, "https://ap3k.com"); expect(email.secondaryCta?.url).toBe(AP3K_TUTORIAL_URL); expect(email.cta?.url).toBe("https://ap3k.com/dashboard"); expect(email.callout?.text).toContain("500"); } });
});
