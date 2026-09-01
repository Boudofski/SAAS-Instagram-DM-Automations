import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PLAN_CARDS, checkoutHref } from "@/lib/billing-plans";

describe("Stripe checkout routing", () => {
  it("presents Free as an interval-independent allowance, not a zero-dollar bill", () => {
    const free = PLAN_CARDS.find((plan) => plan.id === "FREE");

    expect(free?.description).toContain("keep using it free");
    expect(free?.features).toContain("500 replies during your 14-day launch trial");
    expect(free?.features).toContain("Then 50 automated replies every month");

    const source = fs.readFileSync(
      path.join(process.cwd(), "components/global/pricing-experience.tsx"),
      "utf8"
    );
    expect(source).toContain("Free forever");
    expect(source).not.toContain('plan.id === "FREE" && <p');
  });

  it("builds checkout routes for every paid plan and billing interval", () => {
    expect(checkoutHref("PRO", "month")).toBe("/payment?plan=pro&interval=month");
    expect(checkoutHref("PRO", "year")).toBe("/payment?plan=pro&interval=year");
    expect(checkoutHref("BUSINESS", "month")).toBe("/payment?plan=business&interval=month");
    expect(checkoutHref("BUSINESS", "year")).toBe("/payment?plan=business&interval=year");
  });

  it("keeps Next.js redirect outside the Stripe session try/catch", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/(protected)/payment/page.tsx"),
      "utf8"
    );

    const createSessionIndex = source.indexOf("stripe.checkout.sessions.create");
    const catchIndex = source.indexOf("} catch (err) {", createSessionIndex);
    const redirectIndex = source.indexOf("if (checkoutUrl) redirect(checkoutUrl);");

    expect(createSessionIndex).toBeGreaterThan(-1);
    expect(catchIndex).toBeGreaterThan(createSessionIndex);
    expect(redirectIndex).toBeGreaterThan(catchIndex);
    expect(source.slice(createSessionIndex, catchIndex)).not.toContain("redirect(");
  });
});
