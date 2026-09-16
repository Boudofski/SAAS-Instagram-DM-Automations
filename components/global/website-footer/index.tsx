"use client";
import CompanyDetails from "@/components/website/company-details";
import { UiText } from "@/components/i18n/localized-copy";


import AP3KLogo from "@/components/global/ap3k-logo";
import CookiePreferencesButton from "@/components/global/cookie-preferences-button";
import LanguageSwitcher from "@/components/global/language-switcher";
import { localizePublicPath } from "@/lib/i18n/config";
import { useI18n } from "@/providers/i18n-provider";
import Link from "next/link";

export default function WebsiteFooter() {
  const { locale, t } = useI18n();
  const href = (path: string) => localizePublicPath(path, locale);
  const linkClass = "text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text";

  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/60 px-4 py-10 backdrop-blur dark:border-white/10 dark:bg-transparent sm:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <AP3KLogo className="text-sm text-slate-700 dark:text-rf-muted" markClassName="h-7 w-7 rounded-lg" />
            <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-rf-muted">
              {t("footerDescription")}
            </p>
            <LanguageSwitcher />
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-xs">
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400">{t("product")}</p>
              <Link href={`${href("/")}#features`} className={linkClass}>{t("features")}</Link>
              <Link href={`${href("/")}#how-it-works`} className={linkClass}>{t("howItWorks")}</Link>
              <Link href={href("/pricing")} className={linkClass}>{t("pricing")}</Link>
              <Link href={href("/blog")} className={linkClass}>{t("blog")}</Link>
              <Link href={href("/instagram-dm-automation")} className={linkClass}>{t("instagramDmAutomation")}</Link>
              <Link href={href("/instagram-comment-automation")} className={linkClass}>{t("commentAutomation")}</Link>
              <Link href={href("/manychat-alternative")} className={linkClass}>{t("manychatAlternative")}</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400">{t("popularGuides")}</p>
              <Link href={href("/blog/automate-instagram-dms-from-comments")} className={linkClass}>{t("automateDmsGuide")}</Link>
              <Link href={href("/blog/instagram-comment-reply-vs-dm")} className={linkClass}>{t("commentReplyVsDm")}</Link>
              <Link href={href("/blog/turn-instagram-comments-into-leads")} className={linkClass}>{t("commentsToLeads")}</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400">{t("legal")}</p>
              <Link href={href("/privacy")} className={linkClass}>{t("privacy")}</Link>
              <Link href={href("/terms")} className={linkClass}>{t("terms")}</Link>
              <Link href={href("/cookies")} className={linkClass}>{t("cookies")}</Link>
              <Link href={href("/refund-policy")} className={linkClass}>{t("refunds")}</Link>
              <Link href={href("/data-deletion")} className={linkClass}>{t("dataDeletion")}</Link>
              <CookiePreferencesButton className={linkClass} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400">{t("support")}</p>
              <Link href={href("/help")} className={linkClass}>{t("knowledgeBase")}</Link>
              <Link href={href("/contact")} className={linkClass}>{t("contactSupport")}</Link>
              <a href="mailto:support@ap3k.com" className={linkClass}><UiText>{"support@ap3k.com"}</UiText></a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-white/10">
          <p className="text-xs text-slate-400">{t("footerCopyright")}</p>
          <CompanyDetails compact />
        </div>
      </div>
    </footer>
  );
}
