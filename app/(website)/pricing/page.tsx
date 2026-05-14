import PricingCard from "@/components/global/pricing-card";
import Link from "next/link";

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
    <div className="min-h-screen bg-rf-bg text-rf-text">
      {/* Nav */}
      <nav className="flex items-center justify-between px-16 py-4 border-b border-rf-border">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rf-blue to-rf-purple
                          flex items-center justify-center text-white text-[8px] font-black">
            AP3K
          </div>
          AP3k
        </Link>
        <Link href="/sign-up"
              className="bg-rf-blue hover:bg-rf-blue/90 text-white text-sm font-bold
                         px-5 py-2 rounded-lg transition-colors">
          Start free →
        </Link>
      </nav>

      {/* Header */}
      <section className="text-center px-16 py-20">
        <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-4">Pricing</p>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          Start free.<br />
          <span className="bg-gradient-to-r from-rf-blue to-rf-purple bg-clip-text text-transparent">
            Scale when you&apos;re ready.
          </span>
        </h1>
        <p className="text-rf-muted text-lg max-w-md mx-auto">
          No hidden fees. No contracts. Cancel any time.
        </p>
      </section>

      {/* Plans */}
      <section className="px-16 pb-20 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => <PricingCard key={p.tier} {...p} />)}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-16 pb-20 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-8">Common questions</h2>
        <div className="flex flex-col gap-4">
          {FAQ.map((f) => (
            <div key={f.q} className="bg-rf-surface border border-rf-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-rf-text mb-2">{f.q}</h3>
              <p className="text-sm text-rf-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
