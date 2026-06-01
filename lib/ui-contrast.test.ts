import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";
import path from "path";

const root = path.resolve(__dirname, "../");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf-8");
}

describe("light-mode contrast invariants", () => {
  it("onboarding layout guards rf-text and rf-surface behind dark: prefix", () => {
    const src = read("app/(protected)/onboarding/layout.tsx");
    expect(src).toContain("dark:text-rf-text");
    expect(src).toContain("dark:bg-rf-surface");
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
