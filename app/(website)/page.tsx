import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import PricingCard from "@/components/global/pricing-card";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { getAuthenticatedLandingRedirect } from "@/lib/landing-redirect";
import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowRight, Bot, CheckCircle2, FileCheck2, MessageCircle, Reply, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const PLANS = [
  {
    tier: "Free",
    price: "$0",
    description: "Perfect for getting started",
    ctaLabel: "Get started free",
    ctaHref: "/sign-up",
    featured: false,
    features: [
      { text: "1 active campaign", included: true },
      { text: "Free for testing", included: true },
      { text: "50 static replies/month", included: true },
      { text: "Keyword triggers", included: true },
      { text: "Basic analytics", included: true },
      { text: "AI replies", included: false },
      { text: "Private replies when Meta enables messaging", included: false },
    ],
  },
  {
    tier: "Creator",
    price: "$29",
    description: "For serious creators and coaches",
    ctaLabel: "Start Creator plan",
    ctaHref: "/payment?plan=creator",
    featured: true,
    features: [
      { text: "Unlimited campaigns", included: true },
      { text: "5,000 static replies/month", included: true },
      { text: "750 AI replies/month when AI is enabled", included: true },
      { text: "Full analytics + leads export", included: true },
      { text: "{{variable}} personalisation", included: true },
      { text: "Private DM workflow after Meta approval", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    tier: "Agency",
    price: "$79",
    description: "For teams managing multiple accounts",
    ctaLabel: "Contact / coming soon",
    ctaHref: "/pricing",
    featured: false,
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Up to 10 Instagram accounts", included: true },
      { text: "Team access", included: false },
      { text: "Dedicated onboarding", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA support", included: true },
    ],
  },
] as const;

const FEATURES = [
  { icon: MessageCircle, title: "Keyword triggers", desc: "Match exact or contains keywords across real Instagram comment webhooks." },
  { icon: Sparkles, title: "Any comment triggers", desc: "Launch low-friction campaigns where every comment on a selected post can qualify." },
  { icon: Reply, title: "Public reply fallback", desc: "Attempt threaded replies first, then fall back to public @mention comments when needed." },
  { icon: Bot, title: "Private DM workflow", desc: "Available after instagram_manage_messages approval." },
  { icon: TrendingUp, title: "Lead capture", desc: "Keep campaign-level counts, message logs, and delivery status for each automation." },
  { icon: FileCheck2, title: "App Review diagnostics", desc: "Show webhook delivery, signature status, Meta errors, and code=3 capability evidence." },
  { icon: ShieldCheck, title: "Admin control center", desc: "Read-only platform views for users, campaigns, integrations, webhooks, and messages." },
  { icon: Users, title: "External DM mode", desc: "Let AP3k detect comments and reply publicly while tools like Lightchats handle DMs." },
] as const;

const EXAMPLES = [
  { comment: "GUIDE", action: "Public reply confirms the guide; private reply can send after Meta messaging approval", color: "text-rf-pink" },
  { comment: "PRICE", action: "Pricing link tracked with public reply fallback", color: "text-rf-purple" },
  { comment: "BOOK", action: "Booking interest captured as a lead", color: "text-rf-blue" },
] as const;

const PROOF = [
  ["Real-time", "Meta webhook processing", "bg-rf-orange/10 text-rf-orange"],
  ["Fallback", "Public reply delivery path", "bg-rf-pink/10 text-rf-magenta"],
  ["Diagnostics", "Campaign and admin logs", "bg-rf-purple/10 text-rf-purple"],
  ["Review-ready", "Safe Meta evidence", "bg-rf-indigo/10 text-rf-indigo"],
] as const;

const STEPS = [
  ["01", "Connect Instagram", "Use Facebook Login for Business and Page tokens."],
  ["02", "Choose post + trigger", "Target any post, a specific media ID, keywords, or any comment."],
  ["03", "Write replies", "Configure public replies and optional private replies after Meta messaging approval."],
  ["04", "Track results", "Review matches, reply status, DM attempts, and skipped external DMs."],
] as const;

export default async function LandingPage() {
  const authUser = await currentUser();
  const profile = authUser
    ? await client.user.findUnique({
        where: { clerkId: authUser.id },
        select: { clerkId: true },
      })
    : null;
  const redirectTo = getAuthenticatedLandingRedirect(authUser, profile);
  if (redirectTo) redirect(redirectTo);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.16),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(236,72,153,0.14),transparent_30rem),radial-gradient(circle_at_50%_46%,rgba(139,92,246,0.12),transparent_36rem)]" />

      <WebsiteNav current="home" />

      <main className="relative z-10">
        <section className="px-4 pb-14 pt-14 sm:px-8 sm:pt-20 lg:px-16 lg:pb-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <FadeIn>
              <div className="inline-flex items-center gap-2 rounded-full border border-rf-pink/25 bg-rf-pink/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-rf-pink">
                <span className="h-1.5 w-1.5 rounded-full bg-rf-pink shadow-[0_0_16px_rgba(244,114,182,0.8)]" />
                Instagram-native automation
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Comments become leads.
                <span className="ap3k-gradient-text block animate-gradient-pan bg-[length:220%_220%]">
                  Replies become sales.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-rf-muted sm:text-lg">
                Launch Instagram comment automations that reply publicly, capture leads, and send private replies when Meta messaging is enabled.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="ap3k-gradient-button inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm">
                  Launch your first campaign <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#features" className="ap3k-outline-button inline-flex items-center justify-center px-7 py-3.5 text-sm">
                  See how it works
                </a>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {PROOF.map(([num, label, accent]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.035]">
                    <div className={`mb-1.5 inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${accent}`}>{num}</div>
                    <div className="text-xs font-bold text-slate-600 dark:text-rf-muted">{label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.12} className="relative">
              <div className="absolute -inset-8 rounded-[2rem] bg-ap3k-gradient opacity-20 blur-3xl" />
              <div className="relative animate-float-slow overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-rf-surface/80 dark:shadow-ap3k-card">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-ap3k-gradient shadow-ap3k-glow" />
                    <div>
                      <p className="text-sm font-black">@yourhandle</p>
                      <p className="text-xs text-slate-500 dark:text-rf-muted">Reel automation live</p>
                    </div>
                    <span className="ml-auto rounded-full border border-rf-green/25 bg-rf-green/10 px-2.5 py-1 text-[10px] font-black text-rf-green">
                      Live
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 dark:border-white/10 dark:from-[#182033] dark:via-[#111827] dark:to-[#0B1020]">
                    <div className="flex h-48 items-center justify-center bg-ap3k-radial sm:h-52">
                      <div className="rounded-2xl border border-white/50 bg-white/55 px-5 py-4 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-rf-pink">Creator drop</p>
                        <p className="mt-1 text-2xl font-black">New guide is live</p>
                      </div>
                    </div>
                    <div className="flex gap-4 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-rf-muted">
                      <span>2.4k likes</span>
                      <span>318 comments</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="animate-[float-slow_8s_ease-in-out_infinite] rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                      <p className="text-xs text-slate-500 dark:text-rf-muted">@sarah.creates commented</p>
                      <p className="mt-1 text-sm">
                        This is exactly what I need. <span className="rounded-lg border border-rf-pink/25 bg-rf-pink/10 px-2 py-1 text-xs font-black text-rf-pink">GUIDE</span>
                      </p>
                    </div>
                    <div className="ml-0 rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft p-4 sm:ml-8">
                      <div className="mb-2 flex items-center gap-2 text-xs font-black text-rf-pink">
                        <MessageCircle className="h-4 w-4" /> Public reply sent
                      </div>
                      <p className="text-sm leading-relaxed">
                        Hey Sarah, the guide is ready. Private replies can follow when Meta messaging is enabled.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-rf-green/20 bg-rf-green/10 p-4">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-rf-green/15 text-rf-green">✓</div>
                      <div>
                        <p className="text-sm font-black text-rf-green">Lead captured</p>
                        <p className="text-xs text-slate-500 dark:text-rf-muted">Added to your launch funnel</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white/50 px-4 py-8 backdrop-blur dark:border-white/10 dark:bg-rf-surface/40 sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <HoverLift key={ex.comment}>
                <div className="ap3k-card rounded-2xl p-5">
                  <span className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-sm font-black ${ex.color}`}>
                    &ldquo;{ex.comment}&rdquo;
                  </span>
                  <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-800 dark:text-rf-text">{ex.action}</p>
                </div>
              </HoverLift>
            ))}
          </div>
        </section>

        <section id="features" className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 text-center">
              <p className="ap3k-kicker">Everything you need</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Smooth automation for creators who move fast.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-600 dark:text-rf-muted">
                Pick your post, add keywords, write public replies, and enable private reply workflows when Meta messaging is approved.
              </p>
            </FadeIn>
            <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <StaggerItem key={f.title}>
                    <div className="ap3k-card ap3k-card-hover h-full rounded-3xl p-6">
                      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft text-rf-pink">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-black text-slate-950 dark:text-rf-text">{f.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-rf-muted">{f.desc}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 text-center">
              <p className="ap3k-kicker">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">From comment to tracked outcome.</h2>
            </FadeIn>
            <StaggerContainer className="grid gap-4 md:grid-cols-4">
              {STEPS.map(([num, title, desc]) => (
                <StaggerItem key={num}>
                  <div className="ap3k-panel p-5">
                    <p className="font-mono text-xs font-black text-rf-pink">{num}</p>
                    <h3 className="mt-4 font-black text-slate-900 dark:text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-rf-muted">{desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-8 text-center">
              <p className="ap3k-kicker">Trust and compliance</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Built for official Meta review.</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-rf-muted">
                No scraping, no password sharing, no hidden browser automation. AP3k uses Facebook Login for Business and official Meta APIs throughout.
              </p>
            </FadeIn>
            <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Official Meta API flow", icon: CheckCircle2 },
                { label: "Facebook Login for Business", icon: CheckCircle2 },
                { label: "Public privacy and terms pages", icon: CheckCircle2 },
                { label: "Data deletion instructions", icon: CheckCircle2 },
              ].map(({ label, icon: Icon }) => (
                <StaggerItem key={label}>
                  <div className="ap3k-panel flex items-center gap-3 p-4">
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-rf-green/10 dark:text-rf-green">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="pricing" className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <FadeIn className="mb-12 text-center">
              <p className="ap3k-kicker">Simple pricing</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Start free. Scale when your replies do.
              </h2>
              <p className="mt-4 text-slate-600 dark:text-rf-muted">No hidden fees. Cancel any time.</p>
            </FadeIn>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {PLANS.map((p, index) => (
                <FadeIn key={p.tier} delay={index * 0.05}>
                  <PricingCard {...p} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
