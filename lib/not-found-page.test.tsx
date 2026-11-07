import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SUPPORTED_LOCALES, localizePublicPath, type Locale } from "./i18n/config";
const state = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("./i18n/server", () => ({ getServerLocale: () => state.locale }));
import NotFound, { generateMetadata } from "../app/not-found";

describe("localized missing pages", () => {
  it.each(SUPPORTED_LOCALES)("keeps recovery links in %s and removes homepage index signals", locale => {
    state.locale = locale;
    const metadata = generateMetadata();
    expect(metadata.robots).toMatchObject({ index: false, googleBot: { index: false } });
    expect(metadata.alternates).toEqual({ canonical: null, languages: {} });
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain(`href="${localizePublicPath("/", locale)}"`);
    expect(html).toContain(`href="${localizePublicPath("/docs", locale)}"`);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(`dir="${locale === "ar" ? "rtl" : "ltr"}"`);
  });
});
