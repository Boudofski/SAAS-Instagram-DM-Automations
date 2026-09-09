import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import AutomationDemo from "@/components/website/automation-demo";
import type { CommercialPage } from "@/lib/commercial-pages";
import { ArrowRight, CheckCircle2, CircleAlert, PlayCircle } from "lucide-react";
import Link from "next/link";

const THEME_STYLES = {
  violet: {
    hero: "bg-[radial-gradient(circle_at_82%_20%,rgba(217,70,239,0.3),transparent_28rem),linear-gradient(135deg,#32107e,#6225cc_48%,#8b2ed8)]",
    glow: "bg-fuchsia-300/30",
    soft: "bg-violet-50 dark:bg-violet-500/[0.055]",
    step: "bg-violet-600",
    accent: "text-violet-600 dark:text-violet-300",
    edge: "from-violet-600 to-fuchsia-600",
    button: "text-violet-700",
  },
  blue: {
    hero: "bg-[radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.34),transparent_28rem),linear-gradient(135deg,#172554,#1d4ed8_50%,#6d28d9)]",
    glow: "bg-sky-300/30",
    soft: "bg-sky-50 dark:bg-sky-500/[0.055]",
    step: "bg-blue-600",
    accent: "text-blue-600 dark:text-blue-300",
    edge: "from-blue-600 to-violet-600",
    button: "text-blue-700",
  },
  fuchsia: {
    hero: "bg-[radial-gradient(circle_at_84%_18%,rgba(251,113,133,0.32),transparent_28rem),linear-gradient(135deg,#4a044e,#a21caf_50%,#7c3aed)]",
    glow: "bg-pink-300/30",
    soft: "bg-fuchsia-50 dark:bg-fuchsia-500/[0.055]",
    step: "bg-fuchsia-600",
    accent: "text-fuchsia-600 dark:text-fuchsia-300",
    edge: "from-fuchsia-600 to-violet-600",
    button: "text-fuchsia-700",
  },
  rose: {
    hero: "bg-[radial-gradient(circle_at_82%_20%,rgba(253,164,175,0.35),transparent_28rem),linear-gradient(135deg,#4c0519,#be123c_50%,#7c3aed)]",
    glow: "bg-rose-300/30",
    soft: "bg-rose-50 dark:bg-rose-500/[0.055]",
    step: "bg-rose-600",
    accent: "text-rose-600 dark:text-rose-300",
    edge: "from-rose-600 to-fuchsia-600",
    button: "text-rose-700",
  },
  cyan: {
    hero: "bg-[radial-gradient(circle_at_82%_20%,rgba(103,232,249,0.3),transparent_28rem),linear-gradient(135deg,#083344,#0e7490_48%,#5b21b6)]",
    glow: "bg-cyan-300/30",
    soft: "bg-cyan-50 dark:bg-cyan-500/[0.055]",
    step: "bg-cyan-600",
    accent: "text-cyan-700 dark:text-cyan-300",
    edge: "from-cyan-600 to-violet-600",
    button: "text-cyan-800",
  },
  indigo: {
    hero: "bg-[radial-gradient(circle_at_82%_20%,rgba(165,180,252,0.32),transparent_28rem),linear-gradient(135deg,#1e1b4b,#4338ca_50%,#7e22ce)]",
    glow: "bg-indigo-300/30",
    soft: "bg-indigo-50 dark:bg-indigo-500/[0.055]",
    step: "bg-indigo-600",
    accent: "text-indigo-600 dark:text-indigo-300",
    edge: "from-indigo-600 to-purple-600",
    button: "text-indigo-700",
  },
  pink: {
    hero: "bg-[radial-gradient(circle_at_82%_20%,rgba(249,168,212,0.34),transparent_28rem),linear-gradient(135deg,#500724,#db2777_48%,#7c3aed)]",
    glow: "bg-pink-300/30",
    soft: "bg-pink-50 dark:bg-pink-500/[0.055]",
    step: "bg-pink-600",
    accent: "text-pink-600 dark:text-pink-300",
    edge: "from-pink-600 to-violet-600",
    button: "text-pink-700",
  },
  emerald: {
    hero: "bg-[radial-gradient(circle_at_82%_20%,rgba(110,231,183,0.3),transparent_28rem),linear-gradient(135deg,#022c22,#047857_48%,#4338ca)]",
    glow: "bg-emerald-300/30",
    soft: "bg-emerald-50 dark:bg-emerald-500/[0.055]",
    step: "bg-emerald-600",
    accent: "text-emerald-700 dark:text-emerald-300",
    edge: "from-emerald-600 to-indigo-600",
    button: "text-emerald-800",
  },
  orange: {
    hero: "bg-[radial-gradient(circle_at_82%_20%,rgba(253,186,116,0.34),transparent_28rem),linear-gradient(135deg,#431407,#ea580c_48%,#7c2d12)]",
    glow: "bg-orange-300/30",
    soft: "bg-orange-50 dark:bg-orange-500/[0.055]",
    step: "bg-orange-600",
    accent: "text-orange-700 dark:text-orange-300",
    edge: "from-orange-500 to-rose-600",
    button: "text-orange-800",
  },
} as const;

