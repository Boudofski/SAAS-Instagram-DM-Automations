"use client";

import { LOCALE_COOKIE, LOCALE_DETAILS, LOCALE_FLAGS, SUPPORTED_LOCALES, isProtectedPath, localizePublicPath, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/providers/i18n-provider";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeLocale = (nextLocale: Locale) => {
    if (nextLocale === locale || isPending) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setLocale(nextLocale);
    const suffix = window.location.search + window.location.hash;
    const destination = isProtectedPath(pathname)
      ? pathname
      : localizePublicPath(pathname, nextLocale);
    startTransition(() => {
      // One request: push + refresh together race against the previous URL.
      if (destination === pathname) router.refresh();
      else router.push(destination + suffix, { scroll: false });
    });
  };

  return (
    <DropdownMenu dir={LOCALE_DETAILS[locale].direction} modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t("language")} aria-busy={isPending}
          className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 ${compact ? "w-11 px-0" : "max-w-44"}`}>
          <span aria-hidden="true" className="text-lg leading-none">{LOCALE_FLAGS[locale]}</span>
          {!compact && <span className="truncate">{LOCALE_DETAILS[locale].nativeName}</span>}
          {!compact && (isPending ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="z-[100] w-52 rounded-2xl p-1.5 shadow-xl">
        {SUPPORTED_LOCALES.map((option) => (
          <DropdownMenuItem key={option} disabled={isPending} onSelect={() => changeLocale(option)}
            className="min-h-11 cursor-pointer gap-3 rounded-xl px-3" lang={LOCALE_DETAILS[option].htmlLang}>
            <span aria-hidden="true" className="text-xl">{LOCALE_FLAGS[option]}</span>
            <span className="flex-1" dir="auto">{LOCALE_DETAILS[option].nativeName}</span>
            {locale === option && <Check aria-hidden="true" className="h-4 w-4 text-violet-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
