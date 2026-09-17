import { describe, expect, it } from "vitest";
import EDITORIAL_COPY from "./editorial-copy.json";
import { EXTENDED_COPY } from "./extended-copy";
import { translateUi } from "./translate";

const locales = ["ar", "fr", "es", "de", "pt"] as const;

describe("reviewed product language", () => {
  it("uses reviewed wording instead of older competing catalogs", () => {
    for (const locale of locales) {
      for (const [source, translation] of Object.entries(EDITORIAL_COPY[locale])) {
        expect(translateUi(source, locale), `${locale}: ${source}`).toBe(translation);
        expect(Object.prototype.hasOwnProperty.call(EXTENDED_COPY[locale], source)).toBe(false);
      }
    }
  });

  it("preserves template variables and literal example keywords", () => {
    for (const locale of locales) {
      for (const [source, translation] of Object.entries(EDITORIAL_COPY[locale])) {
        for (const token of source.match(/\{\{?\w+\}?\}/g) ?? []) {
          expect(translation, `${locale}: ${source}`).toContain(token);
        }
      }
      for (const source of [
        "GUIDE for a downloadable resource",
        "PRICE for pricing information",
        "BOOK for a booking or consultation flow",
        "LINK for a promised page",
        "MENU for a restaurant or service menu",
      ]) {
        expect(translateUi(source, locale)).toContain(source.split(" ")[0]);
      }
    }
  });

  it("removes corrupted Arabic and incorrect literal product terms", () => {
    for (const translation of Object.values(EDITORIAL_COPY.ar)) {
      expect(translation).not.toMatch(/Z[XQS]{2,}|منظمة العفو الدولية|سو سو|رصاص|حساب الخالق/);
    }
    expect(translateUi("Skip reply", "ar")).toBe("تخطي الرد");
    expect(translateUi("Write universally relevant copy", "fr")).not.toContain("copie");
    expect(translateUi("Write universally relevant copy", "de")).not.toContain("Kopie");
    expect(translateUi("Leads", "es")).toBe("Clientes potenciales");
    expect(translateUi("Leads", "pt")).toBe("Potenciais clientes");
  });

  it("keeps concrete feature instructions and keyword examples meaningful", () => {
    const keywordExamples = [
      ["Match the CTA in the caption, such as COACHING, PLAN, or BOOK.", ["COACHING", "PLAN", "BOOK"]],
      ["Use SHOP, SIZE, PRICE, or another keyword that fits the caption.", ["SHOP", "SIZE", "PRICE"]],
    ] as const;
    for (const locale of locales) {
      for (const [source, keywords] of keywordExamples) {
        for (const keyword of keywords) expect(translateUi(source, locale)).toContain(keyword);
      }
      expect(translateUi("Yes, when the configured DM supports a valid HTTPS link button.", locale)).toContain("HTTPS");
      expect(translateUi("Yes, when the configured DM supports a valid HTTPS link button.", locale)).not.toContain("%s");
    }
    expect(translateUi("Creators", "ar")).toBe("صانعو المحتوى");
    expect(translateUi("Coaches", "ar")).toBe("المدرّبون");
    expect(translateUi("Billing and plans", "ar")).toBe("الفوترة والخطط");
    expect(translateUi("Cookie Policy — AP3K", "ar")).toContain("ملفات تعريف الارتباط");
  });

  it("keeps English and unmatched customer text unchanged", () => {
    const customerText = "My campaign — مرحبًا — Bonjour @my_account https://example.com";
    for (const locale of locales) expect(translateUi(customerText, locale)).toBe(customerText);
    expect(translateUi("Skip reply", "en")).toBe("Skip reply");
    expect(translateUi("  Leads\n", "ar")).toBe("  العملاء المحتملون\n");
  });
});
