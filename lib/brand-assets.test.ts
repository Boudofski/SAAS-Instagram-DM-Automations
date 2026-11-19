import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "public/brand/v2/ap3k-horizontal-for-light-bg.svg",
  "public/brand/v2/ap3k-horizontal-for-dark-bg.svg",
  "public/brand/v2/ap3k-icon.svg",
  "public/brand/v2/ap3k-icon-small.svg",
  "public/brand/v2/favicon.svg",
  "public/brand/v2/icon-192.png",
  "public/brand/v2/icon-512.png",
  "public/brand/v2/maskable-icon-512.png",
  "public/brand/v2/ap3k-email-logo.png",
  "public/brand/v2/ap3k-og-logo.png",
];

describe("AP3K v2 brand assets", () => {
  it("keeps every runtime logo variant available and nonempty", () => {
    for (const file of files) {
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, file).toBeGreaterThan(500);
    }
  });

  it("uses light and dark horizontal artwork without rebuilding the logo in JSX", () => {
    const component = readFileSync("components/global/ap3k-logo/index.tsx", "utf8");
    expect(component).toContain("ap3k-horizontal-for-light-bg.svg");
    expect(component).toContain("ap3k-horizontal-for-dark-bg.svg");
    expect(component).toContain("ap3k-icon-small.svg");
    expect(component).toContain("favicon.svg");
    expect(component).not.toContain('d="M8.5 36');
  });
});
