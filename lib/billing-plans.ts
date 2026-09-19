export type CustomerPlan = "FREE" | "PRO" | "BUSINESS";
export type PaidPlan = Exclude<CustomerPlan, "FREE">;
export type BillingInterval = "month" | "year";

export type PlanCard = {
  id: CustomerPlan;
  name: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  annualSavingsPercent: number | null;
  replyLimit: number;
  featured?: boolean;
  features: string[];
};

export const AP3K_PRICING = {
  PRO_MONTHLY: 9,
  PRO_ANNUAL: 79,
  BUSINESS_MONTHLY: 29,
  BUSINESS_ANNUAL: 279,
} as const;

export const PLAN_CARDS: PlanCard[] = [
  {
    id: "FREE",
    name: "Free",
    description: "Start real comment-to-DM automation with a useful monthly allowance.",
    monthlyPrice: 0,
    annualPrice: 0,
    annualSavingsPercent: null,
    replyLimit: 500,
    features: [
      "1 Instagram Business or Creator account",
      "Up to 5 active automations",
      "500 automated actions/month",
      "No AI replies",
      "Keyword + Any Comment triggers",
      "Comment replies + DMs",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    description: "For creators running serious comment-to-DM automation.",
    monthlyPrice: AP3K_PRICING.PRO_MONTHLY,
    annualPrice: AP3K_PRICING.PRO_ANNUAL,
    annualSavingsPercent: 27,
    replyLimit: 5_000,
    featured: true,
    features: [
      "Everything in Free",
      "Up to 3 Instagram accounts",
      "5,000 automated actions/month",
      "500 AI replies/month",
      "AI tone, instructions, and comment protection",
      "Lead tracking and full analytics",
    ],
  },
  {
    id: "BUSINESS",
    name: "Business",
    description: "For high-volume creators and brands running heavier automation.",
    monthlyPrice: AP3K_PRICING.BUSINESS_MONTHLY,
    annualPrice: AP3K_PRICING.BUSINESS_ANNUAL,
    annualSavingsPercent: 20,
    replyLimit: 20_000,
    features: [
      "Everything in Pro",
      "Up to 10 Instagram accounts",
      "20,000 automated actions/month",
      "2,000 AI replies/month",
      "High-volume comment and DM automation",
      "Monthly AI and automation usage resets automatically",
    ],
  },
];

export const PLAN_COMPARISON = [
  { feature: "Monthly price", free: "$0", pro: "$9", business: "$29" },
  { feature: "Annual price", free: "$0", pro: "$79/year", business: "$279/year" },
  { feature: "Annual savings", free: "\u2014", pro: "Save 27%", business: "Save 20%" },
  { feature: "Automated actions / month", free: "500", pro: "5,000", business: "20,000" },
  { feature: "AI replies / month", free: "0", pro: "500", business: "2,000" },
  { feature: "Instagram accounts", free: "1", pro: "3", business: "10" },
  { feature: "Automations", free: "Up to 5 active automations", pro: "Unlimited", business: "Unlimited" },
  { feature: "Keyword triggers", free: "Included", pro: "Included", business: "Included" },
  { feature: "Any Comment trigger", free: "Included", pro: "Included", business: "Included" },
  { feature: "Comment replies", free: "Included", pro: "Included", business: "Included" },
  { feature: "DMs", free: "Included", pro: "Included", business: "Included" },
  { feature: "Comment-reply variations", free: "Up to 3", pro: "Up to 3", business: "Up to 3" },
  { feature: "AI comment protection", free: "Not included", pro: "Included", business: "Included" },
  { feature: "DM link button", free: "Included", pro: "Included", business: "Included" },
  { feature: "Lead tracking", free: "Included", pro: "Included", business: "Included" },
  { feature: "Automation analytics", free: "Included", pro: "Included", business: "Included" },
  { feature: "Billing portal", free: "Not included", pro: "Included", business: "Included" },
] as const;

export function planDisplayName(plan?: string | null) {
  if (plan === "BUSINESS") return "Business";
  if (plan === "PRO") return "Pro";
  return "Free";
}

export function checkoutHref(plan: PaidPlan, interval: BillingInterval) {
  return `/payment?plan=${plan.toLowerCase()}&interval=${interval}`;
}

export function annualMonthlyEquivalent(plan: PaidPlan) {
  const annual = plan === "PRO" ? AP3K_PRICING.PRO_ANNUAL : AP3K_PRICING.BUSINESS_ANNUAL;
  return annual / 12;
}
