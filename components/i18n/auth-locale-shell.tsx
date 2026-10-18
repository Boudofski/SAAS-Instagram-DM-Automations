"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { deDE, esES, frFR, nlNL, ptPT } from "@clerk/localizations";
import AP3KLogo from "@/components/global/ap3k-logo";
import LanguageSwitcher from "@/components/global/language-switcher";
import { useI18n } from "@/providers/i18n-provider";
import { localizePublicPath } from "@/lib/i18n/config";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { AuthStory } from "@/components/auth/auth-experience";
import { AUTH_COPY } from "@/components/auth/copy";

export default function AuthLocaleShell({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const base = locale === "en" ? undefined : { de: deDE, es: esES, fr: frFR, nl: nlNL, pt: ptPT }[locale];
  const consent = {
    en: ["I agree to", "Terms of Service", "Privacy Policy", "and"],
    fr: ["J’accepte", "les conditions d’utilisation", "la politique de confidentialité", "et"],
    es: ["Acepto", "los términos del servicio", "la política de privacidad", "y"],
    de: ["Ich akzeptiere", "die Nutzungsbedingungen", "die Datenschutzerklärung", "und"],
    nl: ["Ik ga akkoord met", "de servicevoorwaarden", "het privacybeleid", "en"],
    pt: ["Aceito", "os termos de serviço", "a política de privacidade", "e"],
  }[locale];
  const terms = `{{ termsOfServiceLink || link("${consent[1]}") }}`;
  const privacy = `{{ privacyPolicyLink || link("${consent[2]}") }}`;
  const localization = { ...base, signUp: { ...base?.signUp,
    legalConsent: { ...base?.signUp?.legalConsent, checkbox: {
      label__onlyTermsOfService: `${consent[0]} ${terms}`,
      label__onlyPrivacyPolicy: `${consent[0]} ${privacy}`,
      label__termsOfServiceAndPrivacyPolicy: `${consent[0]} ${terms} ${consent[3]} ${privacy}`,
    } },
  } };
  return (
    <ClerkProvider localization={localization}
      signInUrl={localizePublicPath("/sign-in", locale)}
      signUpUrl={localizePublicPath("/sign-up", locale)}
      appearance={{ layout: {
        termsPageUrl: `https://ap3k.com${localizePublicPath("/terms", locale)}`,
        privacyPageUrl: `https://ap3k.com${localizePublicPath("/privacy", locale)}`,
      } }}
    >
      <div className="auth-page">
        <header className="auth-header">
          <Link className="auth-home" href={localizePublicPath("/", locale)} aria-label="AP3K"><AP3KLogo /></Link>
          <LanguageSwitcher />
        </header>
        <div className="auth-layout">
          <main className="auth-main">
            {children}
            <div className="auth-partner">
              <Image className="dark:hidden" src="/media/hero/meta-business-partner-light.png" alt="Meta Business Partner" width={324} height={129} />
              <Image className="hidden dark:block" src="/media/hero/meta-business-partner-dark.png" alt="Meta Business Partner" width={324} height={129} />
            </div>
            <footer className="auth-footer">
              <span>© {new Date().getFullYear()} AP3K</span>
              <Link href={localizePublicPath("/terms", locale)}>{AUTH_COPY[locale].terms}</Link>
              <Link href={localizePublicPath("/privacy", locale)}>{AUTH_COPY[locale].privacy}</Link>
            </footer>
          </main>
          <AuthStory />
        </div>
      </div>
    </ClerkProvider>
  );
}
