export function formatAppReviewActivitySubtitle(subtitle: string, appReviewMode = false) {
  if (!appReviewMode) return subtitle;

  return subtitle
    .replace(/Trigger matched "([^"]+)"/gi, (_match, keyword: string) => `Trigger matched keyword "${keyword.toLowerCase()}"`)
    .replace(/^Keyword "([^"]+)"/gi, (_match, keyword: string) => `Keyword "${keyword.toLowerCase()}"`);
}
