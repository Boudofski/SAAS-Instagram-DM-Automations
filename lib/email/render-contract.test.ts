import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AP3K email render contract", () => {
  it("keeps HTML, plain-text, branding, preferences, and help links wired", () => {
    const renderer = readFileSync("lib/email/render.tsx", "utf8");
    const component = readFileSync("emails/ap3k-email.tsx", "utf8");

    expect(renderer).toContain("toPlainText(html)");
    expect(renderer).toContain("createElement(Ap3kEmail");
    expect(component).toContain("/brand/ap3k-social-avatar.png");
    expect(component).toContain("copy.preferences");
    expect(component).toContain("copy.help");
    expect(component).toContain("copy.footer");
  });

  it("uses email-compatible table layout and inline presentation styles", () => {
    const component = readFileSync("emails/ap3k-email.tsx", "utf8");
    expect(component).toContain('role="presentation"');
    expect(component).toContain('cellPadding="0"');
    expect(component).toContain("maxWidth: \"600px\"");
    expect(component).not.toContain("className=");
  });
});
