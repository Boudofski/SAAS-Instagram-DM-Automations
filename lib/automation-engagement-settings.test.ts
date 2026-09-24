import { describe, expect, it } from "vitest";
import { followUpEligible, parseEmailReply, validateEngagementSettings, MESSAGING_WINDOW_MS, messagingWindowOpen } from "./automation-engagement-settings";
import { normalizeCampaignPayload, validateNormalizedCampaignPayload } from "./campaign-save";

describe("engagement settings", () => {
  it("keeps existing campaigns off and rejects continuation without an opening DM", () => {
    expect(normalizeCampaignPayload({}).listener.emailCaptureEnabled).toBe(false);
    expect(validateEngagementSettings({ emailCaptureEnabled: true, emailCapturePrompt: "Email?" }, true, false)).toContain("Opening DM");
    expect(validateEngagementSettings({ followUpEnabled: true, followUpMessage: "Reminder", followUpDelayMinutes: 1440 }, true, true)).toContain("delay");
    expect(validateEngagementSettings({ followUpEnabled: true, followUpMessage: "Reminder", followUpDelayMinutes: 30 }, true, true)).toBeNull();
    const payload = normalizeCampaignPayload({ sendPrivateDm: true, listener: { emailCaptureEnabled: true, openingDmEnabled: false } });
    expect(validateNormalizedCampaignPayload(payload)).toContain("Opening DM");
  });
  it.each(["@example.com", "name@", "me@example.com and you@example.com", "hello <me@example.com>", ".me@example.com", "me..you@example.com", "a@-example.com", "a@example-.com", "hello\nme@example.com"])("does not incidentally collect %s", input => {
    expect(parseEmailReply(input)).toEqual({ kind: "invalid" });
  });
  it("normalizes email and recognizes opt-out commands", () => {
    expect(parseEmailReply(" Creator+Guide@Example.COM ")).toEqual({ kind: "email", email: "creator+guide@example.com" });
    expect(parseEmailReply(" SKIP ")).toEqual({ kind: "skip" });
    expect(parseEmailReply("Unsubscribe")).toEqual({ kind: "stop" });
  });
  it("fails closed at the messaging window boundary and on future timestamps", () => {
    const now = new Date("2026-09-24T05:00:00Z");
    expect(messagingWindowOpen(new Date(now.getTime() - MESSAGING_WINDOW_MS), now)).toBe(false);
    expect(messagingWindowOpen(new Date(now.getTime() + 1), now)).toBe(false);
    expect(messagingWindowOpen(new Date("invalid"), now)).toBe(false);
    expect(messagingWindowOpen(new Date(now.getTime() - MESSAGING_WINDOW_MS + 1), now)).toBe(true);
  });
  it("requires a due reminder, a live window and no later reply", () => {
    const now = new Date("2026-09-24T05:00:00Z"), inboundAt = new Date("2026-09-24T04:00:00Z");
    const job = { inboundAt, latestInboundAt: inboundAt, dueAt: new Date("2026-09-24T04:30:00Z"), expiresAt: new Date("2026-09-25T04:00:00Z") };
    expect(followUpEligible(job, now)).toBe(true);
    expect(followUpEligible({ ...job, latestInboundAt: new Date("2026-09-24T04:40:00Z") }, now)).toBe(false);
    expect(followUpEligible({ ...job, latestInboundAt: null }, now)).toBe(false);
    expect(followUpEligible({ ...job, dueAt: new Date("2026-09-24T06:00:00Z") }, now)).toBe(false);
  });
});
