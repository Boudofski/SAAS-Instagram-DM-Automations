import PricingCard from "@/components/global/pricing-card";
import { FadeIn } from "@/components/global/motion/fade-in";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { isAppReviewMode } from "@/lib/app-review-mode";

const PLANS = [
  {
    tier: "Free", price: "$0", description: "For setup, testing, and your first live proof",
    ctaLabel: "Get started free", ctaHref: "/sign-up", featured: false,
    features: [
      { text: "1 active campaign for testing", included: true },
      { text: "50 successful replies/month", included: true },
      { text: "Keyword triggers", included: true },
      { text: "Basic analytics", included: true },
      { text: "Public reply fallback", included: true },
      { text: "AI replies", included: false },
      { text: "Private DM workflow after Meta approval", included: false },
    ],
  },
  {
    tier: "Creator", price: "$29", description: "For creators who run launches, lead magnets, and evergreen posts",
    ctaLabel: "Start Creator plan", ctaHref: "/payment?plan=creator", featured: true,
    features: [
      { text: "Unlimited active campaigns", included: true },
      { text: "5,000 successful static replies/month", included: true },
      { text: "750 AI replies/month when AI is enabled", included: true },
      { text: "Public reply fallback", included: true },
      { text: "Private DM workflow when Meta messaging is approved", included: true },
      { text: "Full analytics + leads export", included: true },
      { text: "{{variable}} personalisation", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    tier: "Agency", price: "$79", description: "For teams managing client accounts and repeat launches",
    ctaLabel: "Contact / coming soon", ctaHref: "/pricing", featured: false,
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

const FAQ = [
  {
    q: "Is it safe for my Instagram account?",
    a: "AP3k uses Meta's official Instagram Graph API. We never ask for your Instagram password, do not scrape Instagram, and include duplicate prevention so a commenter is not messaged repeatedly by the same campaign.",
  },
  {
    q: "Why does private DM sending mention Meta approval?",
    a: "Meta controls messaging permissions for Instagram professional accounts. AP3k can still listen for comments and run public replies while private messaging is pending.",
  },
  {
    q: "Can I cancel any time?",
    a: "Absolutely. No lock-in. Cancel from your settings in seconds — your campaigns pause immediately.",
  },
  {
    q: "What's the reply limit on Free?",
    a: "50 successful static replies per month across 1 active campaign. Successful public replies and private DMs count; failed and skipped messages do not.",
  },
] as const;

export default function PricingPage() {
  const appReviewMode = isAppReviewMode();
  const plans = appReviewMode
    ? [
        {
          tier: "Free", price: "$0", description: "For testing Instagram comment automation",
          ctaLabel: "Get started free", ctaHref: "/sign-up", featured: false,
          features: [
            { text: "1 active campaign for testing", included: true },
            { text: "50 public replies/month", included: true },
            { text: "Keyword triggers", included: true },
            { text: "Basic analytics", included: true },
          ],
        },
        {
          tier: "Creator", price: "$29", description: "For production campaigns with public reply volume",
          ctaLabel: "Start Creator plan", ctaHref: "/payment?plan=creator", featured: true,
          features: [
            { text: "Unlimited active campaigns", included: true },
            { text: "5,000 public replies/month", included: true },
            { text: "Lead export", included: true },
            { text: "Analytics", included: true },
          ],
        },
      ] as const
    : PLANS;
  const faq = appReviewMode
    ? FAQ.filter((item) => !item.q.toLowerCase().includes("private dm")).map((item) =>
        item.q === "What's the reply limit on Free?"
          ? { ...item, a: "50 successful public replies per month across 1 active campaign. Failed or skipped actions do not count." }
          : item
      )
    : FAQ;

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
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-rf-muted">
          Free is built for proving the workflow. Creator is for real campaign volume. No hidden fees, no contracts.
        </p>
        </FadeIn>
      </section>

      {/* Plans */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-20 sm:px-8 lg:px-16">
        <div className={appReviewMode ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 md:grid-cols-3 gap-6"}>
          {plans.map((p, index) => (
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
          {faq.map((f) => (
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
