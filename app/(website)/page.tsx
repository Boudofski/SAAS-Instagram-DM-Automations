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
  Clock3,
  MessageCircle,
  Reply,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const PROOF = [
  ["Instagram", "Business + Creator", "bg-white/15 text-white"],
  ["Triggers", "Keyword or any comment", "bg-white/15 text-white"],
  ["Actions", "Comment reply + DM", "bg-white/15 text-white"],
  ["Setup", "No code required", "bg-white/15 text-white"],
] as const;

const BENEFITS = [
  {
    kicker: "Comment automation",
    title: "Turn comments into conversations that keep moving.",
    body: "Choose a keyword or any eligible comment, then let AP3K react immediately while the intent is still fresh.",
    bullets: ["Match keywords or any comment", "Keep every campaign organized", "See activity as it happens"],
    src: "/media/instagram-features_02.mp4",
    label: "Comment triggers",
  },
  {
    kicker: "Lead capture",
    title: "Catch interested people before the moment disappears.",
    body: "Move the right commenters into a DM and keep the campaign activity and lead context in one place.",
    bullets: ["Send the requested follow-up by DM", "Track campaign leads", "Reduce manual inbox follow-up"],
    src: "/media/instagram-features_03.mp4",
    label: "Lead flow",
  },
  {
    kicker: "Always-on engagement",
    title: "Reply while your audience is still paying attention.",
    body: "AP3K can reply under the post, send a DM, or do both—using the exact actions you configured for the campaign.",
    bullets: ["Reply to comments automatically", "Send DMs after eligible comments", "Use one action or both"],
    src: "/media/instagram-features_04.mp4",
    label: "Reply + DM",
  },
] as const;

const FAQS = [
  ["Do I need coding skills?", "No. Connect an Instagram Business or Creator account, choose a post, set the trigger, choose your actions, and activate the campaign."],
  ["Can AP3K reply to comments and send DMs?", "Yes. A campaign can Reply to comment, Send a DM, or do both when an eligible Instagram comment matches the trigger."],
  ["How are automated replies counted?", "Each successfully sent Comment reply counts as one automated reply, and each successfully sent DM counts as one automated reply. Failed or skipped actions do not count."],
  ["Do annual plans still reset usage monthly?", "Yes. Annual billing changes how you pay, not the monthly usage cycle. Your automated reply allowance resets each month."],
  ["Which Instagram accounts work?", "AP3K is designed for Instagram professional accounts supported by the current Instagram Business API flow, including Business and Creator accounts."],
  ["Can I change or cancel my plan later?", "Yes. Paid subscriptions can be managed through the Billing center and Stripe customer portal."],
] as const;

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

