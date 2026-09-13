import { MESSAGES } from "./messages";
import { PHRASE_TRANSLATIONS } from "./phrase-translations";
import { PUBLIC_COPY } from "./public-copy";
import type { Locale } from "./config";

const catalogs = Object.fromEntries(Object.entries(MESSAGES).map(([locale, messages]) => [locale, {
  ...Object.fromEntries(Object.entries(MESSAGES.en).map(([key, source]) => [source, messages[key as keyof typeof messages]])),
  ...PHRASE_TRANSLATIONS[locale as Locale],
  ...PUBLIC_COPY[locale as Locale],
}])) as Record<Locale, Record<string, string>>;

export function translateUi(source: string, locale: Locale): string {
  if (locale === "en") return source;
  const key = source.replace(/\s+/g, " ").trim();
  const translated = catalogs[locale][key];
  if (!translated) return source;
  return `${source.match(/^\s*/)?.[0] ?? ""}${translated}${source.match(/\s*$/)?.[0] ?? ""}`;
}
