import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkoutHref } from "@/lib/billing-plans";

describe("Stripe checkout routing", () => {
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
