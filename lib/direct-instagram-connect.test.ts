import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("direct Instagram connection", () => {
  it("starts official Instagram authentication from the dashboard CTA", () => {
    const button = source("components/dashboard/connect-instagram-button.tsx");
    const dashboard = source("app/(protected)/dashboard/[slug]/page.tsx");

    expect(button).toContain("getInstagramConnectUrl()");
    expect(button).toContain("window.location.assign(result.url)");
    expect(button).toContain("<Instagram");
    expect(dashboard).toContain("<ConnectInstagramButton />");
    expect(dashboard).not.toContain("/integrations\" className=\"ap3k-gradient-button");
  });

  it("retires every onboarding screen to the dashboard", () => {
    for (const path of [
      "app/(protected)/onboarding/page.tsx",
      "app/(protected)/onboarding/connect/page.tsx",
      "app/(protected)/onboarding/complete/page.tsx",
    ]) {
      expect(source(path)).toContain('redirect("/dashboard")');
    }
  });
});
