import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "./config";
import { REFERRAL_COPY } from "./referrals";

describe("referral translations", () => {
  it("provides a complete catalog for every supported locale", () => {
    expect(Object.keys(REFERRAL_COPY).sort()).toEqual(
      [...SUPPORTED_LOCALES].sort(),
    );
    const englishKeys = Object.keys(REFERRAL_COPY.en);
    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(REFERRAL_COPY[locale])).toEqual(englishKeys);
      expect(Object.values(REFERRAL_COPY[locale]).every(Boolean)).toBe(true);
    }
  });

  it("does not fall back to English for Arabic referral copy", () => {
    for (const key of Object.keys(REFERRAL_COPY.en) as Array<
      keyof typeof REFERRAL_COPY.en
    >) {
      expect(REFERRAL_COPY.ar[key], key).not.toBe(REFERRAL_COPY.en[key]);
    }
  });
});
