import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import ts from "typescript";
import { SUPPORTED_LOCALES, localizePublicPath, type Locale } from "./config";
import { translateUi, hasUiTranslation } from "./translate";
import { COMMERCIAL_PAGES } from "../commercial-pages";
import { BLOG_POSTS } from "../blog";
import { AP3K_HELP_ARTICLES } from "../ap3k-help";
import { REMAINING_ROWS } from "./remaining-copy";
import sitemap from "@/app/sitemap";

const state = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/providers/i18n-provider", () => ({ useI18n: () => ({ locale: state.locale }) }));
vi.mock("./server", () => ({ getServerLocale: () => state.locale }));
vi.mock("@/components/global/website-nav", () => ({ default: () => null }));
vi.mock("@/components/global/website-footer", () => ({ default: () => null }));
import LocalizedCopy, { UiText } from "@/components/i18n/localized-copy";
import CommercialLandingPage from "@/components/website/commercial-landing-page";
import HelpCenter from "@/components/help/help-center";
import PrivacyPage, { generateMetadata as privacyMetadata } from "@/app/(website)/privacy/page";
import { generateMetadata as commercialMetadata } from "@/app/(website)/[slug]/page";

function prose(value: unknown, field = ""): string[] {
  if (["slug", "theme", "media", "video", "keyword", "visual", "publishedAt", "updatedAt"].includes(field)) return [];
  if (typeof value === "string") return ["Instagram", "AP3K", "Business", "Pro"].includes(value) ? [] : [value];
  if (Array.isArray(value)) return value.flatMap(item => prose(item, field));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => prose(item, key));
  return [];
}

describe("complete public localization and search metadata", () => {
  it("renders nested translation wrappers without passing arrays to the string translator", () => {
    for (const locale of SUPPORTED_LOCALES) {
      state.locale = locale;
      const html = renderToStaticMarkup(<LocalizedCopy><div><UiText>{"Privacy Policy"}</UiText></div></LocalizedCopy>);
      expect(html).toContain(translateUi("Privacy Policy", locale));
    }
  });
  it("renders every commercial landing page in every language", () => {
    for (const locale of SUPPORTED_LOCALES) {
      state.locale = locale;
      for (const page of COMMERCIAL_PAGES) {
        const html = renderToStaticMarkup(<CommercialLandingPage page={page} />);
        expect(html).toContain("AP3K");
      }
    }
  });
  it("covers every commercial page, help article and blog content field", () => {
    for (const locale of SUPPORTED_LOCALES.filter(l => l !== "en")) {
      for (const source of prose([COMMERCIAL_PAGES, BLOG_POSTS, AP3K_HELP_ARTICLES])) {
        expect(hasUiTranslation(source, locale), `${locale}: ${source}`).toBe(true);
      }
    }
  });
  it("covers the policy paragraphs from their actual source", () => {
    for (const page of ["privacy", "terms", "cookies", "refund-policy", "data-deletion", "contact"]) {
      const source = fs.readFileSync(`app/(website)/${page}/page.tsx`, "utf8");
      const ast = ts.createSourceFile(page, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const phrases: string[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node) && /[A-Za-z]/.test(node.text)) phrases.push(node.text);
        if (ts.isStringLiteral(node) && ts.isPropertyAssignment(node.parent) && ["title", "body", "description"].includes(node.parent.name.getText(ast))) phrases.push(node.text);
        ts.forEachChild(node, visit);
      };
      visit(ast);
      for (const locale of SUPPORTED_LOCALES.filter(l => l !== "en")) for (const phrase of phrases.filter(p => !p.includes("@"))) {
        expect(hasUiTranslation(phrase, locale), `${locale}/${page}: ${phrase}`).toBe(true);
      }
    }
  });
  it("renders the reported Arabic and French gaps translated, then restores English", () => {
    for (const locale of ["ar", "fr", "en", "ar", "en"] as Locale[]) {
      state.locale = locale;
      const help = renderToStaticMarkup(<HelpCenter />);
      const privacy = renderToStaticMarkup(<PrivacyPage />);
      for (const title of ["Reconnect or replace an Instagram account", "AI safety and comment protection"]) {
        expect(help.includes(title)).toBe(locale === "en");
      }
      expect(privacy.includes("Instagram Data We Collect")).toBe(locale === "en");
      expect(privacy).toContain("support@ap3k.com");
    }
  });
  it("uses translated titles and self canonicals with reciprocal language alternatives", () => {
    for (const locale of SUPPORTED_LOCALES) {
      state.locale = locale;
      for (const page of COMMERCIAL_PAGES) {
        const metadata = commercialMetadata({ params: { slug: page.slug } });
        expect(metadata.alternates?.canonical).toBe(`https://ap3k.com${localizePublicPath(`/${page.slug}`, locale)}`);
        expect(Object.keys(metadata.alternates?.languages ?? {})).toHaveLength(7);
        expect(metadata.title).toBe(`${translateUi(page.title, locale)} | AP3K`);
        if (locale !== "en") expect(metadata.description).not.toBe(page.description);
      }
      expect(privacyMetadata().alternates?.canonical).toBe(`https://ap3k.com${localizePublicPath("/privacy", locale)}`);
    }
  });
  it("lists every public language version exactly once with the same alternatives", () => {
    const entries = sitemap();
    expect(new Set(entries.map(p => p.url)).size).toBe(entries.length);
    for (const page of entries) {
      const alternatives = page.alternates?.languages;
      expect(Object.keys(alternatives ?? {})).toHaveLength(7);
      for (const url of Object.values(alternatives ?? {})) expect(entries.some(p => p.url === url)).toBe(true);
      expect(page.url).not.toMatch(/dashboard|sign-in|sign-up|data-deletion-status/);
    }
  });
  it("has complete editorial rows without duplicate keys", () => {
    expect(new Set(REMAINING_ROWS.map(r => r[0])).size).toBe(REMAINING_ROWS.length);
    for (const row of REMAINING_ROWS) expect(row.length === 6 && row.every(v => v.trim())).toBe(true);
  });
});
