import PricingExperience from "@/components/global/pricing-experience";
import { FadeIn } from "@/components/global/motion/fade-in";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import type { Metadata } from "next";
import LocalizedCopy from "@/components/i18n/localized-copy";
import { getServerLocale } from "@/lib/i18n/server";
import { localeAlternates, localizePublicPath } from "@/lib/i18n/config";

const PRICING_METADATA = {
  en: ["AP3K Pricing — Free, Pro & Business Instagram Automation Plans", "Compare AP3K Free, Pro and Business plans for Instagram comment replies, DMs, AI, lead tracking and automation analytics."],
  ar: ["أسعار AP3K — خطط أتمتة إنستغرام المجانية والاحترافية والأعمال", "قارن خطط AP3K المجانية والاحترافية والأعمال للردود والرسائل الخاصة والذكاء الاصطناعي ومتابعة العملاء المحتملين."],
  fr: ["Tarifs AP3K — Offres Instagram Gratuit, Pro et Business", "Comparez les offres AP3K Gratuit, Pro et Business pour les réponses, DM, fonctions d’IA et le suivi des prospects Instagram."],
  es: ["Precios de AP3K — Planes Gratis, Pro y Business", "Compara los planes Gratis, Pro y Business de AP3K para respuestas, DM, IA y seguimiento de contactos de Instagram."],
  de: ["AP3K Preise — Instagram-Tarife Kostenlos, Pro und Business", "Vergleiche die AP3K-Tarife Kostenlos, Pro und Business für Antworten, DMs, KI und Instagram-Lead-Erfassung."],
  pt: ["Preços do AP3K — Planos Grátis, Pro e Business", "Compare os planos Grátis, Pro e Business do AP3K para respostas, DMs, IA e acompanhamento de contactos do Instagram."],
} as const;

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const [title, description] = PRICING_METADATA[locale];
  return {
    title,
    description,
    alternates: { canonical: localizePublicPath("/pricing", locale), languages: localeAlternates("/pricing") },
  };
}

const FAQ = [
  {
    q: "What counts toward my automated-reply allowance?",
    a: "Each successfully sent Comment reply and each successfully sent DM counts as one automated action. Failed or skipped actions do not count.",
  },
  {
    q: "Do annual plans still reset usage every month?",
    a: "Yes. Annual billing only changes how you pay. Your automated-action allowance resets every month just like a monthly subscription.",
  },
  {
    q: "Which Instagram accounts are supported?",
    a: "AP3K supports Instagram Business and Creator accounts through Instagram authorization.",
  },
  {
    q: "How many Instagram accounts can I connect?",
    a: "Free includes 1 Instagram account, Pro includes 3, and Business includes 10. Each account has separate automations, contacts, inbox, analytics, and AI knowledge. Monthly reply and AI allowances are shared across your subscription.",
  },
  {
    q: "How many automations can I create?",
    a: "Free includes up to five active automations. Pro and Business include unlimited active automations. You can keep drafts without activating them until you have room.",
  },
  {
    q: "What is the difference between a Comment reply and a DM?",
    a: "A comment reply appears under the Instagram post. A DM is sent to the commenter in their Instagram inbox. A post automation can use either action or both.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Paid subscribers can manage billing or cancellation through the secure Stripe billing portal from inside AP3K.",
  },
] as const;

export default function PricingPage() {
  const locale = getServerLocale();

  return (
    <LocalizedCopy><div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#070808] dark:text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(249,115,22,0.12),transparent_30rem),radial-gradient(circle_at_84%_12%,rgba(236,72,153,0.10),transparent_30rem)]" />
      <WebsiteNav current="pricing" />

      <main className="relative z-10">
        <section className="px-4 pb-12 pt-20 text-center sm:px-8 lg:px-16">
          <FadeIn>
            <p className="ap3k-kicker mb-4">Simple pricing</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Start free. <span className="ap3k-gradient-text">Save more annually.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-rf-muted sm:text-lg">
              One Instagram account, 500 automated actions and up to five active automations on Free. Upgrade when your audience or AI usage grows.
            </p>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-[1500px] px-4 pb-24 sm:px-8 lg:px-12">
          <FadeIn delay={0.08}>
            <PricingExperience />
          </FadeIn>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-8">
          <FadeIn>
            <div className="mb-8 text-center">
              <p className="ap3k-kicker">FAQ</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Billing without surprises</h2>
            </div>
          </FadeIn>
          <div className="flex flex-col gap-4">
            {FAQ.map((item, index) => (
              <FadeIn key={item.q} delay={index * 0.035}>
                <details className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-300 open:border-orange-500/25 open:shadow-lg dark:border-white/10 dark:bg-white/[0.04]">
                  <summary className="cursor-pointer list-none text-sm font-black text-slate-950 marker:hidden dark:text-white">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span className="text-lg text-orange-500 transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.a}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </section>
      </main>

      <WebsiteFooter />
    </div></LocalizedCopy>
  );
}
