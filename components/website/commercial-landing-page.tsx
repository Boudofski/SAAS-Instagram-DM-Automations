import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import AutomationDemo from "@/components/website/automation-demo";
import type { CommercialPage } from "@/lib/commercial-pages";
import { ArrowRight, CheckCircle2, CircleAlert, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CommercialLandingPage({ page }: { page: CommercialPage }) {
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
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_82%_20%,rgba(217,70,239,0.28),transparent_28rem),linear-gradient(135deg,#32107e,#6225cc_48%,#8b2ed8)] px-4 py-16 text-white sm:px-8 lg:px-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">{page.eyebrow}</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">{page.title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">{page.description}</p>
              <p className="mt-5 max-w-2xl text-sm font-bold leading-6 text-white/75">{page.proof}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-violet-700 shadow-xl transition hover:-translate-y-0.5">Start Free — No Credit Card <ArrowRight className="h-4 w-4" /></Link>
                <a href="#example" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15"><PlayCircle className="h-4 w-4" /> Try the example</a>
              </div>
              <p className="mt-4 text-xs font-bold text-white/65">500 automated actions/month · 1 Instagram account · 5 active automations</p>
            </div>
            <div className="mx-auto w-full max-w-[430px]">
              <div className="relative overflow-hidden rounded-[2.4rem] border border-white/20 bg-black p-2 shadow-[0_30px_100px_rgba(20,4,55,.45)]">
                <Image src={page.media} alt={page.mediaAlt} width={1156} height={2056} priority sizes="(max-width: 1024px) 80vw, 430px" className="aspect-[9/16] w-full rounded-[2rem] object-cover object-top" />
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-white/60">Real AP3K product workflow</p>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">How it works</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">A workflow your team can explain.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {page.workflow.map((item, index) => (
                <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-xs font-black text-white">{index + 1}</span>
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Practical uses</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Built around an outcome, not a diagram.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {page.useCases.map((item) => (
                <div key={item.title} className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-[1px]">
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

        <section className="bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-16 text-center text-white sm:px-8">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Build your first AP3K automation free.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/75">500 automated actions every month. No credit card required.</p>
          <Link href="/sign-up" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-violet-700 shadow-xl">Start Free — No Credit Card <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
