import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyMessagingReviewCampaignDefaults,
  DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY,
  getMetaBusinessOAuthScopes,
  isMessagingReviewMode,
} from "@/lib/messaging-review-mode";

describe("messaging review mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not request instagram_manage_messages by default", () => {
    vi.stubEnv("NEXT_PUBLIC_MESSAGING_REVIEW_MODE", "false");

    expect(isMessagingReviewMode()).toBe(false);
    expect(getMetaBusinessOAuthScopes()).not.toContain(
      "instagram_manage_messages"
    );
    expect(getMetaBusinessOAuthScopes()).toContain(
      "instagram_manage_comments"
    );
  });

  it("adds instagram_manage_messages only when the flag is exactly true", () => {
    vi.stubEnv("NEXT_PUBLIC_MESSAGING_REVIEW_MODE", "true");

    expect(isMessagingReviewMode()).toBe(true);
    expect(getMetaBusinessOAuthScopes()).toContain(
      "instagram_manage_messages"
    );

    vi.stubEnv("NEXT_PUBLIC_MESSAGING_REVIEW_MODE", "TRUE");
    expect(isMessagingReviewMode()).toBe(false);
  });

  it("populates the reviewer private reply default and enables an unprepared campaign", () => {
    expect(
      applyMessagingReviewCampaignDefaults(
        { sendPrivateDm: false, prompt: "" },
        true
      )
    ).toEqual({
      sendPrivateDm: true,
      prompt: DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY,
    });
  });

  it("preserves an existing private reply message", () => {
    expect(
      applyMessagingReviewCampaignDefaults(
        { sendPrivateDm: false, prompt: "Existing reviewer message" },
        true
      )
    ).toEqual({
      sendPrivateDm: true,
      prompt: "Existing reviewer message",
    });
  });

  it("does not prepare or enable private reply UI data when messaging review mode is off", () => {
    expect(
      applyMessagingReviewCampaignDefaults(
        { sendPrivateDm: false, prompt: "" },
        false
      )
    ).toEqual({ sendPrivateDm: false, prompt: "" });
  });

  it("renders the reviewer-facing configuration only in the messaging review branch", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "app/(protected)/dashboard/[slug]/automation/new/page.tsx"
      ),
      "utf8"
    );

    expect(source).toContain("messagingReviewMode ? (");
    expect(source).toContain("Private reply after comment");
    expect(source).toContain(
      "Send a private reply when someone comments the campaign keyword"
    );
    expect(source).toContain("Private reply message");
    expect(DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY).toBe(
      "Thanks for commenting. Here is the information you requested."
    );
    expect(source).toContain("DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY");
    expect(source).toContain(
      "AP3k sends one private reply only after a user comments the configured keyword."
    );
  });

  it("shows reviewer-friendly private reply activity and safe code 3 details", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "app/(protected)/dashboard/[slug]/automation/[id]/page.tsx"
      ),
      "utf8"
    );

    expect(source).toContain('label="Comment received"');
    expect(source).toContain('label="Keyword matched"');
    expect(source).toContain('label="Private reply attempted"');
    expect(source).toContain(
      "Private reply blocked by Meta capability until instagram_manage_messages is approved"
    );
    expect(source).toContain("META_CAPABILITY_PENDING_LABEL");
    expect(source).toContain("code: {item.details.metaError.code}");
    expect(source).toContain("type: {item.details.metaError.type}");
    expect(source).toContain("message: {item.details.metaError.message}");
    expect(source).not.toContain("item.details.metaError.access_token");
    expect(source).not.toContain("item.details.metaError.accessToken");
  });
});
