"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { arSA, deDE, esES, frFR, ptPT } from "@clerk/localizations";
import AP3KLogo from "@/components/global/ap3k-logo";
import LanguageSwitcher from "@/components/global/language-switcher";
import { useI18n } from "@/providers/i18n-provider";
import { localizePublicPath } from "@/lib/i18n/config";
import Link from "next/link";
import type { ReactNode } from "react";

// Clerk's community Arabic catalog leaves these visible fields undefined.
const arabicAuth = {
  ...arSA,
  formFieldLabel__emailAddress: "البريد الإلكتروني",
  formFieldInputPlaceholder__emailAddress: "أدخل بريدك الإلكتروني",
  formFieldInputPlaceholder__emailAddress_username: "أدخل بريدك الإلكتروني أو اسم المستخدم",
  formFieldInputPlaceholder__password: "أدخل كلمة المرور",
  formFieldInputPlaceholder__firstName: "أدخل اسمك الأول",
  formFieldInputPlaceholder__lastName: "أدخل اسم العائلة",
  formFieldInputPlaceholder__username: "أدخل اسم المستخدم",
};

export default function AuthLocaleShell({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const localization = locale === "en" ? undefined : { ar: arabicAuth, de: deDE, es: esES, fr: frFR, pt: ptPT }[locale];
  return (
    <ClerkProvider localization={localization}>
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-20 dark:bg-[#080911]">
        <div className="absolute left-4 top-4 rtl:left-auto rtl:right-4 sm:left-8 sm:top-7 rtl:sm:left-auto rtl:sm:right-8">
          <Link href={localizePublicPath("/", locale)}><AP3KLogo className="text-slate-950 dark:text-white" /></Link>
        </div>
        <div className="absolute right-4 top-4 rtl:left-4 rtl:right-auto sm:right-8 sm:top-7 rtl:sm:left-8 rtl:sm:right-auto"><LanguageSwitcher /></div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </ClerkProvider>
  );
}
