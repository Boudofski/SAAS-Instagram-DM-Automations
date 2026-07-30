import { afterEach, describe, expect, it, vi } from "vitest";
import {
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
});