function ProductVideo({ src, label, className = "" }: { src: string; label: string; className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[330px] ${className}`}>
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-fuchsia-400/25 via-violet-500/20 to-cyan-300/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2.4rem] border border-white/20 bg-[#101014] p-2.5 shadow-[0_30px_90px_rgba(24,8,56,0.35)]">
        <div className="mb-2 flex items-center justify-between px-2 pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
          <span>AP3K demo</span>
          <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-300">Live</span>
        </div>
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
          className="aspect-[240/426] w-full rounded-[1.8rem] bg-black object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>
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
    <div className="min-h-screen overflow-hidden bg-[#fbfbfe] text-slate-950 dark:bg-[#09090b] dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema).replace(/</g, "\\u003c") }} />
      <WebsiteNav current="home" />

      <main>
        <section className="relative overflow-hidden bg-[#7738e7] px-4 pb-20 pt-14 text-white sm:px-8 sm:pt-20 lg:px-16 lg:pb-28">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-[90px]" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-950/35 blur-[110px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <FadeIn>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur">
                <Sparkles className="h-4 w-4" /> Instagram automation, simplified
              </div>
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-[5.8rem]">
                Your Instagram just got smarter.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/80 sm:text-xl">
                Turn Instagram comments into instant Comment replies, DMs, and trackable leads—without living in your inbox.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#6128c8] shadow-[0_16px_40px_rgba(33,8,70,0.24)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(33,8,70,0.32)]">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                  See how it works
                </a>
              </div>
              <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {PROOF.map(([label, value, accent]) => (
                  <div key={value} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur">
                    <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest ${accent}`}>{label}</span>
                    <p className="mt-3 text-xs font-bold leading-5 text-white/85">{value}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.12} className="relative">
              <div className="relative mx-auto max-w-[590px] rounded-[2.2rem] border border-white/15 bg-[#131018]/90 p-4 shadow-[0_40px_120px_rgba(34,10,72,0.45)] backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2">Instagram campaign in action</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-[0.85fr_1.15fr] sm:items-center">
                  <ProductVideo src="/media/instagram-features_01.mp4" label="AP3K Instagram automation demo" className="max-w-[250px]" />
                  <div className="space-y-3">
                    {["Someone comments GUIDE", "AP3K matches the trigger", "Reply to comment", "Send the DM", "Track the lead"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 text-sm font-bold text-white/90">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fuchsia-400/15 text-xs font-black text-fuchsia-200">{index + 1}</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white px-4 py-7 dark:border-white/10 dark:bg-[#0d0d10] sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
            <span>Instagram Business + Creator</span><span>•</span><span>Approved Instagram permissions</span><span>•</span><span>No scraping</span><span>•</span><span>No code</span>
          </div>
        </section>

        <section className="bg-white px-4 py-24 text-center dark:bg-[#0d0d10] sm:px-8">
          <FadeIn className="mx-auto max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#7738e7]">Put growth on autopilot</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-6xl">Stop manually chasing every Instagram comment.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-white/60 sm:text-lg">
              AP3K handles the repetitive first response so you can focus on content, offers, customers, and the conversations that actually need you.
            </p>
          </FadeIn>
          <StaggerContainer className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-4">
            {[
              [MessageCircle, "Comment replies", "Respond under the post automatically."],
              [Reply, "DM follow-up", "Move eligible commenters into a private conversation."],
              [Users, "Lead tracking", "Keep campaign leads and activity together."],
              [Clock3, "Time back", "Stop repeating the same inbox work all day."],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof MessageCircle;
              return (
                <StaggerItem key={title as string}>
                  <HoverLift>
                    <div className="h-full rounded-[1.8rem] border border-slate-200 bg-[#fbfbfe] p-6 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7738e7]/10 text-[#7738e7]"><FeatureIcon className="h-5 w-5" /></div>
                      <h3 className="mt-5 text-lg font-black">{title as string}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/55">{copy as string}</p>
                    </div>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>

        <section id="features" className="relative overflow-hidden bg-[#7738e7] px-4 py-24 text-white sm:px-8 lg:px-16 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(244,114,182,0.24),transparent_25rem),radial-gradient(circle_at_85%_70%,rgba(15,23,42,0.25),transparent_30rem)]" />
          <div className="relative mx-auto max-w-6xl space-y-28 lg:space-y-36">
            {BENEFITS.map((benefit, index) => (
              <div key={benefit.title} className={`grid items-center gap-14 lg:grid-cols-2 lg:gap-24 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <FadeIn>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">{benefit.kicker}</p>
                  <h2 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-5xl">{benefit.title}</h2>
                  <p className="mt-6 max-w-xl text-base leading-8 text-white/72 sm:text-lg">{benefit.body}</p>
                  <div className="mt-7 space-y-3">
                    {benefit.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-3 text-sm font-bold text-white/88">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10"><CheckCircle2 className="h-4 w-4 text-fuchsia-200" /></span>{bullet}
                      </div>
                    ))}
                  </div>
                  <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#6128c8] transition hover:-translate-y-1">Try it free <ArrowRight className="h-4 w-4" /></Link>
                </FadeIn>
                <FadeIn delay={0.08}><ProductVideo src={benefit.src} label={benefit.label} /></FadeIn>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white px-4 py-24 dark:bg-[#0d0d10] sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="text-center">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#7738e7]">Less busywork</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-6xl">Stop doing overtime. Start replying in real time.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-white/55">Build the campaign once, then let AP3K handle the repetitive first touch while you stay in control.</p>
            </FadeIn>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <FadeIn>
                <div className="h-full rounded-[2rem] border border-rose-200 bg-rose-50 p-7 dark:border-rose-400/15 dark:bg-rose-400/[0.05] sm:p-9">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Without automation</p>
                  <h3 className="mt-4 text-2xl font-black">You are doing the same work again and again.</h3>
                  <div className="mt-7 space-y-4 text-sm text-slate-700 dark:text-white/65">
                    {["Watch comments manually", "Copy the same replies", "Jump between comments and inbox", "Lose leads when response time slips"].map((item) => <p key={item} className="flex gap-3"><span className="font-black text-rose-500">×</span>{item}</p>)}
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.08}>
                <div className="h-full rounded-[2rem] border border-emerald-200 bg-emerald-50 p-7 dark:border-emerald-400/15 dark:bg-emerald-400/[0.05] sm:p-9">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">With AP3K</p>
                  <h3 className="mt-4 text-2xl font-black">The first response happens automatically.</h3>
                  <div className="mt-7 space-y-4 text-sm text-slate-700 dark:text-white/65">
                    {["Campaign listens for eligible comments", "Trigger matches automatically", "Comment reply and/or DM sends", "Activity and leads stay organized"].map((item) => <p key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</p>)}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-[#f7f4ff] px-4 py-24 dark:bg-[#111015] sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24">
            <FadeIn>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7738e7]">Start in minutes</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">New to automation? Do not overthink it.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-white/58">The customer flow is intentionally simple: Post → Trigger → Actions → Review.</p>
              <div className="mt-8 space-y-4">
                {[
                  ["01", "Connect Instagram", "Authorize your professional Instagram account."],
                  ["02", "Choose a post + trigger", "Use a keyword or any eligible comment."],
                  ["03", "Choose Actions", "Reply to comment, Send a DM, or enable both."],
                  ["04", "Activate", "AP3K starts listening and records the activity."],
                ].map(([num, title, copy]) => (
                  <div key={num} className="flex gap-4 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#7738e7] text-xs font-black text-white">{num}</span>
                    <div><p className="font-black">{title}</p><p className="mt-1 text-sm text-slate-600 dark:text-white/55">{copy}</p></div>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.08}>
              <div className="rounded-[2rem] bg-gradient-to-br from-fuchsia-500 via-[#7738e7] to-indigo-600 p-8 sm:p-12">
                <ProductVideo src="/media/templates_05.mp4" label="AP3K campaign setup demo" />
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="bg-white px-4 py-20 dark:bg-[#0d0d10] sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-slate-200 bg-[#111114] px-6 py-12 text-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] dark:border-white/10 sm:px-10 lg:px-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <FadeIn>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-300">Built on supported access</p>
                <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">No Instagram password. No scraping. No browser bot pretending to be you.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">AP3K uses Instagram authorization and the approved Instagram Business API permissions required for profile/media access, comment management, and messaging.</p>
              </FadeIn>
              <div className="grid grid-cols-3 gap-3">
                {[ShieldCheck, Zap, TrendingUp].map((Icon, index) => <div key={index} className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]"><Icon className="h-5 w-5 text-fuchsia-300" /></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#fbfbfe] px-4 py-24 dark:bg-[#09090b] sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <FadeIn className="mb-12 text-center">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#7738e7]">Simple pricing</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-6xl">Start free. Save more annually.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-white/55">Pro is $9/month or $79/year. Business is $29/month or $279/year. Annual billing saves up to 27% while usage still resets monthly.</p>
            </FadeIn>
            <FadeIn delay={0.05}><PricingExperience compact /></FadeIn>
            <div className="mt-8 text-center"><Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-black text-[#7738e7]">See the full plan comparison <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>

        <section className="bg-white px-4 py-24 dark:bg-[#0d0d10] sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#7738e7]">Instagram automation guides</p><h2 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Learn the strategy behind the automation.</h2></div>
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-[#7738e7]">Explore the blog <ArrowRight className="h-4 w-4" /></Link>
            </FadeIn>
            <StaggerContainer className="mt-10 grid gap-5 md:grid-cols-3">
              {BLOG_POSTS.slice(0, 3).map((post) => (
                <StaggerItem key={post.slug}>
                  <HoverLift>
                    <Link href={`/blog/${post.slug}`} className="block h-full rounded-[1.8rem] border border-slate-200 bg-[#fbfbfe] p-6 dark:border-white/10 dark:bg-white/[0.03]">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7738e7]">Guide</p>
                      <h3 className="mt-4 text-xl font-black leading-tight">{post.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/55">{post.description}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#7738e7]">Read guide <ArrowRight className="h-4 w-4" /></span>
                    </Link>
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="bg-[#111114] px-4 py-24 text-white sm:px-8 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <FadeIn className="text-center"><p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-300">FAQs</p><h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">The important questions, answered.</h2></FadeIn>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {FAQS.map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left font-black"><span>{question}</span><span className="text-2xl font-light text-fuchsia-300 transition group-open:rotate-45">+</span></summary>
                  <p className="max-w-3xl pb-2 pt-4 text-sm leading-7 text-white/60">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#7738e7] px-4 py-20 text-center text-white sm:px-8 lg:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.35),transparent_30rem)]" />
          <FadeIn className="relative mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Your next comment can become a customer</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Start automating Instagram today.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/75">Create your first campaign, test it from another Instagram account, and let AP3K handle the repetitive follow-up.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-[#6128c8] shadow-xl transition hover:-translate-y-1">Start free <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">View pricing</Link>
            </div>
          </FadeIn>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
