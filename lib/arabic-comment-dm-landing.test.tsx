import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ArabicCommentToDmPage, {
  metadata,
} from "@/app/(website)/ar/instagram-comment-to-dm/page";
import { buildSitemap } from "./sitemap";
import fs from "node:fs";

const ARABIC_URL = "https://ap3k.com/ar/instagram-comment-to-dm";

describe("Arabic comment-to-DM acquisition page", () => {
  it("publishes native Arabic metadata with a self canonical", () => {
    expect(metadata.alternates?.canonical).toBe(ARABIC_URL);
    expect(metadata.alternates?.languages).toMatchObject({
      ar: ARABIC_URL,
      en: "https://ap3k.com/instagram-comment-to-dm",
      "x-default": "https://ap3k.com/instagram-comment-to-dm",
    });
    expect(metadata.title).toContain("أتمتة التعليقات");
    expect(metadata.description?.length).toBeLessThanOrEqual(160);
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders an RTL conversion journey with honest plan limits", () => {
    const html = renderToStaticMarkup(<ArabicCommentToDmPage />);
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("حوّل كل تعليق");
    expect(html).toContain("500 عملية تلقائية ناجحة شهريًا");
    expect(html).toContain("خمس عمليات أتمتة نشطة");
    expect(html).toContain("utm_campaign=comment-to-dm");
    expect(html).toContain('"@type":"SoftwareApplication"');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('"price":"0"');
  });

  it("lists the Arabic canonical once with reciprocal alternates", () => {
    const pages = buildSitemap();
    const arabic = pages.filter(({ url }) => url === ARABIC_URL);
    expect(arabic).toHaveLength(1);
    expect(arabic[0].alternates?.languages).toMatchObject({
      ar: ARABIC_URL,
      en: "https://ap3k.com/instagram-comment-to-dm",
      fr: "https://ap3k.com/fr/instagram-comment-to-dm",
      es: "https://ap3k.com/es/instagram-comment-to-dm",
      de: "https://ap3k.com/de/instagram-comment-to-dm",
      pt: "https://ap3k.com/pt/instagram-comment-to-dm",
    });
    for (const url of [
      "https://ap3k.com/instagram-comment-to-dm",
      "https://ap3k.com/fr/instagram-comment-to-dm",
      "https://ap3k.com/es/instagram-comment-to-dm",
      "https://ap3k.com/de/instagram-comment-to-dm",
      "https://ap3k.com/pt/instagram-comment-to-dm",
    ]) {
      expect(
        pages.find((page) => page.url === url)?.alternates?.languages,
      ).toMatchObject({ ar: ARABIC_URL });
    }
  });

  it("allows only this reviewed Arabic route through retired-locale handling", () => {
    const middleware = fs.readFileSync("middleware.ts", "utf8");
    const exception = middleware.indexOf("isArabicCommentDmLanding");
    const retiredRedirect = middleware.indexOf(
      "const retiredLocale = retiredLocaleFromPath",
    );
    expect(exception).toBeGreaterThan(-1);
    expect(exception).toBeLessThan(retiredRedirect);
    expect(middleware).toContain('requestHeaders.set("x-ap3k-arabic-page", "1")');
  });
});
