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

    expect(navbar).toContain("pathname === `/dashboard/${slug}/automation`");
    expect(navbar).toContain("!isCampaignList && <CreateAutomation");
  });

  it("uses customer-facing reply and lead terminology without renaming internal metrics", () => {
    const dashboard = source("app/(protected)/dashboard/[slug]/page.tsx");

    expect(dashboard).toContain('label="Public replies"');
    expect(dashboard).toContain('stat.label === "Leads"');
    expect(dashboard).toContain("usage.staticReplies");
  });
});
