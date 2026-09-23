"use client";
import { UiText } from "@/components/i18n/localized-copy";


import AP3KLogo from "@/components/global/ap3k-logo";
import CookiePreferencesButton from "@/components/global/cookie-preferences-button";
import { localizePublicPath } from "@/lib/i18n/config";
import { useI18n } from "@/providers/i18n-provider";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/ap3kautomation", Icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/ap3kautomation/", Icon: Facebook },
  { label: "YouTube", href: "https://www.youtube.com/@AP3Kautomation", Icon: Youtube },
  { label: "Instagram", href: "https://www.instagram.com/ap3kautomation", Icon: Instagram },
] as const;

export default function WebsiteFooter() {
  const { locale, t } = useI18n();
  const href = (path: string) => localizePublicPath(path, locale);
  const linkClass = "text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text";

  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/60 px-4 py-10 backdrop-blur dark:border-white/10 dark:bg-transparent sm:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1.85fr]">
          <div className="flex flex-col items-start gap-3">
            <AP3KLogo className="text-sm text-slate-700 dark:text-rf-muted" markClassName="h-7 w-7 rounded-lg" />
            <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-rf-muted">
              {t("footerDescription")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2" aria-label="AP3K social media">
              {SOCIAL_LINKS.map(({ label, href: socialHref, Icon }) => (
                <a key={label} href={socialHref} target="_blank" rel="noopener noreferrer" aria-label={`AP3K on ${label}`} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-violet-400/40 dark:hover:text-violet-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 text-xs sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">{t("product")}</p>
              <Link href={`${href("/")}#features`} className={linkClass}>{t("features")}</Link>
              <Link href={href("/pricing")} className={linkClass}>{t("pricing")}</Link>
              <Link href={href("/blog")} className={linkClass}>{t("blog")}</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Instagram</p>
              <Link href={href("/instagram-dm-automation")} className={linkClass}>{t("instagramDmAutomation")}</Link>
              <Link href={href("/instagram-comment-automation")} className={linkClass}>{t("commentAutomation")}</Link>
              <Link href={href("/manychat-alternative")} className={linkClass}>{t("manychatAlternative")}</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">{t("support")}</p>
              <Link href={href("/help")} className={linkClass}>{t("knowledgeBase")}</Link>
              <Link href={href("/contact")} className={linkClass}>{t("contactSupport")}</Link>
              <a href="mailto:support@ap3k.com" className={linkClass}><UiText>{"support@ap3k.com"}</UiText></a>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 text-xs dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-600 dark:text-slate-400">{t("footerCopyright")}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
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
