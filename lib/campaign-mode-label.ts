export function getCampaignModeLabel(externalDm: boolean) {
  return externalDm
    ? { short: "External", full: "External DM" }
    : { short: "AP3k", full: "AP3k DM" };
}
