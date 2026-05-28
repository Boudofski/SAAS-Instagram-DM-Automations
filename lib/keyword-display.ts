export function formatKeywordDisplay(word: string, appReviewMode = false) {
  const normalized = word.trim().toLowerCase();
  if (!appReviewMode) return word;
  return normalized ? `Keyword: ${normalized}` : "Keyword";
}
