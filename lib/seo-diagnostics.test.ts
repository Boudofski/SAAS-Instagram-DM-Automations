import { describe, expect, it } from "vitest";
import fs from "node:fs";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { SUPPORTED_LOCALES, isEnglishOnlyArticle, localizePublicPath, stripLocaleFromPath } from "@/lib/i18n/config";

describe("public indexing contracts", () => {
  it("lists unique public URLs with complete reciprocal language alternates", () => {
    const pages = sitemap();
    const urls = new Set(pages.map(page => page.url));
    expect(urls.size).toBe(pages.length);
    for (const page of pages) {
      const path = stripLocaleFromPath(new URL(page.url).pathname);
      expect(path).not.toMatch(/^\/(api|dashboard|admin|sign-in|sign-up|payment)(\/|$)/);
      for (const locale of isEnglishOnlyArticle(path) ? ["en"] as const : SUPPORTED_LOCALES) {
        const expected = `https://ap3k.com${localizePublicPath(path, locale)}`;
        expect(page.alternates?.languages?.[locale]).toBe(expected);
        expect(urls.has(expected)).toBe(true);
      }
      expect(page.alternates?.languages?.['x-default']).toBe(`https://ap3k.com${path}`);
    }
  });
  it("lets crawlers see noindex on authentication pages", () => {
    const rules = robots().rules;
    for (const rule of Array.isArray(rules) ? rules : [rules]) {
      const blocked = [rule.disallow].flat().filter(Boolean) as string[];
      for (const path of ['/sign-in', '/sign-up', '/sign-in/factor-one', '/fr/sign-up']) {
        expect(blocked.some(prefix => path.startsWith(prefix))).toBe(false);
      }
    }
    const authLayout = fs.readFileSync('app/(auth)/layout.tsx', 'utf8');
    expect(authLayout).toContain('index: false');
    expect(authLayout).toContain('googleBot: { index: false');
    expect(authLayout).toContain('canonical: null');
  });
});
