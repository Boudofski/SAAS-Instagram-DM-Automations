import { describe, it, expect } from "vitest";
import { defaultEmailPlan, parseEmailPlan } from "./autopilot-policy";
import { marketingEmail } from "./content";

describe("email autopilot boundaries", () => {
  it("accepts only approved variants and bounded delays", () => {
    const plan = defaultEmailPlan();
    plan.ecommerce_test = { variant: "checklist", delayHours: 6 };
    expect(parseEmailPlan(plan)).toEqual(plan);
    expect(parseEmailPlan({ ...plan, creator_test: { variant: "invented", delayHours: 0 } })).toBeNull();
    expect(parseEmailPlan({ ...plan, creator_test: { variant: "standard", delayHours: -1 } })).toBeNull();
    expect(parseEmailPlan({ ...plan, creator_test: { variant: "standard", delayHours: 24 } })).toBeNull();
    expect(parseEmailPlan({ ...plan, creator_test: { variant: "standard", delayHours: "6" } })).toBeNull();
    expect(parseEmailPlan({ ...plan, creator_test: { variant: "standard", delayHours: 0, url: "https://evil.example" } })).toBeNull();
    expect(parseEmailPlan({ creator_test: plan.creator_test })).toBeNull();
    expect(parseEmailPlan(null)).toBeNull();
  });
  it("keeps confirmation and promised kit independent of AI choices", () => {
    for (const stage of ["confirm", "kit"] as const) {
      expect(marketingEmail(stage, "creator", "https://ap3k.com/confirm", "https://ap3k.com/unsubscribe", "checklist"))
        .toEqual(marketingEmail(stage, "creator", "https://ap3k.com/confirm", "https://ap3k.com/unsubscribe"));
    }
  });
  it("retains identity, opt-out and end-of-series notice in every approved variant", () => {
    for (const audience of ["creator", "ecommerce"]) for (const variant of ["standard", "checklist"] as const) {
      for (const stage of ["test", "launch"] as const) {
        const mail = marketingEmail(stage, audience, "", "https://ap3k.com/unsubscribe", variant);
        expect(mail.text).toContain("Unsubscribe: https://ap3k.com/unsubscribe");
        expect(mail.html).toContain("AP3K LLC");
        expect(mail.text).not.toMatch(/guaranteed|limited.time|50% off/i);
        if (stage === "launch") expect(mail.text).toMatch(/(last|final) email/i);
      }
    }
  });
});
