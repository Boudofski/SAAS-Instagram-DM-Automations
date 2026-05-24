import { describe, expect, it } from "vitest";
import {
  formatActivityDisplay,
  formatRecentActivity,
  formatLogError,
  getCampaignModeLabels,
  getReviewerTestCopy,
  groupCampaignActivity,
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
      actor: "Instagram user tester",
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
    expect(formatRecentActivity({ type: "SELF_COMMENT_SKIPPED", igUserId: "989376730302391", meta: { commenterUsername: "maglobalmarketing" } })).toMatchObject({
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

  it("groups comment received, trigger matched, public reply sent, and DM skipped into one activity", () => {
    const grouped = groupCampaignActivity([
      event("COMMENT_RECEIVED"),
      event("KEYWORD_MATCHED", { keyword: "ai" }),
      event("PUBLIC_REPLY_SENT", { commentId: "reply-1", meta: { sourceCommentId: "comment-1", publicReplyCommentId: "reply-1" } }),
      event("DM_SKIPPED", { errorMessage: "external_dm_tool_enabled" }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      title: "Comment handled successfully",
      subtitle: "Public reply sent · Private DM skipped",
      badge: "SENT",
      tone: "green",
      steps: expect.objectContaining({ commentReceived: true, triggerMatched: true, publicReply: "sent", privateDm: "off" }),
    });
  });

  it("uses commenterUsername for actor labels", () => {
    const grouped = groupCampaignActivity([
      event("COMMENT_RECEIVED", {
        igUserId: "989376730302391",
        meta: { commenterUsername: "real_user" },
      }),
    ]);

    expect(grouped[0].actorLabel).toBe("@real_user");
    expect(grouped[0].details.commenterUsername).toBe("real_user");
  });

  it("falls back to shortened Instagram user ID and keeps full ID in details", () => {
    const grouped = groupCampaignActivity([
      event("COMMENT_RECEIVED", { igUserId: "989376730302391" }),
    ]);

    expect(grouped[0].actorLabel).toBe("Instagram user 9893…2391");
    expect(grouped[0].details.igUserId).toBe("989376730302391");
  });

  it("includes public reply metadata and visibility helper when Meta confirms reply ID", () => {
    const grouped = groupCampaignActivity([
      event("PUBLIC_REPLY_SENT", {
        commentId: "reply-1",
        meta: {
          sourceCommentId: "comment-1",
          publicReplyCommentId: "reply-1",
          endpoint: "threaded_reply",
          replyTextPreview: "Thanks, sent it.",
        },
      }),
    ]);

    expect(grouped[0].details.publicReplyCommentId).toBe("reply-1");
    expect(grouped[0].details.endpoint).toBe("threaded_reply");
    expect(grouped[0].details.replyTextPreview).toBe("Thanks, sent it.");
    expect(grouped[0].details.visibilityHelper).toContain("Meta confirmed the reply");
  });

  it("groups public reply sent and DM code=3 as one partial activity", () => {
    const grouped = groupCampaignActivity([
      event("COMMENT_RECEIVED"),
      event("KEYWORD_MATCHED", { keyword: "ai" }),
      event("PUBLIC_REPLY_SENT", { commentId: "reply-1", meta: { sourceCommentId: "comment-1", publicReplyCommentId: "reply-1" } }),
      event("DM_FAILED", { errorMessage: "dm_capability_missing" }),
      event("REAL_COMMENT_EVENT", { status: "FAILED", errorMessage: "dm_failed: dm_capability_missing", source: "webhook" }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      title: "Comment partially handled",
      badge: "PARTIAL",
      tone: "amber",
      steps: expect.objectContaining({ publicReply: "sent", privateDm: "blocked" }),
    });
  });

  it("deduplicates repeated raw events for the same commentId", () => {
    const grouped = groupCampaignActivity([
      event("COMMENT_RECEIVED"),
      event("COMMENT_RECEIVED"),
      event("KEYWORD_MATCHED"),
    ]);

    expect(grouped).toHaveLength(1);
  });

  it("groups self-comment, usage-limit, public-off, and no-match cases", () => {
    expect(groupCampaignActivity([event("SELF_COMMENT_SKIPPED")])[0]).toMatchObject({
      title: "Ignored self-comment from connected account",
      badge: "SKIPPED",
    });
    expect(groupCampaignActivity([event("COMMENT_SKIPPED", { errorMessage: "static_reply_limit_reached" })])[0]).toMatchObject({
      title: "Monthly reply limit reached",
      badge: "LIMIT",
    });
    expect(groupCampaignActivity([
      event("KEYWORD_MATCHED"),
      event("COMMENT_SKIPPED", { errorMessage: "public_reply_disabled" }),
      event("DM_SKIPPED", { errorMessage: "external_dm_tool_enabled" }),
    ])[0]).toMatchObject({
      title: "Comment matched · no outbound action",
      badge: "SKIPPED",
    });
    expect(groupCampaignActivity([event("COMMENT_RECEIVED")])[0]).toMatchObject({
      title: "Comment received · no trigger match",
      badge: "NO MATCH",
    });
  });

  it("shows old/historical DM failure copy when private DM is currently off", () => {
    expect(groupCampaignActivity([
      event("KEYWORD_MATCHED"),
      event("DM_FAILED", { errorMessage: "dm_capability_missing" }),
    ], { privateDmEnabled: false })[0]).toMatchObject({
      title: "Older DM attempt blocked by Meta",
      badge: "OLD",
    });
  });

  it("limits to latest 20 grouped interactions instead of raw 20 events", () => {
    const raw = Array.from({ length: 25 }).flatMap((_, index) => [
      event("COMMENT_RECEIVED", { commentId: `comment-${index}`, createdAt: new Date(2026, 4, 24, 10, index).toISOString() }),
      event("KEYWORD_MATCHED", { commentId: `comment-${index}`, createdAt: new Date(2026, 4, 24, 10, index, 1).toISOString() }),
    ]);

    const grouped = groupCampaignActivity(raw, { limit: 20 });

    expect(grouped).toHaveLength(20);
    expect(new Set(grouped.map((item) => item.commentId)).size).toBe(20);
  });
});

function event(type: string, overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? `${type}-1`,
    type,
    status: overrides.status,
    keyword: overrides.keyword,
    errorMessage: overrides.errorMessage,
    meta: overrides.meta,
    source: overrides.source,
    igUserId: overrides.igUserId ?? "tester",
    mediaId: overrides.mediaId ?? "media-1",
    commentId: overrides.commentId ?? "comment-1",
    createdAt: overrides.createdAt ?? "2026-05-24T20:00:00Z",
  };
}
