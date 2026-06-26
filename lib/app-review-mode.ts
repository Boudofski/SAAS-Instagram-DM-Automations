export function isAppReviewMode() {
  return process.env.NEXT_PUBLIC_APP_REVIEW_MODE === "true";
}

export function shouldShowMetaPageSelection(eligiblePageCount: number) {
  return isAppReviewMode() || eligiblePageCount > 1;
}

export const APP_REVIEW_SUBMISSION_NOTES =
  "AP3k uses official Meta APIs. The screencast shows Meta Login, user permission grant, Instagram account connection, campaign creation, real Instagram comment webhook receipt, public reply sent with instagram_manage_comments, and activity/lead tracking inside AP3k. AP3k does not scrape Instagram and does not ask for Instagram passwords. Private replies are only enabled after instagram_manage_messages approval.";

const APP_REVIEW_FORBIDDEN_COPY = [
  "reviewer-ready",
  "admin logs",
  "Meta review evidence",
  "fallback path",
  "diagnostics",
  "code=3",
  "private DM workflow",
];

export function containsAppReviewUnsafeCopy(text: string) {
  const normalized = text.toLowerCase();
  return APP_REVIEW_FORBIDDEN_COPY.some((phrase) => normalized.includes(phrase.toLowerCase()));
}
