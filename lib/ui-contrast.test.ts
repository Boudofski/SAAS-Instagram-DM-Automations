import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";
import path from "path";

const root = path.resolve(__dirname, "../");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf-8");
}

describe("light-mode contrast invariants", () => {
  it("onboarding layout uses correct dark bg (arbitrary value, not named token+opacity)", () => {
    const src = read("app/(protected)/onboarding/layout.tsx");
    expect(src).toContain("dark:text-rf-text");
    expect(src).toContain("dark:bg-[#0f172a]/78");
    // Named custom color + opacity modifier (bg-rf-surface/78) does not generate
    // its Tailwind utility reliably. Always use the arbitrary hex value form.
    expect(src).not.toContain("dark:bg-rf-surface");
  });

  it("ap3k-kicker uses light-mode pink override (text-pink-600 dark:text-rf-pink)", () => {
    const src = read("app/globals.css");
    expect(src).toContain("text-pink-600 dark:text-rf-pink");
  });

  it("onboarding pages have no bare text-rf-muted without dark: on the same line", () => {
    const pages = [
      "app/(protected)/onboarding/page.tsx",
      "app/(protected)/onboarding/connect/page.tsx",
      "app/(protected)/onboarding/complete/page.tsx",
    ];
    for (const page of pages) {
      const src = read(page);
      for (const line of src.split("\n")) {
        if (line.includes("text-rf-muted") && !line.includes("dark:")) {
          throw new Error(`${page}: bare text-rf-muted without dark: guard — ${line.trim()}`);
        }
      }
    }
  });

  it("onboarding connect page has no bare text-rf-text without dark: on the same line", () => {
    const src = read("app/(protected)/onboarding/connect/page.tsx");
    for (const line of src.split("\n")) {
      if (line.includes("text-rf-text") && !line.includes("dark:")) {
        throw new Error(`bare text-rf-text without dark: guard — ${line.trim()}`);
      }
    }
  });

  it("main-bread-crumbs uses dark: guards for rf-text and rf-muted", () => {
    const src = read("components/global/bread-crumb/main-bread-crumbs/index.tsx");
    expect(src).toContain("dark:text-rf-text");
    expect(src).toContain("dark:text-rf-muted");
    expect(src).toContain("dark:border-white/10");
    expect(src).toContain("dark:bg-white/[0.03]");
  });

  it("onboarding-checklist uses dark: guards for rf-text and rf-muted", () => {
    const src = read("components/global/onboarding-checklist/index.tsx");
    for (const line of src.split("\n")) {
      if (line.includes("text-rf-text") && !line.includes("dark:")) {
        throw new Error(`bare text-rf-text without dark: — ${line.trim()}`);
      }
      if (line.includes("text-rf-muted") && !line.includes("dark:")) {
        throw new Error(`bare text-rf-muted without dark: — ${line.trim()}`);
      }
    }
  });

  it("stat-card neutral delta has light-mode border and bg", () => {
    const src = read("components/global/stat-card/index.tsx");
    expect(src).toContain("border-slate-200");
    expect(src).toContain("bg-slate-100");
  });

  it("ap3k-logo default text color has dark: guard", () => {
    const src = read("components/global/ap3k-logo/index.tsx");
    expect(src).toContain("dark:text-rf-text");
  });

  it("sidebar upgrade card uses dark: guard for rf-muted text", () => {
    const src = read("components/global/sidebar/upgrade.tsx");
    for (const line of src.split("\n")) {
      if (line.includes("text-rf-muted") && !line.includes("dark:")) {
        throw new Error(`bare text-rf-muted without dark: — ${line.trim()}`);
      }
    }
  });

  it("dashboard page headings do not use bare text-white on h1 or h2", () => {
    const pages = [
      "app/(protected)/dashboard/[slug]/page.tsx",
      "app/(protected)/dashboard/[slug]/billing/page.tsx",
      "app/(protected)/dashboard/[slug]/automation/page.tsx",
      "app/(protected)/dashboard/[slug]/account/page.tsx",
      "app/(protected)/dashboard/[slug]/settings/page.tsx",
    ];
    for (const page of pages) {
      const src = read(page);
      for (const line of src.split("\n")) {
        if (
          (line.includes("<h1") || line.includes("<h2")) &&
          /\btext-white\b/.test(line) &&
          !line.includes("dark:text-white")
        ) {
          throw new Error(`${page}: bare text-white on heading — ${line.trim()}`);
        }
      }
    }
  });
});
