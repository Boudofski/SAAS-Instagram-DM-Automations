import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import PricingExperience from "@/components/global/pricing-experience";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { BLOG_POSTS } from "@/lib/blog";
import {
  ArrowRight,
  CheckCircle2,
  BadgeCheck,
  Infinity,
  MessageCircle,
  Reply,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

const VALUE_CARDS = [
  {
    step: "01",
    icon: MessageCircle,
    title: "Choose the trigger",
    copy: "Use a specific keyword like GUIDE, or respond to any eligible comment on the post.",
  },
  {
    step: "02",
    icon: Reply,
    title: "Reply publicly",
    copy: "AP3K posts one of your saved replies so the commenter knows to check their DMs.",
  },
  {
    step: "03",
    icon: Send,
    title: "Send the DM",
    copy: "Deliver your message and optional link button automatically while interest is fresh.",
  },
  {
    step: "04",
    icon: Users,
    title: "See what happened",
    copy: "Keep replies, DMs, automation activity, and captured leads together in AP3K.",
  },
] as const;

const BENEFITS = [
  {
    kicker: "Comment automation",
    title: "Turn comments into conversations that keep moving.",
    body: "Choose a keyword or any eligible comment, then let AP3K react immediately while intent is still fresh.",
    bullets: ["Match keywords or any comment", "Keep every automation organized", "See activity as it happens"],
    src: "/media/instagram-features_02.mp4",
    label: "Comment triggers",
  },
  {
    kicker: "Lead capture",
    title: "Catch interested people before the moment disappears.",
    body: "Move the right commenters into a DM and keep the automation activity and lead context in one place.",
    bullets: ["Send the requested follow-up by DM", "Track automation leads", "Reduce manual inbox follow-up"],
    src: "/media/instagram-features_03.mp4",
    label: "Lead flow",
  },
  {
    kicker: "Always-on engagement",
    title: "Reply while your audience is still paying attention.",
    body: "AP3K can reply under the post, send a DM, or do both—using the exact actions you configured for the automation.",
    bullets: ["Reply to comments automatically", "Send DMs after eligible comments", "Use one action or both"],
    src: "/media/instagram-features_04.mp4",
    label: "Reply and DM",
  },
] as const;

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

function ProductVideo({
  src,
  label,
  className = "",
  priority = false,
}: {
  src: string;
  label: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`ap3k-product-float relative mx-auto w-full max-w-[320px] ${className}`}>
      <div className="pointer-events-none absolute -inset-10 rounded-[4rem] bg-[radial-gradient(circle,rgba(244,114,182,0.28),rgba(124,58,237,0.16)_42%,transparent_70%)] blur-2xl" />
      <div className="ap3k-video-frame relative rounded-[2.7rem] border border-white/25 bg-[#090a10] p-[7px] shadow-[0_34px_90px_rgba(25,7,66,0.36)] ring-1 ring-black/25 dark:ring-white/10">
        <div className="overflow-hidden rounded-[2.32rem] bg-black">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={priority ? "/media/ap3k-product-01.jpg" : undefined}
            preload={priority ? "auto" : "metadata"}
            aria-label={label}
            className="aspect-[240/426] w-full bg-black object-cover"
          >
            <source src={src} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7fb] text-slate-950 transition-colors dark:bg-[#080911] dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <WebsiteNav current="home" />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#5121c7_0%,#7435e8_44%,#9c3eea_100%)] px-4 pb-20 pt-12 text-white sm:px-8 sm:pb-24 sm:pt-20 lg:px-16 lg:pb-28 lg:pt-20">
          <div className="ap3k-orb-one pointer-events-none absolute -left-28 top-12 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-[100px]" />
          <div className="ap3k-orb-two pointer-events-none absolute -right-24 bottom-0 h-[34rem] w-[34rem] rounded-full bg-indigo-950/35 blur-[130px]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16 xl:gap-20">
            <div className="max-w-[760px] lg:py-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur-xl sm:text-xs">
                <Sparkles className="h-4 w-4" /> Instagram Comment &amp; DM Automation
              </div>
              <h1 className="mt-7 max-w-[760px] text-[3rem] font-black leading-[0.94] tracking-[-0.055em] sm:text-[4.5rem] lg:text-[5rem] xl:text-[5.35rem]">
                Turn Instagram Comments <span className="sm:block">Into Customers.</span>
              </h1>
              <p className="mt-6 max-w-[620px] text-base leading-7 text-white/82 sm:text-[1.18rem] sm:leading-8">
                Automatically reply to comments, send the promised link by DM, and track every lead—without complicated flows or code.
              </p>
              <p className="mt-4 text-sm font-bold text-white/85">500 automated actions every month. No credit card required.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#5f25cb] shadow-[0_16px_45px_rgba(38,10,80,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(38,10,80,0.36)]">
                  GET STARTED <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur-xl transition duration-200 hover:bg-white/16">
                  See how it works
                </a>
              </div>
              <div aria-label="AP3K platform credentials" className="mt-5 flex flex-wrap items-center gap-2">
                <div className="inline-flex h-8 items-center gap-2 rounded-full border border-white/20 bg-[#21133d]/35 px-2.5 text-[11px] font-semibold text-white/90 shadow-sm backdrop-blur-xl sm:h-9 sm:px-3.5 sm:text-xs">
                  <Infinity aria-hidden="true" className="h-4 w-4 shrink-0 stroke-[2.5] text-[#66b4ff] sm:h-5 sm:w-5" />
                  Meta Business Partner
                </div>
                <div className="inline-flex h-8 items-center gap-2 rounded-full border border-white/20 bg-[#21133d]/35 px-2.5 text-[11px] font-semibold text-white/90 shadow-sm backdrop-blur-xl sm:h-9 sm:px-3.5 sm:text-xs">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-white/75" />
                  Official Instagram API
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[430px] items-center justify-center sm:min-h-[500px] lg:min-h-[620px]">
              <div className="ap3k-ring-one pointer-events-none absolute h-[78%] w-[78%] rounded-full border border-white/10 bg-white/[0.05] blur-[1px]" />
              <div className="ap3k-ring-two pointer-events-none absolute h-[62%] w-[62%] rounded-full border border-white/10" />
              <ProductVideo
                src="/media/instagram-features_01.mp4"
                label="AP3K Instagram automation demo"
                className="max-w-[270px] sm:max-w-[315px] lg:max-w-[350px]"
                priority
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,#f8f7fc_0%,#f2effa_100%)] px-4 py-20 dark:border-white/[0.08] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.18),transparent_34rem),linear-gradient(180deg,#080911_0%,#0c0d19_100%)] sm:px-8 lg:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-600/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-fuchsia-200/25 blur-3xl dark:bg-fuchsia-500/[0.08]" />

          <div className="relative mx-auto max-w-6xl">
            <FadeIn className="mx-auto max-w-4xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-600 dark:text-violet-300 sm:text-sm">The AP3K workflow</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-6xl">
                From Instagram comment to delivered link—automatically.
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Choose the post, trigger, and actions once. When the right comment arrives, AP3K can publish your reply, send the DM and link, and record the result.
              </p>
            </FadeIn>

            <StaggerContainer className="relative mt-12 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div aria-hidden="true" className="pointer-events-none absolute left-[8%] right-[8%] top-6 hidden h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent dark:via-violet-400/25 lg:block" />
              {VALUE_CARDS.map(({ step, icon: Icon, title, copy }) => (
                <StaggerItem key={title} className="h-full">
                  <HoverLift className="h-full">
                    <div className="group relative h-full overflow-hidden rounded-[1.7rem] border border-slate-200/90 bg-white/90 p-6 text-left shadow-[0_16px_45px_rgba(42,27,78,0.07)] backdrop-blur-sm transition-colors hover:border-violet-300 dark:border-violet-300/[0.14] dark:bg-[#111320] dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)] dark:hover:border-violet-300/30">
                      <div aria-hidden="true" className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/75 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-violet-300/70 dark:opacity-60" />
                      <div className="flex items-center justify-between gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-200/80 dark:bg-violet-400/[0.12] dark:text-violet-200 dark:ring-violet-300/20">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-full border border-violet-200/80 bg-violet-50 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-violet-700 dark:border-violet-300/15 dark:bg-violet-300/[0.07] dark:text-violet-200">
                          {step}
                        </span>
                      </div>
                      <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300/80">{copy}</p>
                    </div>
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
   