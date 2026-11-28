import { describe, expect, it, vi } from "vitest";
import { buildSitemap } from "@/lib/sitemap";
import type { Locale } from "@/lib/i18n/config";
const state = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/lib/i18n/server", () => ({ getServerLocale: () => state.locale }));
vi.mock("@/components/docs/article-interactions", () => ({ ArticleInteractions: () => null, TableOfContents: () => null }));
import { generateMetadata } from "@/app/(website)/docs/[...slug]/page";

describe("documentation index languages", () => {
  const base = "https://ap3k.com";
  const path = "/docs/troubleshoot/fix-slow-dm-delivery";
  const options = { params: Promise.resolve({ slug: path.slice("/docs/".length).split("/") }) };
  const languages = { en: base + path, ar: base + "/ar" + path, "x-default": base + path };

  it("gives a translated article its own title, canonical and reciprocal alternates", async () => {
    state.locale = "ar";
    const arabic = await generateMetadata(options);
    expect(arabic.title).toMatch(/تأخّر الرسائل الخاصة/);
    expect(arabic.alternates).toEqual({ canonical: languages.ar, languages });
    state.locale = "en";
    expect((await generateMetadata(options)).alternates).toEqual({ canonical: languages.en, languages });
    expect(buildSitemap().filter(page => page.url.endsWith(path)).map(page => page.url)).toEqual([languages.en, languages.ar]);
  });

  it("serves fallback URLs without presenting them as translated index entries", async () => {
    state.locale = "pt";
    const fallback = await generateMetadata(options);
    expect(fallback.title).toBe("DMs Are Very Slow to Arrive | AP3K Docs");
    expect(fallback.alternates).toEqual({ canonical: languages.en });
    const sitemap = buildSitemap();
    expect(sitemap.some(page => page.url === base + "/pt" + path)).toBe(false);
    expect(sitemap.some(page => page.url === base + "/pt/docs")).toBe(true);
  });
});
