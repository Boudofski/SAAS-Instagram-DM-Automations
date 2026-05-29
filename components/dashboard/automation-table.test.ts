import { describe, expect, it } from "vitest";
import { getCampaignModeLabel } from "@/lib/campaign-mode-label";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("campaign table display helpers", () => {
  it("returns non-wrapping short labels for campaign modes", () => {
    expect(getCampaignModeLabel(true)).toEqual({ short: "External", full: "External DM" });
    expect(getCampaignModeLabel(false)).toEqual({ short: "AP3k", full: "AP3k DM" });
  });

  it("does not label needs-review campaigns as public-reply active in review mode", () => {
    const source = readFileSync(join(process.cwd(), "components/dashboard/automation-table.tsx"), "utf8");

    expect(source).toContain('"Public reply configured"');
    expect(source).toContain("!appReviewMode ? { label: hasPublicReply ? \"Public reply on\"");
    expect(source).toContain("xl:overflow-x-visible");
  });
});
