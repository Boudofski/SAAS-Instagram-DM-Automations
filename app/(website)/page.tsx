import HomeSetup from "@/components/website/home-setup";
import HomeShowcase from "@/components/website/home-showcase";
import HomeHero from "@/components/website/home-hero";
import LocalizedCopy from "@/components/i18n/localized-copy";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import { SITE_METADATA } from "@/lib/i18n/metadata";
import { COMPANY_SCHEMA } from "@/lib/company";
import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import PricingExperience from "@/components/global/pricing-experience";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { getPublishedPosts } from "@/lib/editorial-server";
import {
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import HomeFeatures from "@/components/website/home-features";
import HomeScrollProgress from "@/components/website/home-scroll-progress";
import { getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const SOLUTION_PAGES = [
  ["Instagram DM automation", "/instagram-dm-automation", "Automate useful private follow-up after comments, stories, and messages."],
  ["Comment-to-DM automation", "/instagram-comment-to-dm", "Turn a clear Instagram keyword into the promised DM or link."],
  ["Instagram automation for creators", "/instagram-automation-for-creators", "Deliver guides, launch details, and product links without repetitive inbox work."],
  ["Instagram automation for coaches", "/instagram-automation-for-coaches", "Move high-intent comments toward a resource, application, or booking."],
  ["Instagram automation for ecommerce", "/instagram-automation-for-ecommerce", "Connect product interest to the right storefront destination."],
  ["A focused ManyChat alternative", "/manychat-alternative", "Use a simpler Instagram-first workflow when you do not need a broad multi-channel builder."],
] as const;

const FAQS = [
  ["What does AP3K automate?", "AP3K watches new comments, story interactions, and incoming DMs. When an interaction matches your automation, it can publish a comment reply, send a DM, or run both actions."],
  ["Which Instagram accounts can connect to AP3K?", "AP3K supports Instagram Business and Creator accounts through Instagram's official authorization flow. Personal Instagram accounts must be changed to a professional account before connecting."],
  ["What is the difference between Specific keyword and Any comment?", "Specific keyword runs only when a new comment contains a word you configured, such as GUIDE. Any comment runs for every eligible new comment in that automation's post scope."],
  ["Can AP3K reply publicly and send a DM at the same time?", "Yes. You can enable a public Comment reply, a private DM, or both. When both are enabled, the public reply confirms the action while the DM delivers the private follow-up."],
  ["Can the automated DM include a clickable link?", "Yes. Add your destination URL and edit the button label—for example, Get the Link—so the commenter can open the promised guide, product, booking page, or offer from the DM."],
  ["Will a new automation respond to old interactions?", "No. Automations react to eligible new events received after they are active. They do not go backward through comments or messages that already existed."],
  ["How do I test an automation before promoting it?", "Activate the automation, then trigger it from a different Instagram account. Check the public reply, AP3K Inbox, activity, DM content, and link button before sending traffic to it."],
  ["Will AP3K reply to its own automated comments?", "No. AP3K ignores replies from the connected Instagram account and duplicate comment events so an automation cannot create a reply loop."],
  ["What is included in the AP3K Free plan?", "Free includes 500 automated actions each month, one Instagram Business or Creator account, and up to five active automations. AI replies are available on paid plans."],
  ["How does the AP3K referral program work?", "Share your tracked link from the Refer & earn dashboard. When a new referred user connects Instagram and completes a qualifying paid Pro or Business invoice, eligible Founding 10 partners earn a $9 AP3K account credit."],
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AP3K",
  publisher: COMPANY_SCHEMA,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://ap3k.com",
  description: "Instagram comment and DM automation for Business and Creator accounts.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro Monthly", price: "9", priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro Annual", price: "79", priceCurrency: "USD" },
    { "@type": "Offer", name: "Business Monthly", price: "29", priceCurrency: "USD" },
    { "@type": "Offer", name: "Business Annual", price: "279", priceCurrency: "USD" },
  ],
};

export default async function LandingPage() {
  const posts = await getPublishedPosts();
  const locale = getServerLocale();
  const localizedSoftware = { ...softwareSchema, inLanguage: locale,
    url: `https://ap3k.com${localizePublicPath("/", locale)}`,
    description: SITE_METADATA[locale].description };
  const localizedFaq = { ...faqSchema, inLanguage: locale,
    mainEntity: FAQS.map(([question, answer]) => ({
      "@type": "Question", name: translateUi(question, locale),
      acceptedAnswer: { "@type": "Answer", text: translateUi(answer, locale) },
    })) };
  const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite",
    "@id": "https://ap3k.com/#website", url: "https://ap3k.com/", name: "AP3K",
    alternateName: "AP3K DM Automation", publisher: COMPANY_SCHEMA };


  return (
    <LocalizedCopy><div className="ap3k-home min-h-screen overflow-hidden bg-[#f7f7fb] text-slate-950 transition-colors dark:bg-[#080911] dark:text-white">
      <HomeScrollProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizedSoftware).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizedFaq).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c") }} />
      <WebsiteNav current="home" />

      <main>
        <HomeHero />
        <HomeShowcase />

        <HomeSetup />

        <HomeFeatures />

        <section id="pricing" className="bg-[#f7f7fb] px-4 py-16 dark:bg-[#080911] sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <FadeIn className="mb-8 text-center">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Simple pricing</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Start free. Save more annually.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-slate-400">Start Free with 500 automated actions each month and up to 5 active automations, choose Pro at $9/month, or Business at $29/month.</p>
            </FadeIn>
            <FadeIn delay={0.04}><PricingExperience compact /></FadeIn>
            <div className="mt-8 text-center"><Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">See the full plan comparison <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-20 dark:border-white/10 dark:bg-[#0b0c15] sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Explore by goal</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Start with the Instagram outcome you need.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-400">See practical workflows, real product previews, honest limitations, and setup tutorials for each use case.</p>
            </FadeIn>
            <StaggerContainer className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SOLUTION_PAGES.map(([title, href, description]) => (
                <StaggerItem key={href}>
                  <Link href={href} className="group block h-full rounded-2xl border border-slate-200 bg-[#fafafe] p-6 transition motion-safe:hover:-translate-y-px hover:border-violet-300 hover:shadow-surface dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-violet-400/30">
                    <h3 className="text-lg font-black">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="bg-white px-4 py-20 dark:bg-[#0b0c15] sm:px-8 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Instagram automation guides</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Learn the strategy behind the automation.</h2></div>
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">Explore the blog <ArrowRight className="h-4 w-4" /></Link>
            </FadeIn>
            <StaggerContainer className="mt-10 grid gap-5 md:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <StaggerItem key={post.slug}>
                  <HoverLift>
                    <Link href={`/blog/${post.slug}`} className="block h-full rounded-2xl border border-slate-200 bg-[#fafafe] p-6 shadow-sm transition hover:border-violet-200 dark:border-white/8 dark:bg-[#10121d] dark:hover:border-violet-400/20">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Guide</p>
                      <h3 className="mt-4 text-xl font-black leading-tight">{post.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{post.description}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">Read guide <ArrowRight className="h-4 w-4" /></span>
                    </Link>
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="bg-[#11131d] px-4 py-20 text-white sm:px-8 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <FadeIn className="text-center"><p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">FAQs</p><h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">The important questions, answered.</h2></FadeIn>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {FAQS.map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left font-black"><span>{question}</span><span className="text-2xl font-light text-violet-300 transition group-open:rotate-45">+</span></summary>
                  <p className="max-w-3xl pb-2 pt-4 text-sm leading-7 text-white/62">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#5420ca,#7331e5_50%,#963be5)] px-4 py-20 text-center text-white sm:px-8 lg:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.32),transparent_32rem)]" />
          <FadeIn className="relative mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Your next comment can become a customer</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-6xl">Start automating Instagram today.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/78">Create your first automation, test it from another Instagram account, and let AP3K handle the repetitive follow-up.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-[#6128c8] shadow-xl transition motion-safe:hover:-translate-y-px">GET STARTED <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">View pricing</Link>
            </div>
          </FadeIn>
        </section>
      </main>

      <WebsiteFooter />
    </div></LocalizedCopy>
  );
}
