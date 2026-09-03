export type CustomerPlan = "FREE" | "PRO" | "BUSINESS";
export type PaidPlan = Exclude<CustomerPlan, "FREE">;
export type BillingInterval = "month" | "year";

export type PlanCard = {
  id: CustomerPlan | "CUSTOM";
  name: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  annualSavingsPercent: number | null;
  replyLimit: number | "custom";
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
    description: "Connect Instagram, test AP3K with 500 replies for 14 days, then keep using it free.",
    monthlyPrice: 0,
    annualPrice: 0,
    annualSavingsPercent: null,
    replyLimit: 50,
    features: [
      "1 Instagram Business or Creator account",
      "Unlimited automations",
      "500 replies during your 14-day launch trial",
      "Then 50 automated replies every month",
      "Keyword + Any Comment triggers",
      "Comment replies + DMs",
      "Basic analytics",
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
      "1 Instagram Business or Creator account",
      "Unlimited automations",
      "5,000 automated replies/month",
      "Reply to comments and send DMs",
      "Up to 3 comment-reply variations",
      "DM link button",
      "Lead tracking",
      "Full automation analytics",
      "Cancel anytime",
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
      "20,000 automated replies/month",
      "1 Instagram Business or Creator account",
      "Unlimited automations",
      "Comment replies + DMs",
      "Lead tracking and analytics",
      "Monthly usage resets even on annual billing",
      "Cancel anytime",
    ],
  },
  {
    id: "CUSTOM",
    name: "Custom",
    description: "For brands and agencies that need volume beyond Business.",
    monthlyPrice: null,
    annualPrice: null,
    annualSavingsPercent: null,
    replyLimit: "custom",
    features: [
      "Custom automated-reply volume",
      "Everything in Business",
      "Tailored contract and pricing",
      "Volume planning and onboarding support",
      "Plan built around your usage",
    ],
  },
];

export const PLAN_COMPARISON = [
  { feature: "Monthly price", pro: "$9", business: "$29" },
  { feature: "Annual price", pro: "$79/year", business: "$279/year" },
  { feature: "Annual savings", pro: "Save 27%", business: "Save 20%" },
  { feature: "Automated replies / month", pro: "5,000", business: "20,000" },
  { feature: "Instagram accounts", pro: "1", business: "1" },
  { feature: "Automations", pro: "Unlimited", business: "Unlimited" },
  { feature: "Keyword triggers", pro: "Included", business: "Included" },
  { feature: "Any Comment trigger", pro: "Included", business: "Included" },
  { feature: "Comment replies", pro: "Included", business: "Included" },
  { feature: "DMs", pro: "Included", business: "Included" },
  { feature: "Comment-reply variations", pro: "Up to 3", business: "Up to 3" },
  { feature: "DM link button", pro: "Included", business: "Included" },
  { feature: "Lead tracking", pro: "Included", business: "Included" },
  { feature: "Automation analytics", pro: "Included", business: "Included" },
  { feature: "Billing portal", pro: "Included", business: "Included" },
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
