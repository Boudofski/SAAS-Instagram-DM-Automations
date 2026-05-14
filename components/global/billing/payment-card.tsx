import { Button } from "@/components/ui/button";
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
    description: "For validating your first Instagram comment-to-DM campaign.",
    features: ["1 active campaign", "Up to 50 DMs/month", "Keyword triggers", "Basic analytics"],
    href: "/pricing",
  },
  PRO: {
    name: "Creator",
    price: "$29",
    period: "/month",
    description: "For creators running active comment-to-DM funnels.",
    features: ["Unlimited campaigns", "Unlimited DMs", "Smart AI replies", "Lead export"],
    href: "/payment?plan=creator",
  },
  AGENCY: {
    name: "Agency",
    price: "$79",
    period: "/month",
    description: "For teams managing multiple creator accounts.",
    features: ["Everything in Creator", "Up to 10 Instagram accounts", "Team workflows", "Priority onboarding"],
    href: "/payment?plan=agency",
  },
} as const;

function PaymentCard({ label, current }: Props) {
  const plan = PLAN_COPY[label];
  const isActive = label === current;
  const isAgency = label === "AGENCY";
  const isIncludedFree = label === "FREE" && current === "PRO";
  const ctaLabel = isActive
    ? "Current plan"
    : isIncludedFree
    ? "Included"
    : isAgency
    ? "Upgrade to Agency"
    : "Upgrade to Creator";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm",
        isActive && "border-rf-pink/35 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">{plan.name}</h2>
        {isActive && (
          <span className="rounded-full border border-rf-green/25 bg-rf-green/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rf-green">
            Active
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{plan.description}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-black tracking-tight">{plan.price}</span>
        <span className="text-sm text-rf-muted">{plan.period}</span>
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-2.5">
        {plan.features.map((feature) => (
          <p key={feature} className="flex gap-2 text-sm text-slate-600">
            <CircleCheck className="h-4 w-4 flex-shrink-0 text-rf-green" />
            {feature}
          </p>
        ))}
      </div>
      <Button
        asChild
        disabled={isActive || isIncludedFree}
        className={cn(
          "mt-6 rounded-xl font-bold",
          isActive || isIncludedFree ? "bg-white/10 text-rf-muted" : "ap3k-gradient-button"
        )}
      >
        <Link href={isActive || isIncludedFree ? "/dashboard" : plan.href}>
          {ctaLabel}
        </Link>
      </Button>
    </div>
  );
}

export default PaymentCard;
