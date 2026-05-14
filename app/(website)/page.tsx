import AP3kLogo from "@/components/global/ap3k-logo";
import { FadeIn, HoverLift } from "@/components/global/motion/fade-in";
import PricingCard from "@/components/global/pricing-card";
import { ArrowRight, Bot, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

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
      { text: "Up to 50 DMs/month", included: true },
      { text: "Keyword triggers", included: true },
      { text: "Basic analytics", included: true },
      { text: "Smart AI replies", included: false },
      { text: "Unlimited DMs", included: false },
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
      { text: "Unlimited DMs", included: true },
      { text: "Smart AI replies", included: true },
      { text: "Full analytics + leads export", included: true },
      { text: "{{variable}} personalisation", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    tier: "Agency",
    price: "$79",
    description: "For teams managing multiple accounts",
    ctaLabel: "Start Agency plan",
    ctaHref: "/payment?plan=agency",
    featured: false,
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Up to 10 Instagram accounts", included: true },
      { text: "Team access", included: true },
      { text: "Dedicated onboarding", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA support", included: true },
    ],
  },
] as const;

const FEATURES = [
  { icon: MessageCircle, title: "Keyword triggers", desc: "When someone comments 'link', 'info', or any word you choose, your DM fires instantly." },
  { icon: Sparkles, title: "Personalised DMs", desc: "Use {{first_name}}, {{keyword}}, and {{link}} to make every DM feel human and targeted." },
  { icon: Bot, title: "Smart AI replies", desc: "Let AI handle follow-up conversations, answer questions, nurture leads, and close sales." },
  { icon: TrendingUp, title: "Real analytics", desc: "Track DMs sent, leads captured, and reply rate per campaign. Know exactly what's working." },
] as const;

