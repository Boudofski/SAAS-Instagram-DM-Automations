import { afterEach, describe, expect, it, vi } from "vitest";
import { containsAppReviewUnsafeCopy, isAppReviewMode } from "./app-review-mode";

describe("app review mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is enabled only by NEXT_PUBLIC_APP_REVIEW_MODE=true", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_REVIEW_MODE", "true");
    expect(isAppReviewMode()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_APP_REVIEW_MODE", "false");
    expect(isAppReviewMode()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_APP_REVIEW_MODE", "TRUE");
    expect(isAppReviewMode()).toBe(false);
  });

  it("detects App Review unsafe landing copy", () => {
    expect(containsAppReviewUnsafeCopy("Meta review evidence and admin logs")).toBe(true);
    expect(containsAppReviewUnsafeCopy("Official Meta Login and public replies")).toBe(false);
  });
});
