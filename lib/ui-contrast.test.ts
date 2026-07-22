import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";
import path from "path";

const root = path.resolve(__dirname, "../");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf-8");
}

describe("light-mode contrast invariants", () => {
  it("onboarding layout uses an opaque dark surface with readable inherited text", () => {
    const src = read("app/(protected)/onboarding/layout.tsx");
    expect(src).toContain("dark:text-slate-50");
    expect(src).toContain("dark:bg-[#050816]");
    expect(src).toContain("dark:bg-[#0f172a]");
    expect(src).not.toContain("dark:bg-[#0f172a]/78");
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
      const badLines = src
        .split("\n")
        .filter((line) => line.includes("text-rf-muted") && !line.includes("dark:text-rf-muted"));
      expect(badLines, `${page} contains unguarded text-rf-muted`).toEqual([]);
    }
  });

  it("onboarding connect page has no bare text-rf-text without dark: on the same line", () => {
    const src = read("app/(protected)/onboarding/connect/page.tsx");
    const badLines = src
      .split("\n")
      .filter((line) => line.includes("text-rf-text") && !line.includes("dark:text-rf-text"));
    expect(badLines).toEqual([]);
  });

  it("main-bread-crumbs uses dark: guards for rf-text and rf-muted", () => {
    const src = read("components/global/main-bread-crumbs/index.tsx");
    const badLines = src
      .split("\n")
      .filter(
        (line) =>
          (line.includes("text-rf-text") && !line.includes("dark:text-rf-text")) ||
          (line.includes("text-rf-muted") && !line.includes("dark:text-rf-muted"))
      );
    expect(badLines).toEqual([]);
  });

  it("onboarding-checklist uses dark: guards for rf-text and rf-muted", () => {
    const src = read("components/onboarding/onboarding-checklist.tsx");
    const badLines = src
      .split("\n")
      .filter(
        (line) =>
          (line.includes("text-rf-text") && !line.includes("dark:text-rf-text")) ||
          (line.includes("text-rf-muted") && !line.includes("dark:text-rf-muted"))
      );
    expect(badLines).toEqual([]);
  });

  it("stat-card neutral delta has light-mode border and bg", () => {
    const src = read("components/dashboard/stat-card.tsx");
    expect(src).toContain("border-slate-200 bg-slate-50");
    expect(src).toContain("dark:border-rf-border dark:bg-rf-surface/70");
  });

  it("ap3k-logo default text color has dark: guard", () => {
    const src = read("components/global/ap3k-logo/index.tsx");
    expect(src).toContain("text-slate-950 dark:text-rf-text");
  });

  it("sidebar upgrade card uses dark: guard for rf-muted text", () => {
    const src = read("components/global/sidebar/upgrade-card.tsx");
    const badLines = src
      .split("\n")
      .filter((line) => line.includes("text-rf-muted") && !line.includes("dark:text-rf-muted"));
    expect(badLines).toEqual([]);
  });

  it("dashboard page headings do not use bare text-white on h1 or h2", () => {
    const pages = [
      "app/(protected)/dashboard/[slug]/page.tsx",
      "app/(protected)/dashboard/[slug]/billing/page.tsx",
      "app/(protected)/dashboard/[slug]/settings/page.tsx",
      "app/(protected)/dashboard/[slug]/integrations/page.tsx",
    ];
    for (const page of pages) {
      const src = read(page);
      expect(src).not.toMatch(/<h[12][^>]*className="[^"]*\btext-white\b/);
    }
  });
});