export default function CommercialLandingPage({ page }: { page: CommercialPage }) {
  const theme = THEME_STYLES[page.theme];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-slate-950 dark:bg-[#080911] dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <WebsiteNav />
      <main>
        <section className={`relative overflow-hidden px-4 py-16 text-white sm:px-8 lg:px-16 lg:py-24 ${theme.hero}`}>
          <div aria-hidden="true" className={`pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full blur-[110px] ${theme.glow}`} />
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-white/10 blur-[130px]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">{page.eyebrow}</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">{page.title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">{page.description}</p>
              <p className="mt-5 max-w-2xl text-sm font-bold leading-6 text-white/75">{page.proof}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className={`inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black shadow-xl transition hover:-translate-y-0.5 ${theme.button}`}>GET STARTED <ArrowRight className="h-4 w-4" /></Link>
                <a href="#example" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15"><PlayCircle className="h-4 w-4" /> Try the example</a>
              </div>
              <p className="mt-4 text-xs font-bold text-white/65">500 automated actions/month · 1 Instagram account · 5 active automations</p>
            </div>
            <div className="ap3k-product-float relative mx-auto w-full max-w-[390px]">
              <div aria-hidden="true" className={`pointer-events-none absolute -inset-12 rounded-[4rem] blur-3xl ${theme.glow}`} />
              <div className="relative overflow-hidden rounded-[2.6rem] border border-white/25 bg-[#08090e] p-2 shadow-[0_34px_110px_rgba(10,3,35,.52)] ring-1 ring-black/20">
                <video autoPlay muted loop playsInline poster={page.media} preload="metadata" aria-label={page.mediaAlt} className="aspect-[1200/2128] w-full rounded-[2.15rem] bg-black object-cover object-top">
                  <source src={page.video} type="video/mp4" />
                </video>
              </div>
              <p className="relative mt-4 text-center text-xs font-semibold text-white/65">Real Instagram automation example</p>
            </div>
          </div>
        </section>

        <section className={`px-4 py-20 sm:px-8 lg:px-16 ${theme.soft}`}>
          <div className="mx-auto max-w-6xl">
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${theme.accent}`}>How it works</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">A workflow your team can explain.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {page.workflow.map((item, index) => (
                <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-black text-white ${theme.step}`}>{index + 1}</span>
                  <h3 className="mt-5 font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="example" className="bg-[#11131d] px-4 py-20 text-white sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300">See the logic</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Try a real campaign pattern.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/65">This example mirrors AP3K’s core event order. In production you choose the post, trigger, public reply, DM, and link independently.</p>
            </div>
            <AutomationDemo keyword={page.keyword} />
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${theme.accent}`}>Practical uses</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Built around an outcome, not a diagram.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {page.useCases.map((item) => (
                <div key={item.title} className={`rounded-3xl bg-gradient-to-br p-[1px] ${theme.edge}`}>
                  <div className="h-full rounded-[calc(1.5rem-1px)] bg-white p-6 dark:bg-[#11131d]">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-violet-50 px-4 py-16 dark:bg-violet-500/[0.05] sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <CircleAlert className="h-7 w-7 text-violet-600 dark:text-violet-300" />
              <h2 className="mt-4 text-3xl font-black tracking-tight">Know the limits before launch.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">Reliable automation starts with accurate expectations.</p>
            </div>
            <ul className="grid gap-3">
              {page.limitations.map((limit) => <li key={limit} className="flex gap-3 rounded-2xl border border-violet-200/60 bg-white/80 p-4 text-sm leading-6 dark:border-white/10 dark:bg-white/[0.04]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />{limit}</li>)}
            </ul>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">FAQ</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Questions before you automate.</h2>
              <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
                {page.faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black">{faq.question}<span className="text-xl text-violet-500 transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">{faq.answer}</p></details>)}
              </div>
            </div>
            <aside className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Related tutorials</p>
              <div className="mt-5 grid gap-3">
                {page.tutorials.map((tutorial) => <Link key={tutorial.slug} href={`/blog/${tutorial.slug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-black transition hover:border-violet-300 hover:text-violet-600 dark:border-white/10 dark:hover:border-violet-400/30 dark:hover:text-violet-300">{tutorial.title}<ArrowRight className="h-4 w-4 shrink-0" /></Link>)}
              </div>
              <Link href="/pricing" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500">Compare pricing</Link>
            </aside>
          </div>
        </section>

        <section className={`bg-gradient-to-r px-4 py-16 text-center text-white sm:px-8 ${theme.edge}`}>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Build your first AP3K automation free.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/75">500 automated actions every month. No credit card required.</p>
          <Link href="/sign-up" className={`mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black shadow-xl ${theme.button}`}>GET STARTED <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
