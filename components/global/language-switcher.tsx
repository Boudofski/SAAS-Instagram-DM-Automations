"use client";

import { LOCALE_COOKIE, LOCALE_DETAILS, SUPPORTED_LOCALES, isProtectedPath, localizePublicPath, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/providers/i18n-provider";
import { Languages } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeLocale = (nextLocale: Locale) => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    const query = searchParams.toString();
    const destination = isProtectedPath(pathname)
      ? pathname
      : localizePublicPath(pathname, nextLocale);
    startTransition(() => {
      router.push(query ? `${destination}?${query}` : destination);
      router.refresh();
    });
  };

  return (
    <label className="relative inline-flex min-w-0 items-center">
      <span className="sr-only">{t("language")}</span>
      <Languages aria-hidden="true" className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500 rtl:left-auto rtl:right-3" />
      <select
        aria-label={t("language")}
        value={locale}
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value as Locale)}
        className={`h-10 appearance-none rounded-full border border-slate-200 bg-white pl-9 pr-8 text-sm font-bold text-slate-700 shadow-sm outline-none transition hover:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60 rtl:pl-8 rtl:pr-9 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 ${compact ? "w-11 cursor-pointer text-transparent" : "max-w-40"}`}
      >
        {SUPPORTED_LOCALES.map((option) => (
          <option key={option} value={option} className="text-slate-950">
            {LOCALE_DETAILS[option].nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
