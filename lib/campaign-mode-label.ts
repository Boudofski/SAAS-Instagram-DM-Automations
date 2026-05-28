export function getCampaignModeLabel(externalDm: boolean, appReviewMode = false) {
  if (appReviewMode) {
    return externalDm
      ? { short: "Public", full: "Public reply mode" }
      : { short: "Public", full: "Public reply active" };
  }

  return externalDm
    ? { short: "External", full: "External DM" }
    : { short: "AP3k", full: "AP3k DM" };
}
