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
  "public/favicon.ico",
  "public/favicon.svg",
  "public/favicon-16.png",
  "public/favicon-32.png",
  "public/apple-touch-icon.png",
  "public/site.webmanifest",
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
    expect(component).toContain("ap3k-wordmark-black.svg");
    expect(component).toContain("ap3k-wordmark-white-mono.svg");
    expect(component).not.toContain('d="M8.5 36');
  });

  it("uses the wordmark-only lockup in the public menu", () => {
    const nav = readFileSync("components/global/website-nav/index.tsx", "utf8");
    expect(nav).toContain('variant="wordmark"');
    expect(nav).toContain("monochrome");
    expect(nav).toContain('markClassName="h-8"');
  });

  it("publishes explicit cache-busted browser icons", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain('"/favicon.svg?v=2"');
    expect(layout).toContain('"/favicon.ico?v=2"');
    expect(layout).toContain('"/apple-touch-icon.png?v=2"');
    expect(layout).toContain('manifest: "/site.webmanifest?v=2"');
  });
});
