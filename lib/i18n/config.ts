import englishArticleSlugs from "../content/comment-dm/slugs.json";

const englishArticles = new Set(englishArticleSlugs.map(slug => `/blog/${slug}`));
export function isEnglishOnlyArticle(pathname: string): boolean {
  return englishArticles.has(stripLocaleFromPath(pathname.split(/[?#]/)[0]).replace(/\/$/, ""));
}

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
  const suffixIndex = pathname.search(/[?#]/);
  const path = suffixIndex === -1 ? pathname : pathname.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : pathname.slice(suffixIndex);
  const cleanPath = stripLocaleFromPath(path);
  if (locale === DEFAULT_LOCALE || isProtectedPath(cleanPath) || isEnglishOnlyArticle(cleanPath)) return cleanPath + suffix;
  return (cleanPath === "/" ? `/${locale}` : `/${locale}${cleanPath}`) + suffix;
}

export function isProtectedPath(pathname: string): boolean {
  const cleanPath = stripLocaleFromPath(pathname);
  return /^(?:\/dashboard|\/onboarding|\/admin|\/ap3k-admin(?:-v2)?|\/api|\/callback|\/payment|\/account-deletion-preview|\/r)(?:\/|$)/.test(cleanPath);
}

// Public URLs are authoritative. A stale cookie must never trap '/' in Arabic.
// Callbacks, payments and APIs must never acquire a language prefix.
export function resolveRequestLocale(pathname: string, cookie?: string): Locale {
  if (isEnglishOnlyArticle(pathname)) return DEFAULT_LOCALE;
  return localeFromPath(pathname) ?? (isProtectedPath(pathname) ? normalizeLocale(cookie) : DEFAULT_LOCALE);
}

export function localeAlternates(pathname = "/") {
  if (isEnglishOnlyArticle(pathname)) {
    const path = localizePublicPath(pathname, "en");
    return { en: path, "x-default": path };
  }
  return {
    ...Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [LOCALE_DETAILS[locale].htmlLang, localizePublicPath(pathname, locale)]),
    ),
    "x-default": localizePublicPath(pathname, DEFAULT_LOCALE),
  };
}

/** Negotiate browser preferences, including regional tags and quality weights. */
export function browserLocale(header: string | null | undefined): Locale {
  const choices = (header || "").split(",").map((part, index) => {
    const [tag, ...params] = part.trim().split(";");
    const quality = params.find(value => value.trim().startsWith("q="));
    const q = quality ? Number(quality.trim().slice(2)) : 1;
    return { language: tag.toLowerCase().split(/[-_]/)[0], q, index };
  }).filter(item => Number.isFinite(item.q) && item.q > 0 && item.q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return choices.find(item => isLocale(item.language))?.language as Locale || DEFAULT_LOCALE;
}
