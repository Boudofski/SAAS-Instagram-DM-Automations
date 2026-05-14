import PricingCard from "@/components/global/pricing-card";
import { FadeIn } from "@/components/global/motion/fade-in";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";

const PLANS = [
  {
    tier: "Free", price: "$0", description: "Perfect for getting started",
    ctaLabel: "Get started free", ctaHref: "/sign-up", featured: false,
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
    tier: "Creator", price: "$29", description: "For serious creators and coaches",
    ctaLabel: "Start Creator plan", ctaHref: "/payment?plan=creator", featured: true,
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
    tier: "Agency", price: "$79", description: "For teams managing multiple accounts",
    ctaLabel: "Start Agency plan", ctaHref: "/payment?plan=agency", featured: false,
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

const FAQ = [
  {
    q: "Is it safe for my Instagram account?",
    a: "Yes. AP3k uses the official Instagram Graph API. We never store your password and built-in duplicate prevention ensures nobody receives the same DM twice.",
  },
  {
    q: "Can I cancel any time?",
    a: "Absolutely. No lock-in. Cancel from your settings in seconds — your campaigns pause immediately.",
  },
  {
    q: "What's the DM limit on Free?",
    a: "50 DMs per month across 1 active campaign. Upgrade to Creator for unlimited DMs and campaigns.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial opacity-90" />
      <WebsiteNav current="pricing" />

      {/* Header */}
      <section className="relative z-10 px-4 py-20 text-center sm:px-8 lg:px-16">
        <FadeIn>
        <p className="ap3k-kicker mb-4">Pricing</p>
        <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
          Start free.<br />
          <span className="ap3k-gradient-text">
            Scale when you&apos;re ready.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg leading-8 text-rf-muted">
          No hidden fees. No contracts. Cancel any time.
        </p>
        </FadeIn>
      </section>

      {/* Plans */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-20 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p, index) => (
            <FadeIn key={p.tier} delay={index * 0.05}>
              <PricingCard {...p} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 mx-auto max-w-2xl px-4 pb-20 sm:px-8 lg:px-0">
        <h2 className="mb-8 text-center text-xl font-black">Common questions</h2>
        <div className="flex flex-col gap-4">
          {FAQ.map((f) => (
            <div key={f.q} className="ap3k-card rounded-2xl p-5">
              <h3 className="text-sm font-black text-rf-text mb-2">{f.q}</h3>
              <p className="text-sm text-rf-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
      <WebsiteFooter />
    </div>
  );
}
