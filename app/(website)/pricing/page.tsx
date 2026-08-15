import PricingCard from "@/components/global/pricing-card";
import { FadeIn } from "@/components/global/motion/fade-in";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { formatCampaignLimitFeature, getPlanLimits } from "@/lib/plan-limits";

const FREE_CAMPAIGN_FEATURE = formatCampaignLimitFeature(getPlanLimits("FREE").activeCampaigns);
const CREATOR_CAMPAIGN_FEATURE = formatCampaignLimitFeature(getPlanLimits("PRO").activeCampaigns);

const PLANS = [
  {
    tier: "Free",
    price: "$0",
    description: "For testing your first Instagram automation",
    ctaLabel: "Get started free",
    ctaHref: "/sign-up",
    featured: false,
    features: [
      { text: "1 Instagram account", included: true },
      { text: FREE_CAMPAIGN_FEATURE, included: true },
      { text: "50 automated replies/month", included: true },
      { text: "Keyword + Any Comment triggers", included: true },
      { text: "Public + private reply setup", included: true },
      { text: "Basic analytics", included: true },
    ],
  },
  {
    tier: "Creator",
    price: "$29",
    description: "For production campaigns and higher reply volume",
    ctaLabel: "Start Creator plan",
    ctaHref: "/payment?plan=creator",
    featured: true,
    features: [
      { text: "1 Instagram account", included: true },
      { text: CREATOR_CAMPAIGN_FEATURE, included: true },
      { text: "5,000 automated replies/month", included: true },
      { text: "Public + private replies", included: true },
      { text: "Lead export", included: true },
      { text: "Analytics", included: true },
    ],
  },
] as const;

const FAQ = [
  {
    q: "Do I need to connect Facebook?",
    a: "No. AP3k connects directly to an Instagram Business or Creator account through Instagram authorization.",
  },
  {
    q: "How many Instagram accounts can I connect?",
    a: "Each AP3k workspace supports one connected Instagram account. Reconnecting a different account replaces the current connection while campaign history stays saved.",
  },
  {
    q: "How many campaigns can I create?",
    a: "Campaigns are unlimited on both Free and Creator. The monthly automated-reply allowance is what changes by plan.",
  },
  {
    q: "What counts toward the monthly reply allowance?",
    a: "Successful public replies and successful private replies count toward the monthly allowance. Failed or skipped actions do not count.",
  },
  {
    q: "Is AP3k safe for my Instagram account?",
    a: "AP3k uses the supported Instagram API flow for professional accounts. It does not ask for your Instagram password, scrape Instagram, or rely on browser automation.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Creator subscribers can manage or cancel billing through the billing portal from inside AP3k.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial opacity-90" />
      <WebsiteNav current="pricing" />

      <section className="relative z-10 px-4 py-20 text-center sm:px-8 lg:px-16">
        <FadeIn>
          <p className="ap3k-kicker mb-4">Pricing</p>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            Start free.<br />
            <span className="ap3k-gradient-text">Scale your reply volume.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-rf-muted">
            One Instagram account and unlimited campaigns on both plans. Upgrade when you need more automated replies and analytics.
          </p>
        </FadeIn>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-20 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PLANS.map((plan, index) => (
            <FadeIn key={plan.tier} delay={index * 0.05}>
              <PricingCard {...plan} />
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-2xl px-4 pb-20 sm:px-8 lg:px-0">
        <h2 className="mb-8 text-center text-xl font-black">Common questions</h2>
        <div className="flex flex-col gap-4">
          {FAQ.map((item) => (
            <div key={item.q} className="ap3k-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-rf-pink/25">
              <h3 className="mb-2 text-sm font-black text-slate-950 dark:text-rf-text">{item.q}</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-rf-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
