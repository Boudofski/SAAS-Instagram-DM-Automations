import { describe, expect, it } from "vitest";
import {
  formatActivityDisplay,
  formatRecentActivity,
  formatLogError,
  getCampaignModeLabels,
  getReviewerTestCopy,
  isWeakPublicReply,
} from "@/lib/campaign-activity-format";

describe("campaign activity display formatting", () => {
  it("displays dm_capability_missing on real comments as partial warning", () => {
    expect(
      formatActivityDisplay({
        type: "REAL_COMMENT_EVENT",
        status: "FAILED",
        errorMessage: "dm_failed: dm_capability_missing",
      })
    ).toMatchObject({
      label: "Comment processed · DM blocked by Meta",
      badge: "PARTIAL",
      tone: "amber",
      technical: true,
    });
  });

  it("does not show DM blocked as current when private DM is off", () => {
    expect(
      formatActivityDisplay({
        type: "DM_FAILED",
        errorMessage: "dm_capability_missing",
        privateDmEnabled: false,
      })
    ).toMatchObject({
      label: "Old private DM failure before DM was turned off",
      badge: "OLD",
      tone: "slate",
    });
  });

  it("displays SELF_COMMENT_SKIPPED as skipped, not failed", () => {
    expect(formatActivityDisplay({ type: "SELF_COMMENT_SKIPPED" })).toMatchObject({
      label: "Ignored self-comment from connected account",
      badge: "SKIPPED",
      tone: "amber",
    });
  });

  it("displays static reply limit as usage limit", () => {
    expect(
      formatActivityDisplay({
        type: "COMMENT_SKIPPED",
        errorMessage: "static_reply_limit_reached",
      })
    ).toMatchObject({
      label: "Skipped — monthly static reply limit reached",
      badge: "LIMIT",
      tone: "amber",
    });
  });

  it("displays duplicate_comment_webhook as duplicate ignored", () => {
    expect(
      formatActivityDisplay({
        type: "COMMENT_SKIPPED",
        errorMessage: "duplicate_comment_webhook",
      })
    ).toMatchObject({
      label: "Duplicate webhook ignored",
      badge: "SKIPPED",
      tone: "slate",
    });
  });

  it("formats Meta code=3 as capability missing", () => {
    expect(formatLogError("Meta error code=3")).toBe(
      "Meta blocked private DM until instagram_manage_messages capability is approved."
    );
  });

  it("changes reviewer copy based on private DM mode", () => {
    expect(getReviewerTestCopy(true)).toContain("AP3k will attempt private DM through Meta");
    expect(getReviewerTestCopy(false)).toContain("AP3k will skip private DM");
  });

  it("displays campaign modes from saved database values", () => {
    expect(getCampaignModeLabels({ sendPrivateDm: false, publicReplyCount: 0 })).toEqual({
      publicReply: "Off",
      privateDm: "Off — external tool",
    });
  });

  it("formats recent public replies and skipped DMs cleanly", () => {
    expect(formatRecentActivity({ type: "PUBLIC_REPLY_SENT", igUserId: "tester", commentId: "180123456789" })).toMatchObject({
      title: "Public reply sent",
      actor: "@tester",
      tone: "green",
    });
    expect(formatRecentActivity({ type: "DM_SKIPPED", errorMessage: "external_dm_tool_enabled" })).toMatchObject({
      title: "Private DM skipped",
      tone: "amber",
    });
  });

  it("formats recent capability failures, self-comments, triggers, and comments", () => {
    expect(formatRecentActivity({ type: "DM_FAILED", errorMessage: "dm_capability_missing" })).toMatchObject({
      title: "Private DM blocked by Meta",
      tone: "red",
    });
    expect(formatRecentActivity({ type: "SELF_COMMENT_SKIPPED", igUserId: "maglobalmarketing" })).toMatchObject({
      title: "Ignored self-comment",
      actor: "@maglobalmarketing",
    });
    expect(formatRecentActivity({ type: "KEYWORD_MATCHED", keyword: "ai" })).toMatchObject({
      title: "Trigger matched",
      subtitle: "Keyword \"ai\" → post comments",
      tone: "purple",
    });
    expect(formatRecentActivity({ type: "COMMENT_RECEIVED" })).toMatchObject({
      title: "Comment received",
      tone: "blue",
    });
  });

  it("classifies weak public replies", () => {
    expect(isWeakPublicReply("🔥🔥")).toBe(true);
    expect(isWeakPublicReply("تم إرسال الرابط الآن")).toBe(false);
    expect(isWeakPublicReply("تم الإرسال 🔥")).toBe(false);
  });
});
