import { describe, expect, it } from "vitest";
import { getCampaignModeLabel } from "@/lib/campaign-mode-label";

describe("campaign table display helpers", () => {
  it("returns non-wrapping short labels for campaign modes", () => {
    expect(getCampaignModeLabel(true)).toEqual({ short: "External", full: "External DM" });
    expect(getCampaignModeLabel(false)).toEqual({ short: "AP3k", full: "AP3k DM" });
  });
});
