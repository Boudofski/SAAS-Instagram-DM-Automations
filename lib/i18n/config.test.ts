import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_DETAILS,
  SUPPORTED_LOCALES,
  isProtectedPath,
  localeFromPath,
  localizePublicPath,
  normalizeLocale,
  stripLocaleFromPath,
} from "./config";
import { MESSAGES } from "./messages";
import { PRODUCT_PHRASE_TRANSLATIONS } from "./product-phrase-translations";

describe("AP3K locale routing", () => {
  it("supports the six intended locales and Arabic RTL", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "ar", "fr", "es", "de", "pt"]);
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALE_DETAILS.ar.direction).toBe("rtl");
  });

  it("normalizes regional browser language values", () => {
    expect(normalizeLocale("fr-CA")).toBe("fr");
    expect(normalizeLocale("pt_BR")).toBe("pt");
    expect(normalizeLocale("it-IT")).toBe("en");
  });

  it("adds and replaces public locale prefixes", () => {
    expect(localizePublicPath("/pricing", "fr")).toBe("/fr/pricing");
    expect(localizePublicPath("/ar/pricing", "de")).toBe("/de/pricing");
    expect(localizePublicPath("/es", "en")).toBe("/");
    expect(localeFromPath("/pt/blog")).toBe("pt");
    expect(stripLocaleFromPath("/pt/blog")).toBe("/blog");
  });

  it("never treats localized dashboard or API paths as public", () => {
    expect(isProtectedPath("/fr/dashboard/user_1")).toBe(true);
    expect(isProtectedPath("/ar/api/payment")).toBe(true);
    expect(isProtectedPath("/de/pricing")).toBe(false);
  });
});

describe("AP3K message catalogs", () => {
  it("contains every English key in every locale", () => {
    const englishKeys = Object.keys(MESSAGES.en).sort();
    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(MESSAGES[locale]).sort()).toEqual(englishKeys);
      expect(Object.values(MESSAGES[locale]).every(Boolean)).toBe(true);
    }
  });

  it("does not ship English placeholders in product phrase catalogs", () => {
    const legitimateSameSpelling: Partial<Record<(typeof SUPPORTED_LOCALES)[number], string[]>> = {
      fr: ["Contacts", "Source"],
      es: ["Contactos", "Instagram"],
      de: ["Instagram", "Optional", "Upgrade"],
      pt: ["Instagram"],
    };
    for (const locale of SUPPORTED_LOCALES.filter((value) => value !== "en")) {
      const untranslated = Object.entries(PRODUCT_PHRASE_TRANSLATIONS[locale])
        .filter(
          ([source, translated]) =>
            source === translated && !legitimateSameSpelling[locale]?.includes(source),
        )
        .map(([source]) => source);
      expect(untranslated, `${locale} contains untranslated product phrases`).toEqual([]);
    }
  });
});
