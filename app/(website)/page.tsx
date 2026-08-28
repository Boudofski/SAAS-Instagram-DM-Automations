import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import PricingExperience from "@/components/global/pricing-experience";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import AutomationFlowDemo from "@/components/website/automation-flow-demo";
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

const VALUE_CARDS = [
  { icon: MessageCircle, title: "They comment", copy: "A keyword—or any eligible comment—starts your campaign instantly." },
  { icon: Reply, title: "AP3K replies", copy: "Send a public reply, a private DM, or both in seconds." },
  { icon: Users, title: "You capture the lead", copy: "Keep the person, campaign, and conversation context together." },
  { icon: Clock3, title: "You stay focused", copy: "Create content and close customers instead of copying replies." },
] as const;

const BENEFITS = [
  {
    kicker: "Comment automation",
    title: "Turn comments into conversations that keep moving.",
    body: "Choose a keyword or any eligible comment, then let AP3K react immediately while intent is still fresh.",
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
    label: "Reply and DM",
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
    <div className={`relative mx-auto w-full max-w-[320px] ${className}`}>
      <div className="pointer-events-none absolute -inset-10 rounded-[4rem] bg-[radial-gradient(circle,rgba(244,114,182,0.28),rgba(124,58,237,0.16)_42%,transparent_70%)] blur-2xl" />
      <div className="relative rounded-[2.7rem] border border-white/25 bg-[#090a10] p-[7px] shadow-[0_34px_90px_rgba(25,7,66,0.36)] ring-1 ring-black/25 dark:ring-white/10">
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
      <WebsiteNav current="home" />

      <main>
        <section className="ap3k-hero-mesh relative overflow-hidden px-4 pb-16 pt-10 text-white sm:px-8 sm:pb-24 sm:pt-16 lg:px-16 lg:pb-28 lg:pt-20">
          <div className="pointer-events-none absolute -left-28 top-12 h-80 w-80 animate-float-slow rounded-full bg-orange-300/25 blur-[100px]" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-[34rem] w-[34rem] rounded-full bg-indigo-950/40 blur-[130px]" />
          <div className="pointer-events-none absolute left-[45%] top-[15%] h-72 w-72 animate-float-slow rounded-full bg-pink-400/20 blur-[110px] [animation-delay:-2s]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="relative mx-auto grid max-w-[1380px] items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 xl:gap-16">
            <FadeIn className="max-w-[680px] lg:py-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur-xl sm:text-xs">
                <Sparkles className="h-4 w-4" /> Turn comments into customers
              </div>
              <h1 className="mt-7 max-w-[700px] text-[3.15rem] font-black leading-[0.91] tracking-[-0.06em] sm:text-[4.7rem] lg:text-[4.9rem] xl:text-[5.45rem]">
                A comment comes in. <span className="bg-gradient-to-r from-orange-200 via-pink-200 to-violet-200 bg-clip-text text-transparent">AP3K does the rest.</span>
              </h1>
              <p className="mt-6 max-w-[590px] text-base font-medium leading-7 text-white/75 sm:text-[1.12rem] sm:leading-8">
                Automatically reply to Instagram comments, send the right DM, and capture interested people—while you focus on growing your business.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#5f25cb] shadow-[0_16px_45px_rgba(38,10,80,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(38,10,80,0.42)]">
                  Start automating free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur-xl transition duration-200 hover:bg-white/16">
                  See the 3-step setup
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold text-white/55">
                {["No credit card", "No code", "50 free replies monthly"].map((item) => <span key={item} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />{item}</span>)}
              </div>
            </FadeIn>

            <FadeIn delay={0.08} className="relative flex min-h-[390px] items-center justify-center sm:min-h-[480px] lg:min-h-[570px]">
              <AutomationFlowDemo />
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-slate-200/80 bg-white/85 px-4 py-6 backdrop-blur dark:border-white/8 dark:bg-[#0b0c15]/90 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[10px] font-black uppercase tracking-[0.17em] text-slate-500 dark:text-slate-400 sm:text-xs">
            <span>Instagram Business + Creator</span><span className="text-pink-500">•</span><span>Official API workflow</span><span className="text-pink-500">•</span><span>No Instagram password</span><span className="text-pink-500">•</span><span>Launch in minutes</span>
          </div>
        </section>

        <section className="bg-[#f7f7fb] px-4 py-20 dark:bg-[#080911] sm:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-pink-600 dark:text-pink-300">One simple customer journey</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">From “I’m interested” to your inbox—in seconds.</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300/75 sm:text-lg">
                No complicated chatbot builder. Choose the comment that starts the flow, write the reply and DM, then switch it on.
              </p>
            </FadeIn>
            <StaggerContainer className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {VALUE_CARDS.map(({ icon: Icon, title, copy }) => (
                <StaggerItem key={title}>
                  <HoverLift>
                    <div className="h-full rounded-[1.7rem] border border-slate-200/80 bg-white p-6 text-left shadow-[0_12px_40px_rgba(15,23,42,0.05)] dark:border-white/8 dark:bg-[#10121d] dark:shadow-none">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 via-pink-100 to-violet-100 text-pink-700 dark:from-orange-500/15 dark:via-pink-500/15 dark:to-violet-500/15 dark:text-pink-300"><Icon className="h-5 w-5" /></div>
                      <h3 className="mt-5 text-lg font-black">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{copy}</p>
                    </div>
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="features" className="relative overflow-hidden bg-[linear-gradient(135deg,#5521c8_0%,#7033e4_46%,#8f38df_100%)] px-4 py-24 text-white sm:px-8 lg:px-16 lg:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(244,114,182,0.22),transparent_25rem),radial-gradient(circle_at_88%_75%,rgba(30,41,59,0.30),transparent_32rem)]" />
          <div className="relative mx-auto max-w-6xl space-y-24 lg:space-y-32">
            {BENEFITS.map((benefit, index) => (
              <div key={benefit.title} className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-24 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <FadeIn>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">{benefit.kicker}</p>
                  <h2 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-5xl">{benefit.title}</h2>
                  <p className="mt-6 max-w-xl text-base leading-8 text-white/75 sm:text-lg">{benefit.body}</p>
                  <div className="mt-7 space-y-3">
                    {benefit.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-3 text-sm font-bold text-white/90">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10"><CheckCircle2 className="h-4 w-4 text-fuchsia-200" /></span>
                        {bullet}
                      </div>
                    ))}
                  </div>
                  <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#6128c8] shadow-lg transition hover:-translate-y-0.5">Try it free <ArrowRight className="h-4 w-4" /></Link>
                </FadeIn>
                <FadeIn delay={0.06}>
                  <ProductVideo src={benefit.src} label={benefit.label} className="max-w-[270px] sm:max-w-[300px]" />
                </FadeIn>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="bg-[#f1edfb] px-4 py-20 dark:bg-[#0e1020] sm:px-8 lg:px-16 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.98fr_1.02fr] lg:gap-24">
            <FadeIn>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Start in minutes</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Your first automation takes three steps.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-400">No flowchart maze. AP3K gives you the few decisions that matter and handles the repetitive work.</p>
              <div className="mt-8 space-y-3">
                {[
                  ["01", "Connect Instagram", "Securely authorize your Business or Creator account."],
                  ["02", "Choose the trigger", "Pick a post and listen for a keyword or any comment."],
                  ["03", "Write it, then switch it on", "Choose the public reply, DM, or both. AP3K handles the rest."],
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
                <ProductVideo src="/media/templates_05.mp4" label="AP3K campaign setup demo" className="max-w-[280px]" />
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="bg-white px-4 py-20 dark:bg-[#0b0c15] sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-slate-800 bg-[radial-gradient(circle_at_82%_20%,rgba(124,58,237,0.24),transparent_24rem),linear-gradient(135deg,#11121a,#151323)] px-6 py-11 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:px-10 lg:px-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <FadeIn>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-300">Built on supported access</p>
                <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">No Instagram password. No scraping. No browser bot pretending to be you.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">AP3K uses Instagram authorization and the Instagram Business API permissions required for profile/media access, comment management, and messaging.</p>
              </FadeIn>
              <div className="grid grid-cols-3 gap-3">
                {[ShieldCheck, Zap, TrendingUp].map((Icon, index) => <div key={index} className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]"><Icon className="h-5 w-5 text-fuchsia-300" /></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#f7f7fb] px-4 py-20 dark:bg-[#080911] sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <FadeIn className="mb-10 text-center">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Simple pricing</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Start free. Save more annually.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-slate-400">Pro is $9/month or $79/year. Business is $29/month or $279/year. Annual billing saves up to 27% while usage still resets monthly.</p>
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
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/78">Create your first campaign, test it from another Instagram account, and let AP3K handle the repetitive follow-up.</p>
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
