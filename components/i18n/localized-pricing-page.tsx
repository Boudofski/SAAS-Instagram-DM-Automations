import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { getLocalizedLandingCopy } from "@/components/i18n/localized-landing-page";
import { localizePublicPath, type Locale } from "@/lib/i18n/config";
import { getServerMessages } from "@/lib/i18n/server";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function LocalizedPricingPage({ locale }: { locale: Exclude<Locale, "en"> }) {
  const copy = getLocalizedLandingCopy(locale);
  const { t } = getServerMessages();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#080911] dark:text-white">
      <WebsiteNav current="pricing" />
      <main>
        <section className="px-4 pb-12 pt-20 text-center sm:px-8">
          <p className="ap3k-kicker">{copy.pricingKicker}</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{copy.pricingTitle}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">{copy.pricingDescription}</p>
        </section>
        <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-20 sm:px-8 md:grid-cols-3">
          {copy.plans.map((plan, index) => (
            <article key={plan.name} className={`flex flex-col rounded-3xl border bg-white p-7 shadow-sm dark:bg-white/[.04] ${index === 1 ? "border-violet-500 ring-2 ring-violet-500/15" : "border-slate-200 dark:border-white/10"}`}>
              <h2 className="text-2xl font-black">{plan.name}</h2>
              <p className="mt-4 text-4xl font-black text-violet-600 dark:text-violet-300">{plan.price}</p>
              <p className="mt-5 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{plan.description}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-5 w-5 text-emerald-500" />Instagram Business &amp; Creator</div>
              <Link href={localizePublicPath("/sign-up", locale)} className="ap3k-gradient-button mt-7 px-5 py-3 text-center text-sm">{t("getStarted")}</Link>
            </article>
          ))}
        </section>
        <section className="bg-[#11131d] px-4 py-20 text-white sm:px-8"><div className="mx-auto max-w-3xl"><div className="text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-violet-300">{copy.faqKicker}</p><h2 className="mt-4 text-4xl font-black tracking-tight">{copy.faqTitle}</h2></div><div className="mt-10 divide-y divide-white/10 border-y border-white/10">{copy.faqs.map((item) => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black"><span>{item.question}</span><span className="text-2xl text-violet-300 transition group-open:rotate-45">+</span></summary><p className="pt-4 text-sm leading-7 text-white/70">{item.answer}</p></details>)}</div></div></section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
