"use client";

import { Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";
import AP3KLogo from "@/components/global/ap3k-logo";
import CookiePreferencesButton from "@/components/global/cookie-preferences-button";
import { usePublicUi } from "@/components/i18n/use-public-ui";
import { COMPANY_SOCIAL_PROFILES } from "@/lib/company";
import { localizePublicPath } from "@/lib/i18n/config";
import { useI18n } from "@/providers/i18n-provider";

const socialIcons = { LinkedIn: Linkedin, Instagram, YouTube: Youtube };

const groups = [
  {
    title: "Product",
    links: [
      ["Instagram automation", "/instagram-dm-automation"],
      ["Comment to DM", "/instagram-comment-to-dm"],
      ["Pricing", "/pricing"],
      ["All solutions", "/solutions"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Documentation", "/docs"],
      ["Video tutorial", "/tutorials/instagram-comment-to-dm"],
      ["Blog", "/blog"],
      ["Campaign resources", "/resources"],
      ["All comparisons", "/compare"],
    ],
  },
  {
    title: "AP3K",
    links: [
      ["About AP3K", "/about"],
      ["Contact us", "/contact"],
    ],
  },
] as const;

export default function WebsiteFooter() {
  const { locale, t } = useI18n();
  const tr = usePublicUi();
  const href = (path: string) => localizePublicPath(path, locale);
  const linkClass = "rounded-sm text-slate-600 hover:text-slate-950 hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500 dark:text-slate-400 dark:hover:text-white";

  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white px-5 py-9 dark:border-white/10 dark:bg-[#080911] sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="min-w-0">
            <AP3KLogo className="text-lg text-slate-950 dark:text-white" markClassName="h-9 w-9 rounded-xl" />
            <p className="mt-3 max-w-[34ch] text-sm leading-6 text-slate-600 dark:text-slate-400">{t("footerDescription")}</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="AP3K social media">
              {COMPANY_SOCIAL_PROFILES.map(({ label, url }) => {
                const Icon = socialIcons[label];
                return (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`AP3K on ${label}`}
                      className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-white/15 dark:text-slate-400 dark:hover:border-violet-400/50 dark:hover:bg-violet-400/10 dark:hover:text-violet-300">
                      <Icon size={19} aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          <nav aria-label="Footer" className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-6 text-sm leading-5 [overflow-wrap:anywhere] sm:grid-cols-3 lg:gap-x-8">
            {groups.map(({ title, links }) => (
              <div key={title} className="min-w-0">
                <p className="mb-2 font-semibold text-slate-950 dark:text-white">{tr(title)}</p>
                <ul>
                  {links.map(([label, path]) => (
                    <li key={path}><Link href={href(path)} className={`inline-flex min-h-8 items-center py-1.5 ${linkClass}`}>{tr(label)}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-7 flex flex-col gap-4 border-t border-slate-200 pt-5 text-xs dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <p className="shrink-0 text-slate-600 dark:text-slate-400">© {new Date().getUTCFullYear()} AP3K LLC.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href={href("/privacy")} className={linkClass}>{t("privacy")}</Link>
            <Link href={href("/terms")} className={linkClass}>{t("terms")}</Link>
            <Link href={href("/cookies")} className={linkClass}>{t("cookies")}</Link>
            <Link href={href("/refund-policy")} className={linkClass}>{t("refunds")}</Link>
            <Link href={href("/data-deletion")} className={linkClass}>{t("dataDeletion")}</Link>
            <CookiePreferencesButton className={linkClass} />
          </div>
        </div>
      </div>
    </footer>
  );
}
