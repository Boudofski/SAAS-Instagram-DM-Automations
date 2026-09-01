import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getPlanLimits } from "@/lib/plan-limits";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("production polish UI contracts", () => {
  it("respects reduced-motion preferences for reveal animations", () => {
    const motion = source("components/global/motion/fade-in.tsx");
    expect(motion).toContain("useReducedMotion");
    expect(motion).toContain("initial={reduceMotion ? false");
    expect(motion).toContain("whileInView");
  });

  it("keeps authentication management inside Clerk", () => {
    const settings = source("app/(protected)/dashboard/[slug]/settings/page.tsx");
    const manager = source("components/settings/manage-sign-in-settings.tsx");
    expect(settings).not.toContain("Current password");
    expect(settings).not.toContain("SignOutButton");
    expect(manager).toContain("openUserProfile()");
    expect(manager).toContain("Manage sign-in settings");
  });

  it("keeps the mobile navigation accessible and branded", () => {
    const navbar = source("components/global/navbar/index.tsx");
    const sheet = source("components/global/sheet/index.tsx");
    expect(navbar).toContain('triggerLabel="Open navigation"');
    expect(navbar).toContain("<AP3KLogo");
    expect(sheet).toContain("aria-label={triggerLabel}");
    expect(sheet).toContain('<SheetTitle className="sr-only">');
  });

  it("presents the free plan without a misleading zero-dollar billing interval", () => {
    const pricing = source("components/global/pricing-experience.tsx");
    const paymentCard = source("components/global/billing/payment-card.tsx");
    expect(pricing).toContain("Free forever");
    expect(pricing).toContain("No credit card required");
    expect(paymentCard).toContain("Free forever");
    expect(paymentCard).not.toContain("$0/month");
  });

  it("keeps plan entitlements aligned with the product model", () => {
    expect(getPlanLimits("FREE")).toMatchObject({ connectedInstagramAccounts: 1, staticRepliesPerMonth: 50 });
    expect(getPlanLimits("PRO")).toMatchObject({ connectedInstagramAccounts: 1, staticRepliesPerMonth: 5000 });
    expect(getPlanLimits("BUSINESS")).toMatchObject({ connectedInstagramAccounts: 1, staticRepliesPerMonth: 20000 });
  });
});
