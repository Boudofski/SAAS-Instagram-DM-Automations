import { describe, expect, it } from "vitest";
import { suggestPublicPlan } from "./pricing-plan-fit";

describe("public pricing plan fit", () => {
  const free = { actions: 500, accounts: 1, automations: 5, paidFeatures: false };
  it("keeps visitors on Free at the exact included usage and picks Pro if a free limit is exceeded", () => {
    expect(suggestPublicPlan(free)).toBe("FREE");
    expect(suggestPublicPlan({ ...free, actions: 501 })).toBe("PRO");
    expect(suggestPublicPlan({ ...free, accounts: 2 })).toBe("PRO");
    expect(suggestPublicPlan({ ...free, automations: 6 })).toBe("PRO");
    expect(suggestPublicPlan({ ...free, paidFeatures: true })).toBe("PRO");
  });
  it("requires Business only after exceeding Pro and never recommends a plan above public capacity", () => {
    expect(suggestPublicPlan({ ...free, actions: 5_000, accounts: 3 })).toBe("PRO");
    expect(suggestPublicPlan({ ...free, actions: 5_001 })).toBe("BUSINESS");
    expect(suggestPublicPlan({ ...free, accounts: 4 })).toBe("BUSINESS");
    expect(suggestPublicPlan({ ...free, actions: 20_000, accounts: 6 })).toBe("BUSINESS");
    expect(suggestPublicPlan({ ...free, actions: 20_001 })).toBeNull();
    expect(suggestPublicPlan({ ...free, accounts: 7 })).toBeNull();
  });
});
