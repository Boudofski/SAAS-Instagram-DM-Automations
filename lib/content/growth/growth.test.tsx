import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import en from "./en.json";
import ar from "./ar.json";
import fr from "./fr.json";
import es from "./es.json";
import de from "./de.json";
import pt from "./pt.json";
import intents from "./search-intents.json";
import { translateUi } from "../../i18n/translate";
import { localizePublicPath, type Locale } from "../../i18n/config";
import sitemap from "@/app/sitemap";
const state = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/lib/i18n/server", () => ({ getServerLocale: () => state.locale }));
vi.mock("@/providers/i18n-provider", () => ({ useI18n: () => ({ locale: state.locale }) }));
vi.mock("@/components/global/website-nav", () => ({ default: () => null }));
vi.mock("@/components/global/website-footer", () => ({ default: () => null }));
import BlogPage, { generateMetadata } from "@/app/(website)/blog/[slug]/page";

describe("localized growth guides", () => {
  it("assigns all 37 search intents to six substantial guides", () => {
    expect(Object.values(intents).flat()).toHaveLength(37);
    expect(new Set(Object.values(intents).flat()).size).toBe(37);
    expect(Object.keys(intents)).toEqual(en.map(post => post.slug));
    for (const post of en) expect(post.sections).toHaveLength(4);
  });
  it("renders authored language copies, source links, screenshots and correct search metadata", () => {
    for (const [locale, posts] of Object.entries({ en, ar, fr, es, de, pt })) {
      state.locale = locale as Locale;
      for (const [index, post] of Array.from(posts.entries())) {
        expect(post.slug).toBe(en[index].slug);
        expect(translateUi(en[index].title, state.locale)).toBe(post.title);
        const html = renderToStaticMarkup(<BlogPage params={{ slug: post.slug }} />);
        expect(html).toContain(post.title);
        expect(html).toContain(post.sections[3].paragraphs[0]);
        expect(html).toContain("comment-to-dm-example.jpg");
        if (locale !== "en") expect(html).not.toContain(en[index].intro);
        const metadata = generateMetadata({ params: { slug: post.slug } });
        const url = `https://ap3k.com${localizePublicPath(`/blog/${post.slug}`, state.locale)}`;
        expect(metadata.alternates?.canonical).toBe(url);
        expect(Object.keys(metadata.alternates?.languages ?? {})).toHaveLength(7);
        expect(metadata.description).toBe(post.description);
        expect(sitemap().find(item => item.url === url)).toBeTruthy();
        expect(html).toContain(`"inLanguage":"${locale}"`);
        if (post.slug === "compare-instagram-dm-automation-tools") expect(html).toContain('href="https://chatfuel.com/instagram"');
      }
    }
  });
});
