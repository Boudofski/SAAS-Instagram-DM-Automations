import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";
import { localizePublicPath, type Locale } from "@/lib/i18n/config";

const copy: Record<Locale, { title: string; body: string; home: string; docs: string }> = {
  en: { title: "Page not found", body: "This page may have moved, or the link may be incorrect.", home: "Back to home", docs: "Open documentation" },
  ar: { title: "الصفحة غير موجودة", body: "ربما نُقلت هذه الصفحة، أو أن الرابط غير صحيح.", home: "العودة إلى الرئيسية", docs: "فتح دليل الاستخدام" },
  fr: { title: "Page introuvable", body: "Cette page a peut-être été déplacée ou le lien est incorrect.", home: "Retour à l’accueil", docs: "Consulter la documentation" },
  es: { title: "Página no encontrada", body: "Es posible que la página se haya movido o que el enlace sea incorrecto.", home: "Volver al inicio", docs: "Ver la documentación" },
  de: { title: "Seite nicht gefunden", body: "Diese Seite wurde möglicherweise verschoben oder der Link ist falsch.", home: "Zur Startseite", docs: "Dokumentation öffnen" },
  nl: { title: "Pagina niet gevonden", body: "Deze pagina is mogelijk verplaatst of de link is onjuist.", home: "Terug naar de startpagina", docs: "Documentatie bekijken" },
  pt: { title: "Página não encontrada", body: "Esta página pode ter sido movida ou o link pode estar incorreto.", home: "Voltar ao início", docs: "Ver documentação" },
};
export function generateMetadata(): Metadata {
  const text = copy[getServerLocale()];
  return {
    title: { absolute: `${text.title} — AP3K` },
    description: text.body,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    alternates: { canonical: null, languages: {} },
    openGraph: { title: `${text.title} — AP3K`, description: text.body },
  };
}
export default function NotFound() {
  const locale = getServerLocale();
  const text = copy[locale];
  return <main dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
    <p className="font-semibold text-violet-700 dark:text-violet-300">AP3K · 404</p>
    <h1 className="text-3xl font-bold">{text.title}</h1>
    <p className="text-muted-foreground">{text.body}</p>
    <div className="flex flex-wrap justify-center gap-4">
      <Link className="rounded-xl bg-violet-700 px-5 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href={localizePublicPath("/", locale)}>{text.home}</Link>
      <Link className="rounded-xl border px-5 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href={localizePublicPath("/docs", locale)}>{text.docs}</Link>
    </div>
  </main>;
}