const EXAMPLES = [
  { comment: "GUIDE", action: "Free PDF guide sent via DM", color: "text-rf-pink" },
  { comment: "PRICE", action: "Pricing page link sent via DM", color: "text-rf-purple" },
  { comment: "BOOK", action: "Booking page sent via DM", color: "text-rf-blue" },
] as const;

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-rf-bg/72 px-4 py-4 backdrop-blur-2xl sm:px-8 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/">
            <AP3kLogo className="text-base" />
          </Link>
          <ul className="hidden items-center gap-8 text-sm text-rf-muted md:flex">
            <li><a href="#features" className="transition-colors hover:text-rf-text">Features</a></li>
            <li><a href="#pricing" className="transition-colors hover:text-rf-text">Pricing</a></li>
            <li><Link href="/dashboard" className="transition-colors hover:text-rf-text">Login</Link></li>
          </ul>
          <Link href="/sign-up" className="ap3k-gradient-button px-5 py-2 text-sm">
            Start free
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="px-4 pb-16 pt-16 sm:px-8 sm:pt-20 lg:px-16 lg:pb-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <FadeIn>
              <div className="inline-flex items-center gap-2 rounded-full border border-rf-pink/25 bg-rf-pink/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-rf-pink">
                <span className="h-1.5 w-1.5 rounded-full bg-rf-pink shadow-[0_0_16px_rgba(244,114,182,0.8)]" />
                Instagram-native automation
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Comments become DMs.
                <span className="ap3k-gradient-text block animate-gradient-pan bg-[length:220%_220%]">
                  DMs become sales.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-rf-muted">
                AP3k turns Instagram comments into automated DMs, leads, and sales.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="ap3k-gradient-button inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm">
                  Launch your first campaign <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#features" className="ap3k-outline-button inline-flex items-center justify-center px-7 py-3.5 text-sm">
                  See how it works
                </a>
              </div>

              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                {[
                  ["1.2M", "DMs sent"],
                  ["340K", "Leads"],
                  ["<1s", "Response"],
                ].map(([num, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur">
                    <div className="text-2xl font-black tracking-tight">{num}</div>
                    <div className="text-xs text-rf-muted">{label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.12} className="relative">
              <div className="absolute -inset-8 rounded-[2rem] bg-ap3k-gradient opacity-20 blur-3xl" />
              <div className="relative animate-float-slow overflow-hidden rounded-[2rem] border border-white/[0.12] bg-rf-surface/80 p-4 shadow-ap3k-card backdrop-blur-2xl">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#111827] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-ap3k-gradient shadow-ap3k-glow" />
                    <div>
                      <p className="text-sm font-black">@yourhandle</p>
                      <p className="text-xs text-rf-muted">Reel automation live</p>
                    </div>
                    <span className="ml-auto rounded-full border border-rf-green/25 bg-rf-green/10 px-2.5 py-1 text-[10px] font-black text-rf-green">
                      Live
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#182033] via-[#111827] to-[#0B1020]">
                    <div className="flex h-52 items-center justify-center bg-ap3k-radial">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center backdrop-blur">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-rf-pink">Creator drop</p>
                        <p className="mt-1 text-2xl font-black">New guide is live</p>
                      </div>
                    </div>
                    <div className="flex gap-4 border-t border-white/10 px-4 py-3 text-xs text-rf-muted">
                      <span>2.4k likes</span>
                      <span>318 comments</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs text-rf-muted">@sarah.creates commented</p>
                      <p className="mt-1 text-sm">
                        This is exactly what I need. <span className="rounded-lg border border-rf-pink/25 bg-rf-pink/10 px-2 py-1 text-xs font-black text-rf-pink">GUIDE</span>
                      </p>
                    </div>
                    <div className="ml-8 rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-black text-rf-pink">
                        <MessageCircle className="h-4 w-4" /> DM sent by AP3k
                      </div>
                      <p className="text-sm leading-relaxed">
                        Hey Sarah, here is the guide you asked for. I also saved your spot for the next drop.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-rf-green/20 bg-rf-green/10 p-4">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-rf-green/15 text-rf-green">✓</div>
                      <div>
                        <p className="text-sm font-black text-rf-green">Lead captured</p>
                        <p className="text-xs text-rf-muted">Added to your launch funnel</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="border-y border-white/10 bg-rf-surface/40 px-4 py-8 backdrop-blur sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <HoverLift key={ex.comment}>
                <div className="ap3k-card rounded-2xl p-5">
                  <span className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-sm font-black ${ex.color}`}>
                    &ldquo;{ex.comment}&rdquo;
                  </span>
                  <p className="mt-4 text-sm font-semibold leading-relaxed text-rf-text">{ex.action}</p>
                </div>
              </HoverLift>
            ))}
          </div>
        </section>

        <section id="features" className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 text-center">
              <p className="ap3k-kicker">Everything you need</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Smooth automation for creators who move fast.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-rf-muted">
                Pick your post, add keywords, write your DM. AP3k keeps the follow-up moving while you create.
              </p>
            </FadeIn>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, index) => {
                const Icon = f.icon;
                return (
                  <FadeIn key={f.title} delay={index * 0.04}>
                    <div className="ap3k-card ap3k-card-hover h-full rounded-3xl p-6">
                      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft text-rf-pink">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-black text-rf-text">{f.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-rf-muted">{f.desc}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <FadeIn className="mb-12 text-center">
              <p className="ap3k-kicker">Simple pricing</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Start free. Scale when your DMs do.
              </h2>
              <p className="mt-4 text-rf-muted">No hidden fees. Cancel any time.</p>
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

      <footer className="relative z-10 border-t border-white/10 px-4 py-8 sm:px-8 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-rf-muted sm:flex-row sm:items-center sm:justify-between">
          <AP3kLogo className="text-sm text-rf-muted" markClassName="h-7 w-7 rounded-lg" />
          <div className="flex gap-6">
            {["Privacy", "Terms", "Docs", "Status"].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-rf-text">{l}</a>
            ))}
          </div>
          <p>© 2026 AP3k</p>
        </div>
      </footer>
    </div>
  );
}
