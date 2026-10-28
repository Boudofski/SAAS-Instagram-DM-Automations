import { describe, expect, it } from "vitest";
import { COMMERCIAL_PAGES } from "./commercial-pages";
import { buildSitemap } from "./sitemap";
import { isEnglishOnlyArticle, localeAlternates } from "./i18n/config";

describe("free Instagram automation acquisition cluster", () => {
  it("publishes one focused, English canonical landing page", () => {
    const page = COMMERCIAL_PAGES.find(
      (candidate) => candidate.slug === "free-instagram-automation",
    );
    expect(page).toBeDefined();
    expect(page?.seoTitle).toBe("Free Instagram Automation Tool | AP3K");
    expect(page?.description.length).toBeLessThanOrEqual(160);
    expect(page?.faqs.some(({ question }) =>
      question.toLowerCase().includes("comment-to-dm automation free"),
    )).toBe(true);
    expect(isEnglishOnlyArticle("/free-instagram-automation")).toBe(true);
    expect(localeAlternates("/free-instagram-automation")).toEqual({
      en: "/free-instagram-automation",
      "x-default": "/free-instagram-automation",
    });
  });

  it("places the landing page in the sitemap once without fake translations", () => {
    const entries = buildSitemap().filter(({ url }) =>
      url.endsWith("/free-instagram-automation"),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].priority).toBe(0.85);
    expect(entries[0].alternates?.languages).toEqual({
      en: "https://ap3k.com/free-instagram-automation",
      "x-default": "https://ap3k.com/free-instagram-automation",
    });
  });
});
