import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("production polish UI contracts", () => {
  it("keeps essential motion content visible before intersection and respects reduced motion", () => {
    const motion = source("components/global/motion/fade-in.tsx");

    expect(motion).toContain("useReducedMotion");
    expect(motion).not.toMatch(/opacity:\s*0/);
    expect(motion).toContain("initial={reduceMotion ? false");
  });

  it("uses one provider-managed authentication section without duplicate sign-out or password fields", () => {
    const settings = source("app/(protected)/dashboard/[slug]/settings/page.tsx");
    const manager = source("components/settings/manage-sign-in-settings.tsx");

    expect(settings).toContain('label="Account & authentication"');
    expect(settings).not.toContain("Current password");
    expect(settings).not.toContain("New password");
    expect(settings).not.toContain("SignOutButton");
    expect(manager).toContain("openUserProfile()");
    expect(manager).toContain("Manage sign-in settings");
  });

  it("hides the global create CTA only on the campaign list route", () => {
    const navbar = source("components/global/navbar/index.tsx");
    const dashboard = source("app/(protected)/dashboard/[slug]/page.tsx");

    expect(navbar).toContain("pathname === `/dashboard/${slug}/automation`");
    expect(navbar).toContain("!isCampaignList && <CreateAutomation");
    expect(dashboard).not.toContain("+ Create campaign");
    expect(dashboard).toContain('ctaLabel="Launch first campaign →"');
    expect(dashboard).toContain('href={`/dashboard/${params.slug}/automation`}');
  });

  it("uses the shared non-error account-limit presentation on Home and Billing", () => {
    const dashboard = source("app/(protected)/dashboard/[slug]/page.tsx");
    const billing = source("components/global/billing/index.tsx");

    expect(dashboard).toContain('getBillingUsagePresentation(usage.connectedAccounts, "accounts")');
    expect(dashboard).toContain("tone={connectedAccountPresentation?.tone}");
    expect(billing).toContain("getBillingUsagePresentation(metric, kind, helper)");
  });

  it("derives public and authenticated campaign-limit copy from shared limits", () => {
    const landing = source("app/(website)/page.tsx");
    const pricing = source("app/(website)/pricing/page.tsx");
    const billing = source("components/global/billing/index.tsx");
    const paymentCard = source("components/global/billing/payment-card.tsx");

    expect(landing).toContain('formatCampaignLimitFeature(getPlanLimits("PRO").activeCampaigns)');
    expect(pricing).toContain('formatCampaignLimitFeature(getPlanLimits("PRO").activeCampaigns)');
    expect(billing).toContain('campaignLimit={current === "PRO" ? usage?.activeCampaigns.limit : undefined}');
    expect(paymentCard).toContain("formatCampaignLimitFeature(campaignLimit ?? defaultCampaignLimit)");
    expect(paymentCard).toContain('appReviewMode && label === "PRO"');
    expect(paymentCard).toContain('? [campaignFeature, "5,000 public replies/month", "Lead export", "Analytics"]');
    expect(paymentCard).not.toContain('["Unlimited campaigns"');
  });

  it("labels the mobile navigation trigger on the actual button", () => {
    const navbar = source("components/global/navbar/index.tsx");
    const sheet = source("components/global/sheet/index.tsx");

    expect(navbar).toContain('triggerLabel="Open navigation"');
    expect(sheet).toContain("aria-label={triggerLabel}");
    expect(sheet).toContain("h-11 w-11");
    expect(sheet).toContain('<SheetTitle className="sr-only">');
  });

  it("uses customer-facing reply and lead terminology without renaming internal metrics", () => {
    const dashboard = source("app/(protected)/dashboard/[slug]/page.tsx");

    expect(dashboard).toContain('label="Public replies"');
    expect(dashboard).toContain('stat.label === "Leads"');
    expect(dashboard).toContain("usage.staticReplies");
  });

  it("positions the featured pricing badge outside the clipping card layer", () => {
    const pricingCard = source("components/global/pricing-card/index.tsx");

    expect(pricingCard).toContain('<div className="relative overflow-visible">');
    expect(pricingCard).toContain("top-0 z-20 -translate-x-1/2 -translate-y-1/2");
    expect(pricingCard).toContain('"relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl p-7 transition-all duration-300"');
    expect(pricingCard).not.toContain("absolute -top-3");
  });
});
