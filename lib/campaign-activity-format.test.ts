import { describe, expect, it } from "vitest";
import {
  formatActivityDisplay,
  formatLogError,
  getReviewerTestCopy,
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
});
