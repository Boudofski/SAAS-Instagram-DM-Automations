import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
const state = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/providers/i18n-provider", () => ({ useI18n: () => state }));
import PricingCapacity, { CAPACITY_COPY } from "./pricing-capacity";

describe("pricing capacity examples", () => {
  it.each(SUPPORTED_LOCALES)("renders complete localized examples in %s", locale => {
    state.locale = locale;
    const html = renderToStaticMarkup(<PricingCapacity />);
    expect(html).toContain(CAPACITY_COPY[locale].title);
    expect(html).toContain(CAPACITY_COPY[locale].pairs);
    for (const capacity of [250, 2500, 10000]) {
      expect(html).toContain(new Intl.NumberFormat(locale).format(capacity));
    }
    expect(html).toContain(`dir="${locale === "ar" ? "rtl" : "ltr"}"`);
    if (locale !== "en") expect(html).not.toContain(CAPACITY_COPY.en.title);
  });
});
