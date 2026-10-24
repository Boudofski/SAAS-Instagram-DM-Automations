import { describe, expect, it } from "vitest";
import { COMPANY_SCHEMA } from "./company";
import { SUPPORTED_LOCALES } from "./i18n/config";
import { HOME_HERO_COPY } from "./i18n/home-hero";
import { SITE_METADATA } from "./i18n/metadata";

describe("multilingual AP3K brand signals", () => {
  it("names AP3K in the title, description and first-page copy for every language", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(SITE_METADATA[locale].title).toContain("AP3K");
      expect(SITE_METADATA[locale].description).toContain("AP3K");
      expect(HOME_HERO_COPY[locale].description).toContain("AP3K");
    }
  });

  it("connects the organization entity to AP3K's official profiles", () => {
    expect(COMPANY_SCHEMA.sameAs).toEqual(expect.arrayContaining([
      "https://www.instagram.com/ap3kautomation",
      "https://www.facebook.com/ap3kautomation/",
      "https://www.linkedin.com/company/ap3kautomation",
      "https://www.youtube.com/@AP3Kautomation",
      "https://www.tiktok.com/@ap3kautomation",
    ]));
  });
});
