import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import PricingExperience from "@/components/global/pricing-experience";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { BLOG_POSTS } from "@/lib/blog";
import { getAuthenticatedLandingRedirect } from "@/lib/landing-redirect";
import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Reply,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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

const FAQS = [
  ["What does AP3K automate?", "AP3K watches new comments, story interactions, and incoming DMs. When an interaction matches your automation, it can publish a comment reply, send a DM, or run both actions."],
  ["Which Instagram accounts can connect to AP3K?", "AP3K supports Instagram Business and Creator accounts through Instagram's official authorization flow. Personal Instagram accounts must be changed to a professional account before connecting."],
  ["What is the difference between Specific keyword and Any comment?", "Specific keyword runs only when a new comment contains a word you configured, such as GUIDE. Any comment runs for every eligible new comment in that automation's post scope."],
  ["Can AP3K reply publicly and send a DM at the same time?", "Yes. You can enable a public Comment reply, a private DM, or both. When both are enabled, the public reply confirms the action while the DM delivers the private follow-up."],
  ["Can the automated DM include a clickable link?", "Yes. Add your destination URL and edit the button label—for example, Get the Link—so the commenter can open the promised guide, product, booking page, or offer from the DM."],
  ["Will a new automation respond to old interactions?", "No. Automations react to eligible new events received after they are active. They do not go backward through comments or messages that already existed."],
  ["How do I test an automation before promoting it?", "Activate the automation, then trigger it from a different Instagram account. Check the public reply, AP3K Inbox, activity, DM content, and link button before sending traffic to it."],
  ["Will AP3K reply to its own automated comments?", "No. AP3K ignores replies from the connected Instagram account and duplicate comment events so an automation cannot create a reply loop."],
  ["What is included in the AP3K launch trial?", "Connect an eligible Instagram Business or Creator account and AP3K unlocks 500 automated replies for 14 days. After the one-time trial ends, the Free plan starts with 50 automated replies each month."],
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

export default async function LandingPage() {
  const authUser = await currentUser();
  const profile = authUser
    ? await client.user.findUnique({
        where: { clerkId: authUser.id },
        select: {
          clerkId: true,
          integrations: {
            where: { name: "INSTAGRAM" },
            select: { id: true, name: true, instagramId: true, status: true, reconnectRequired: true, token: true },
          },
          automations: { where: { archivedAt: null }, take: 1, select: { id: true } },
        },
      })
    : null;

  const redirectTo = getAuthenticatedLandingRedirect(authUser, profile);
  if (redirectTo) redirect(redirectTo);

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
            <FadeIn className="max-w-[760px] lg:py-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur-xl sm:text-xs">
                <Sparkles className="h-4 w-4" /> Instagram automation, simplified
              </div>
              <h1 className="mt-7 max-w-[760px] text-[3rem] font-black leading-[0.94] tracking-[-0.055em] sm:text-[4.5rem] lg:text-[5rem] xl:text-[5.35rem]">
                Your Instagram <span className="sm:block">just got smarter.</span>
              </h1>
              <p className="mt-6 max-w-[620px] text-base leading-7 text-white/82 sm:text-[1.18rem] sm:leading-8">
                Turn Instagram comments into instant comment replies, DMs, and trackable leads—without living in your inbox.
              </p>
              <p className="mt-4 text-sm font-bold text-white/85">500 automated replies free for 14 days after connecting. No credit card required.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#5f25cb] shadow-[0_16px_45px_rgba(38,10,80,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(38,10,80,0.36)]">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur-xl transition duration-200 hover:bg-white/16">
                  See how it works
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={0.08} className="relative flex min-h-[430px] items-center justify-center sm:min-h-[500px] lg:min-h-[620px]">
              <div className="ap3k-ring-one pointer-events-none absolute h-[78%] w-[78%] rounded-full border border-white/10 bg-white/[0.05] blur-[1px]" />
              <div className="ap3k-ring-two pointer-events-none absolute h-[62%] w-[62%] rounded-full border border-white/10" />
              <ProductVideo
                src="/media/instagram-features_01.mp4"
                label="AP3K Instagram automation demo"
                className="max-w-[270px] sm:max-w-[315px] lg:max-w-[350px]"
                priority
              />
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-slate-200/80 bg-white/85 px-4 py-6 backdrop-blur dark:border-white/8 dark:bg-[#0b0c15]/90 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[10px] font-black uppercase tracking-[0.17em] text-slate-500 dark:text-slate-400 sm:text-xs">
            <span>Instagram Business + Creator</span><span className="text-violet-400">•</span><span>Supported API access</span><span className="text-violet-400">•</span><span>No scraping</span><span className="text-violet-400">•</span><span>No code</span>
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
        </section>

        <section id="features" className="relative bg-[#5521c8] text-white">
          <div className="relative">
            {BENEFITS.map((benefit, index) => (
              <article
                key={benefit.title}
                className={`sticky top-16 flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-t border-white/10 px-4 py-8 sm:px-8 sm:py-10 lg:px-16 ${
                  index === 0
                    ? "bg-[radial-gradient(circle_at_12%_18%,rgba(244,114,182,0.25),transparent_28rem),linear-gradient(135deg,#5521c8,#7832e3)]"
                    : index === 1
                      ? "bg-[radial-gradient(circle_at_86%_22%,rgba(244,114,182,0.22),transparent_28rem),linear-gradient(135deg,#6725d4,#8b35df)]"
                      : "bg-[radial-gradient(circle_at_18%_78%,rgba(30,41,59,0.26),transparent_30rem),linear-gradient(135deg,#5c22cc,#7431df)]"
                }`}
                style={{ zIndex: index + 1 }}
              >
                <FadeIn replay amount={0.42} className="mx-auto w-full max-w-6xl">
                  <div className={`grid items-center gap-7 lg:grid-cols-2 lg:gap-24 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                    <div className="text-center lg:text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200 sm:text-xs">{benefit.kicker}</p>
                      <h2 className="mx-auto mt-3 max-w-xl text-3xl font-black leading-[0.96] tracking-[-0.05em] sm:text-5xl lg:mx-0 lg:mt-4">{benefit.title}</h2>
                      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-base sm:leading-7 lg:mx-0 lg:mt-6 lg:text-lg lg:leading-8">{benefit.body}</p>
                      <div className="mt-7 hidden space-y-3 lg:block">
                        {benefit.bullets.map((bullet) => (
                          <div key={bullet} className="flex items-center gap-3 text-sm font-bold text-white/90">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10"><CheckCircle2 className="h-4 w-4 text-fuchsia-200" /></span>
                            {bullet}
                          </div>
                        ))}
                      </div>
                      <Link href="/sign-up" className="mt-8 hidden items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#6128c8] shadow-lg transition hover:-translate-y-0.5 lg:inline-flex">Try it free <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    <div className="mx-auto flex w-full items-center justify-center">
                      <ProductVideo src={benefit.src} label={benefit.label} className="w-[min(60vw,250px)] sm:w-[260px] lg:w-full lg:max-w-[300px]" />
                    </div>
                  </div>
                </FadeIn>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white px-4 py-20 dark:bg-[#0b0c15] sm:px-8 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="text-center">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Less busywork</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Stop doing overtime. Start replying in real time.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-slate-400">Build the automation once, then let AP3K handle the repetitive first touch while you stay in control.</p>
            </FadeIn>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <FadeIn>
                <div className="h-full rounded-[2rem] border border-rose-200 bg-rose-50/80 p-7 shadow-sm dark:border-rose-400/15 dark:bg-rose-400/[0.045] sm:p-9">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Without automation</p>
                  <h3 className="mt-4 text-2xl font-black">You are doing the same work again and again.</h3>
                  <div className="mt-7 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                    {["Watch comments manually", "Copy the same replies", "Jump between comments and inbox", "Lose leads when response time slips"].map((item) => <p key={item} className="flex gap-3"><span className="font-black text-rose-500">×</span>{item}</p>)}
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.06}>
                <div className="h-full rounded-[2rem] border border-emerald-200 bg-emerald-50/80 p-7 shadow-sm dark:border-emerald-400/15 dark:bg-emerald-400/[0.045] sm:p-9">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">With AP3K</p>
                  <h3 className="mt-4 text-2xl font-black">The first response happens automatically.</h3>
                  <div className="mt-7 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                    {["Automation listens for eligible interactions", "Trigger matches automatically", "Configured response sends", "Activity and leads stay organized"].map((item) => <p key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />{item}</p>)}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-[#f1edfb] px-4 py-20 dark:bg-[#0e1020] sm:px-8 lg:px-16 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.98fr_1.02fr] lg:gap-24">
            <FadeIn>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Start in minutes</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">New to automation? Do not overthink it.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-400">The customer flow is intentionally simple: Post → Trigger → Actions → Review.</p>
              <div className="mt-8 space-y-3">
                {[
                  ["01", "Connect Instagram", "Authorize your professional Instagram account."],
                  ["02", "Choose a post + trigger", "Use a keyword or any eligible comment."],
                  ["03", "Choose Actions", "Reply to comment, Send a DM, or enable both."],
                  ["04", "Activate", "AP3K starts listening and records the activity."],
                ].map(([num, title, copy]) => (
                  <div key={num} className="flex gap-4 rounded-2xl border border-violet-200/80 bg-white/90 p-4 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-xs font-black text-white">{num}</span>
                    <div><p className="font-black">{title}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{copy}</p></div>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.06}>
              <div className="rounded-[2.2rem] border border-violet-200/70 bg-[linear-gradient(145deg,#f9f7ff,#ece5ff)] p-8 shadow-[0_25px_80px_rgba(91,33,200,0.12)] dark:border-white/8 dark:bg-[linear-gradient(145deg,#15172a,#111221)] sm:p-12">
                <ProductVideo src="/media/templates_05.mp4" label="AP3K automation setup demo" className="max-w-[280px]" />
              </div>
            </FadeIn>
          </div>
        </section>

        <section id="pricing" className="bg-[#f7f7fb] px-4 py-16 dark:bg-[#080911] sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <FadeIn className="mb-8 text-center">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Simple pricing</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Start free. Save more annually.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-slate-400">Connect Instagram for a one-time 14-day trial with 500 replies. Then stay Free with 50 replies/month, choose Pro at $9/month, or Business at $29/month.</p>
            </FadeIn>
            <FadeIn delay={0.04}><PricingExperience compact /></FadeIn>
            <div className="mt-8 text-center"><Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">See the full plan comparison <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 dark:bg-[#0b0c15] sm:px-8 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Instagram automation guides</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Learn the strategy behind the automation.</h2></div>
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">Explore the blog <ArrowRight className="h-4 w-4" /></Link>
            </FadeIn>
            <StaggerContainer className="mt-10 grid gap-5 md:grid-cols-3">
              {BLOG_POSTS.slice(0, 3).map((post) => (
                <StaggerItem key={post.slug}>
                  <HoverLift>
                    <Link href={`/blog/${post.slug}`} className="block h-full rounded-[1.8rem] border border-slate-200 bg-[#fafafe] p-6 shadow-sm transition hover:border-violet-200 dark:border-white/8 dark:bg-[#10121d] dark:hover:border-violet-400/20">
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
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-[#6128c8] shadow-xl transition hover:-translate-y-0.5">Start free <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">View pricing</Link>
            </div>
          </FadeIn>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
