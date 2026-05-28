import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { filterAppReviewActivity, groupCampaignActivity } from "./campaign-activity-format";
import { getCampaignModeLabel } from "./campaign-mode-label";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("App Review-safe UX", () => {
  it("keeps account debug labels behind review mode conditionals", () => {
    const source = readRepoFile("app/(protected)/dashboard/[slug]/account/page.tsx");

    expect(source).toContain("Profile sync debug");
    expect(source).toContain("const showProfileSyncDebug = !appReviewMode");
    expect(source).toContain('ReviewStatusCard label="Instagram connected"');
    expect(source).toContain('ReviewStatusCard label="Comments active"');
    expect(source).toContain('ReviewStatusCard label="Public replies active"');
    expect(source).not.toContain("Private replies pending Meta approval");
  });

  it("filters failed and skipped technical activity from review-mode recent activity", () => {
    const grouped = groupCampaignActivity([
      event("COMMENT_RECEIVED"),
      event("KEYWORD_MATCHED", { keyword: "guide" }),
      event("PUBLIC_REPLY_SENT", { meta: { sourceCommentId: "comment-1" } }),
      event("DM_SKIPPED", { errorMessage: "external_dm_tool_enabled", meta: { sourceCommentId: "comment-2" } }),
      event("DM_FAILED", { errorMessage: "dm_capability_missing", meta: { sourceCommentId: "comment-3" } }),
      event("COMMENT_RECEIVED", { meta: { sourceCommentId: "comment-4" } }),
    ]);

    const review = filterAppReviewActivity(grouped);

    expect(review.length).toBeGreaterThan(0);
    expect(review.map((item) => `${item.title} ${item.subtitle}`).join(" ")).not.toMatch(/skipped|failed|blocked|no trigger/i);
  });

  it("hides External DM wording from campaign labels in review mode", () => {
    expect(getCampaignModeLabel(true)).toEqual({ short: "External", full: "External DM" });
    expect(getCampaignModeLabel(true, true)).toEqual({ short: "Public", full: "Public reply mode" });
  });

  it("keeps normal operational controls while adding review-mode guards", () => {
    const account = readRepoFile("app/(protected)/dashboard/[slug]/account/page.tsx");
    const settings = readRepoFile("app/(protected)/dashboard/[slug]/settings/page.tsx");

    expect(account).toContain("AccountConnectionActions");
    expect(account).toContain("!appReviewMode");
    expect(settings).toContain("MCP / Personal Access Tokens");
    expect(settings).toContain("!appReviewMode");
  });

  it("uses review-safe landing copy in review mode", () => {
    const source = readRepoFile("app/(website)/page.tsx");

    expect(source).toContain("Official Meta Login");
    expect(source).toContain("Launch Instagram comment automations that receive real comments");
    expect(source).toContain("Connect Instagram");
    expect(source).toContain("Send public replies");
  });

  it("uses review-safe billing and campaign wording in review mode", () => {
    const billing = readRepoFile("components/global/billing/index.tsx");
    const paymentCard = readRepoFile("components/global/billing/payment-card.tsx");
    const campaignNew = readRepoFile("app/(protected)/dashboard/[slug]/automation/new/page.tsx");
    const sidebar = readRepoFile("components/global/sidebar/index.tsx");

    expect(billing).toContain("Successful public replies count toward your monthly limit.");
    expect(paymentCard).toContain("5,000 public replies/month");
    expect(campaignNew).toContain("Public reply mode");
    expect(campaignNew).toContain("AP3k listens for matching comments, sends public replies, and tracks leads.");
    expect(sidebar).toContain("Unlock more public replies and campaigns");
  });
});

function event(type: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `${type}-${Math.random()}`,
    type,
    commentId: "comment-1",
    mediaId: "media-1",
    igUserId: "user-1",
    createdAt: new Date("2026-05-28T10:00:00Z"),
    ...overrides,
  };
}
