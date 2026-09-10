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

  it("presents the free plan as zero dollars without a billing interval", () => {
    const pricing = source("components/global/pricing-experience.tsx");
    const paymentCard = source("components/global/billing/payment-card.tsx");
    expect(pricing).toContain("$0");
    expect(pricing).not.toContain("Free forever");
    expect(pricing).toContain("No credit card required");
    expect(paymentCard).toContain("$0");
    expect(paymentCard).not.toContain("Free forever");
    expect(paymentCard).not.toContain("$0/month");
  });

  it("keeps plan entitlements aligned with the product model", () => {
    expect(getPlanLimits("FREE")).toMatchObject({ connectedInstagramAccounts: 1, activeCampaigns: 5, staticRepliesPerMonth: 500, aiRepliesPerMonth: 0 });
    expect(getPlanLimits("PRO")).toMatchObject({ connectedInstagramAccounts: 1, staticRepliesPerMonth: 5000 });
    expect(getPlanLimits("BUSINESS")).toMatchObject({ connectedInstagramAccounts: 1, staticRepliesPerMonth: 20000 });
  });

  it("keeps automation workspaces inside the desktop viewport", () => {
    const commentWizard = source("app/(protected)/dashboard/[slug]/automation/new/page.tsx");
    const messageWizard = source("components/automations/message-automation-wizard.tsx");
    const detail = source("app/(protected)/dashboard/[slug]/automation/[id]/page.tsx");

    for (const file of [commentWizard, messageWizard, detail]) {
      expect(file).toContain("xl:h-[calc(100dvh-7rem)]");
      expect(file).not.toContain("xl:h-[calc(100dvh-2.5rem)]");
    }
  });

  it("starts every new comment automation action disabled", () => {
    const wizard = source("hooks/use-wizard.ts");
    expect(wizard).toContain("sendPrivateDm: false");
    expect(wizard).toContain("publicReplyEnabled: false");
    expect(wizard).toContain("aiReplyEnabled: false");
    expect(wizard).toContain("openingDmEnabled: false");
  });

  it("shows the saved DM AI mode on automation details", () => {
    const detail = source("app/(protected)/dashboard/[slug]/automation/[id]/page.tsx");
    expect(detail).toContain("automation.listener?.aiDmReplyEnabled === true");
    expect(detail).toContain('title={aiDmReplyEnabled ? "AP3K AI reply"');
    expect(detail).toContain('isMessageAutomation ? aiDmReplyEnabled ? "Enabled"');
  });

  it("labels AI DM automations accurately in the automation table", () => {
    const table = source("components/dashboard/automation-table.tsx");
    expect(table).toContain('automation.listener?.aiDmReplyEnabled ? "AI DM replies active"');
    expect(table).toContain("{modeLabel}");
  });
});
