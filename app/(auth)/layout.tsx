import { ClerkProvider } from "@clerk/nextjs";
import { arSA, deDE, esES, frFR, ptPT } from "@clerk/localizations";
import AP3KLogo from "@/components/global/ap3k-logo";
import LanguageSwitcher from "@/components/global/language-switcher";
import { getServerLocale } from "@/lib/i18n/server";
import Link from "next/link";
import React from "react";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
};

function Layout({ children }: Props) {
  const locale = getServerLocale();
  const localization = locale === "en" ? undefined : { ar: arSA, de: deDE, es: esES, fr: frFR, pt: ptPT }[locale];

  return (
    <ClerkProvider localization={localization}>
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-20 dark:bg-[#080911]">
        <div className="absolute left-4 top-4 rtl:left-auto rtl:right-4 sm:left-8 sm:top-7 rtl:sm:left-auto rtl:sm:right-8">
          <Link href={locale === "en" ? "/" : `/${locale}`}><AP3KLogo className="text-slate-950 dark:text-white" /></Link>
        </div>
        <div className="absolute right-4 top-4 rtl:left-4 rtl:right-auto sm:right-8 sm:top-7 rtl:sm:left-8 rtl:sm:right-auto"><LanguageSwitcher /></div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </ClerkProvider>
  );
}

export default Layout;
