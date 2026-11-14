import { it, expect } from "vitest";
import { marketingEmail, MARKETING_STAGES } from "./content";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
for (const locale of SUPPORTED_LOCALES)
  it(`localizes every marketing stage in ${locale} and preserves unsubscribe`, () => {
    for (const stage of MARKETING_STAGES) {
      const email = marketingEmail(
        stage,
        "creator",
        "https://ap3k.com/confirm-token",
        "https://ap3k.com/unsubscribe-token",
        "standard",
        locale,
      );
      expect(email.html).toContain(`lang="${locale}"`);
      expect(email.html).toContain(`dir="${locale === "ar" ? "rtl" : "ltr"}"`);
      expect(email.html).toContain("https://ap3k.com/unsubscribe-token");
      if (stage === "confirm")
        expect(email.html).toContain("https://ap3k.com/confirm-token");
      if (locale !== "en")
        expect(email.subject).not.toBe(
          marketingEmail(stage, "creator", "", "").subject,
        );
    }
  });
