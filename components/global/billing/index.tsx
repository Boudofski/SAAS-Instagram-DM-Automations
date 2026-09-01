"use client";

import PricingExperience from "@/components/global/pricing-experience";
import { planDisplayName, type CustomerPlan } from "@/lib/billing-plans";
import type { BillingSnapshot } from "@/lib/billing-snapshot";
import { getBillingUsagePresentation, type BillingMetricKind } from "@/lib/billing-presentation";
import { isUnlimited, type UsageSummary } from "@/lib/plan-limits";
import { CalendarDays, CreditCard, MessageCircle, Send } from "lucide-react";
import { ManageBillingButton } from "./manage-billing-button";

type Props = {
  current?: CustomerPlan;
  usage?: UsageSummary;
  canManageBilling?: boolean;
  billing?: BillingSnapshot | null;
};

export default function Billing({
  current = "FREE",
  usage,
  canManageBilling = false,
  billing,
}: Props) {
  const launchTrialActive = Boolean(usage?.welcomeTrial?.active);
  const planLabel = launchTrialActive ? "Free launch trial" : usage?.planLabel ?? planDisplayName(current);
  const paid = current !== "FREE" && canManageBilling;

  return (
    <div className="flex w-full flex-col gap-7">
      <div id="manage-billing" className="ap3k-page-header scroll-mt-24">
        <div>
          <p className="ap3k-kicker">Billing</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Plans, usage &amp; subscription
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Every successful Comment reply and DM counts as one automated reply.
          </p>
        </div>
        {canManageBilling && <ManageBillingButton />}
      </div>

      <section className="overflow-hidden rounded-3xl border border-rf-pink/20 bg-gradient-to-br from-white via-orange-50/50 to-pink-50/60 p-5 shadow-sm dark:border-rf-pink/20 dark:from-[#151312] dark:via-[#101217] dark:to-[#171018] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="ap3k-kicker">Current plan</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{planLabel}</h2>
              <span className="ap3k-badge ap3k-badge-green">Active</span>
              {billing?.interval && (
                <span className="ap3k-badge ap3k-badge-slate">
                  {billing.interval === "year" ? "Annual billing" : "Monthly billing"}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              {launchTrialActive
                ? "Your one-time 500-reply allowance stays active for 14 days after connecting Instagram. The normal Free allowance starts fresh when it ends."
                : "Usage refreshes monthly. Campaigns remain unlimited and each workspace supports one connected Instagram account."}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[430px]">
            <BillingFact
              icon={<CreditCard className="h-4 w-4" />}
              label="Subscription"
              value={billing?.status ? friendlyStatus(billing.status, billing.cancelAtPeriodEnd) : current === "FREE" ? "Free" : "Paid"}
            />
            <BillingFact
              icon={<CalendarDays className="h-4 w-4" />}
              label={launchTrialActive ? "Trial ends" : billing?.cancelAtPeriodEnd ? "Access until" : "Next renewal"}
              value={launchTrialActive && usage?.welcomeTrial
                ? formatDate(usage.welcomeTrial.endsAt.toISOString())
                : billing?.renewsAt
                  ? formatDate(billing.renewsAt)
                  : usage
                    ? `${usage.periodLabel} usage`
                    : "Monthly reset"}
            />
          </div>
        </div>

        {usage && (
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_1.05fr]">
            <UsageBar label="Automated replies" metric={usage.staticReplies} />
            <UsageBar label="Active campaigns" metric={usage.activeCampaigns} helper="Unlimited campaigns are included." />
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-[#101217]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950 dark:text-white">How replies count</p>
                <span className="ap3k-badge ap3k-badge-slate">Per send</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                  <MessageCircle className="h-4 w-4 text-orange-500" /> 1 Comment reply = 1
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                  <Send className="h-4 w-4 text-rf-pink" /> 1 DM = 1
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-5">
          <p className="ap3k-kicker">Choose your volume</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Plans</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Switch billing interval above. Paid-plan changes stay inside the billing portal so you never create a duplicate subscription.
          </p>
        </div>
        <PricingExperience compact dashboardCompact currentPlan={current} existingPaid={paid} />
      </section>
    </div>
  );
}

function BillingFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {icon} {label}
      </div>
      <p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}

function UsageBar({
  label,
  metric,
  helper,
  kind = "default",
}: {
  label: string;
  metric: UsageSummary["staticReplies"];
  helper?: string;
  kind?: BillingMetricKind;
}) {
  const { tone, value, description } = getBillingUsagePresentation(metric, kind, helper);
  const bar = tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-[#101217]">
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-sm font-black text-slate-950 dark:text-white">{label}</p>
        <p className="text-left text-xs font-bold text-slate-500 dark:text-slate-300 sm:text-right">{value}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
        <div className={`h-full rounded-full ${bar} transition-[width] duration-700`} style={{ width: `${isUnlimited(metric.limit) ? 8 : metric.percent}%` }} />
      </div>
      <p className={`mt-2 text-xs font-bold ${tone === "red" ? "text-red-600 dark:text-red-300" : tone === "amber" ? "text-amber-700 dark:text-amber-200" : "text-slate-500 dark:text-slate-300"}`}>
        {description}
      </p>
    </div>
  );
}

function friendlyStatus(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return "Cancels at period end";
  if (status === "active") return "Active";
  if (status === "trialing") return "Trial";
  if (status === "past_due") return "Payment due";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Monthly reset";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
