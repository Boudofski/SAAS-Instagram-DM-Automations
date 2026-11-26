import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/providers/i18n-provider", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));

import WebsiteFooter from ".";

describe("website footer", () => {
  it("shows only the three official profiles and keeps utility links without a language switcher", () => {
    const html = renderToStaticMarkup(<WebsiteFooter />);

    expect([...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map((match) => match[1])).toEqual([
      "https://www.linkedin.com/company/ap3kautomation",
      "https://www.instagram.com/ap3K.autodm",
      "https://www.youtube.com/@ap3k.autodm",
    ]);
    for (const policy of ["privacy", "terms", "refund-policy", "cookies", "data-deletion"]) {
      expect(html.split(`href="/${policy}"`)).toHaveLength(2);
    }
    expect(html).toContain('href="/contact"');
    expect(html).not.toContain("hrefLang=");
  });
});
