"use client";

import AP3KLogo from "@/components/global/ap3k-logo";
import LanguageSwitcher from "@/components/global/language-switcher";
import ThemeToggle from "@/components/global/theme-toggle";
import { localizePublicPath } from "@/lib/i18n/config";
import { useI18n } from "@/providers/i18n-provider";
import { Menu } from "lucide-react";
import Link from "next/link";

type Props = {
  current?: "home" | "pricing" | "blog" | "contact" | "privacy" | "terms" | "data-deletion";
};

export default function WebsiteNav({ current }: Props) {
  const { locale, t } = useI18n();
  const href = (path: string) => localizePublicPath(path, locale);
  const navClass = "transition-colors hover:text-slate-950 dark:hover:text-rf-text";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/78 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-rf-bg/72 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href={href("/")} aria-label={`AP3K ${t("home")}`}>
          <AP3KLogo className="text-base text-slate-950 dark:text-white" />
        </Link>
        <ul className="hidden items-center gap-7 text-sm font-semibold text-slate-600 dark:text-rf-muted md:flex">
          <li><Link href={`${href("/")}#features`} className={navClass}>{t("features")}</Link></li>
          <li><Link href={`${href("/")}#how-it-works`} className={navClass}>{t("howItWorks")}</Link></li>
          <li><Link href={href("/pricing")} className={current === "pricing" ? "text-slate-950 dark:text-rf-text" : navClass}>{t("pricing")}</Link></li>
          <li><Link href={href("/blog")} className={current === "blog" ? "text-slate-950 dark:text-rf-text" : navClass}>{t("blog")}</Link></li>
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle compact />
          <LanguageSwitcher compact />
          <Link href={href("/sign-in")} className="rounded-full px-5 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-white">
            {t("signIn")}
          </Link>
          <Link href={href("/sign-up")} className="ap3k-gradient-button px-5 py-2 text-sm uppercase">{t("getStarted")}</Link>
        </div>
        <div className="ms-auto me-2 md:hidden"><LanguageSwitcher compact /></div>
        <details className="group relative md:hidden">
          <summary aria-label={t("openNavigation")} className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-slate-200 bg-white/85 text-slate-800 shadow-sm marker:hidden dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
            <Menu className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl rtl:left-0 rtl:right-auto dark:border-white/10 dark:bg-[#101827]">
            <div className="grid gap-1 text-sm font-bold text-slate-700 dark:text-slate-300">
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href={`${href("/")}#features`}>{t("features")}</Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href={`${href("/")}#how-it-works`}>{t("howItWorks")}</Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href={href("/pricing")}>{t("pricing")}</Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href={href("/blog")}>{t("blog")}</Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href={href("/contact")}>{t("support")}</Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href={href("/sign-in")}>{t("signIn")}</Link>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
              <ThemeToggle compact />
              <Link href={href("/sign-up")} className="ap3k-gradient-button flex-1 px-4 py-2 text-center text-sm uppercase">{t("getStarted")}</Link>
            </div>
          </div>
        </details>
      </div>
    </nav>
  );
}
