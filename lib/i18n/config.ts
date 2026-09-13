export const SUPPORTED_LOCALES = ["en", "ar", "fr", "es", "de", "pt"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "ap3k_locale";

export const LOCALE_DETAILS: Record<
  Locale,
  { nativeName: string; htmlLang: string; direction: "ltr" | "rtl"; openGraph: string }
> = {
  en: { nativeName: "English", htmlLang: "en", direction: "ltr", openGraph: "en_US" },
  ar: { nativeName: "العربية", htmlLang: "ar", direction: "rtl", openGraph: "ar_AR" },
  fr: { nativeName: "Français", htmlLang: "fr", direction: "ltr", openGraph: "fr_FR" },
  es: { nativeName: "Español", htmlLang: "es", direction: "ltr", openGraph: "es_ES" },
  de: { nativeName: "Deutsch", htmlLang: "de", direction: "ltr", openGraph: "de_DE" },
  pt: { nativeName: "Português", htmlLang: "pt", direction: "ltr", openGraph: "pt_PT" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const language = value.toLowerCase().split(/[-_]/)[0];
  return isLocale(language) ? language : DEFAULT_LOCALE;
}

export function localeFromPath(pathname: string): Locale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isLocale(firstSegment) ? firstSegment : null;
}

export function stripLocaleFromPath(pathname: string): string {
  const locale = localeFromPath(pathname);
  if (!locale) return pathname || "/";
  const stripped = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  return stripped || "/";
}

export function localizePublicPath(pathname: string, locale: Locale): string {
  const cleanPath = stripLocaleFromPath(pathname);
  if (locale === DEFAULT_LOCALE) return cleanPath;
  return cleanPath === "/" ? `/${locale}` : `/${locale}${cleanPath}`;
}

export function isProtectedPath(pathname: string): boolean {
  const cleanPath = stripLocaleFromPath(pathname);
  return /^(?:\/dashboard|\/onboarding|\/admin|\/ap3k-admin|\/api)(?:\/|$)/.test(cleanPath);
}

export function localeAlternates(pathname = "/") {
  return {
    ...Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [LOCALE_DETAILS[locale].htmlLang, localizePublicPath(pathname, locale)]),
    ),
    "x-default": localizePublicPath(pathname, DEFAULT_LOCALE),
  };
}
