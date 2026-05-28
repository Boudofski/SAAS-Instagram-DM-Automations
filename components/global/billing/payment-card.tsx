import { Button } from "@/components/ui/button";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import Link from "next/link";

type PlanLabel = "FREE" | "PRO" | "AGENCY";

type Props = {
  label: PlanLabel;
  current: "PRO" | "FREE";
};

const PLAN_COPY = {
  FREE: {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For testing Instagram comment automation with one campaign.",
    features: ["1 active campaign", "50 static replies/month", "Keyword and Any Comment triggers", "Basic analytics"],
    href: "/pricing",
  },
  PRO: {
    name: "Creator",
    price: "$29",
    period: "/month",
    description: "For production campaigns with higher reply volume.",
    features: ["Unlimited campaigns", "5,000 static replies/month", "750 AI replies/month when AI is enabled", "Lead export"],
    href: "/payment?plan=creator",
  },
  AGENCY: {
    name: "Agency",
    price: "$79",
    period: "/month",
    description: "For teams managing multiple creator accounts.",
    features: ["Everything in Creator", "20,000 static replies/month", "5,000 AI replies/month when AI is enabled", "Up to 10 Instagram accounts"],
    href: "/payment?plan=agency",
  },
} as const;

function PaymentCard({ label, current }: Props) {
  const plan = PLAN_COPY[label];
  const appReviewMode = isAppReviewMode();
  const features = appReviewMode && label === "PRO"
    ? ["Unlimited campaigns", "5,000 public replies/month", "Lead export", "Analytics"]
    : appReviewMode && label === "FREE"
      ? ["1 active campaign", "50 public replies/month", "Keyword triggers", "Basic analytics"]
      : plan.features;
  const isActive = label === current;
  const isAgency = label === "AGENCY";
  const isIncludedFree = label === "FREE" && current === "PRO";
  const ctaLabel = isActive
    ? "Current plan"
    : isIncludedFree
    ? "Included"
    : isAgency
    ? "Contact / Coming soon"
    : "Upgrade to Creator";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-3xl border p-6 text-slate-950 shadow-sm dark:text-white",
        isActive
          ? "border-rf-pink/40 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 shadow-[0_12px_40px_rgba(221,42,123,0.10)] dark:border-rf-pink/40 dark:bg-[#1e1335] dark:shadow-[0_24px_70px_rgba(221,42,123,0.20)]"
          : "border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:border-white/[0.12] dark:bg-[#111827] dark:hover:bg-[#141e30]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">{plan.name}</h2>
        {isActive && (
          <span className="ap3k-badge ap3k-badge-green">Active</span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{plan.description}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-black tracking-tight">{plan.price}</span>
        <span className="text-sm text-slate-500 dark:text-rf-muted">{plan.period}</span>
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <p key={feature} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CircleCheck className="h-4 w-4 flex-shrink-0 text-rf-green" />
            {feature}
          </p>
        ))}
      </div>
      <Button
        asChild
        disabled={isActive || isIncludedFree || isAgency}
        className={cn(
          "mt-6 rounded-xl font-bold",
          isActive
            ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            : isIncludedFree || isAgency
            ? "border border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400"
            : "ap3k-gradient-button"
        )}
      >
        <Link href={isActive || isIncludedFree || isAgency ? "/dashboard" : plan.href}>
          {ctaLabel}
        </Link>
      </Button>
    </div>
  );
}

export default PaymentCard;
