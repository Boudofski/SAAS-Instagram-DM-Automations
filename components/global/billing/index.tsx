"use client";

import { isUnlimited, type UsageSummary } from "@/lib/plan-limits";
import { getBillingUsagePresentation, type BillingMetricKind } from "@/lib/billing-presentation";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { ManageBillingButton } from "./manage-billing-button";
import PaymentCard from "./payment-card";

type Props = {
  current?: "PRO" | "FREE";
  usage?: UsageSummary;
  canManageBilling?: boolean;
};

function Billing({ current = "FREE", usage, canManageBilling = false }: Props) {
  const planLabel = usage?.planLabel ?? (current === "PRO" ? "Creator" : "Free");
  const appReviewMode = isAppReviewMode();

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="ap3k-page-header">
        <div>
          <p className="ap3k-kicker">Billing</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Plans &amp; Usage
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            One connected Instagram account, unlimited campaigns, and monthly reply volume that scales with the plan.
          </p>
        </div>
        {canManageBilling && <ManageBillingButton />}
      </div>

      {usage && (
        <div className="overflow-hidden rounded-3xl border border-rf-pink/25 bg-gradient-to-br from-white via-pink-50/70 to-indigo-50 p-5 shadow-sm transition-all duration-300 dark:border-rf-pink/30 dark:from-[#16111f] dark:via-[#101827] dark:to-[#0b1020] sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="ap3k-kicker">Current plan</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {planLabel} plan active
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                {usage.periodLabel} usage. AP3k now focuses on one Instagram account with unlimited campaigns; only reply volume is metered.
              </p>
            </div>
            <div className="w-fit rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-xs font-black text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
              Usage resets monthly
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <UsageBar label="Public replies" metric={usage.staticReplies} />
            <UsageBar label="Active campaigns" metric={usage.activeCampaigns} helper="Unlimited campaigns are included." />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#101827]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950 dark:text-white">Instagram account</p>
                <span className="ap3k-badge ap3k-badge-green">Included</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
                <div className="h-full w-full rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-300">
                One connected Instagram account per workspace. Reconnecting replaces the current account cleanly.
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {current === "FREE" ? "Free plan active for testing." : "Creator plan active for production campaigns."}
          </p>
        </div>
      )}

      <div className={appReviewMode ? "grid gap-5 lg:grid-cols-2" : "grid gap-5 lg:grid-cols-2"}>
        <PaymentCard label="FREE" current={current} campaignLimit={current === "FREE" ? usage?.activeCampaigns.limit : undefined} />
        <PaymentCard label="PRO" current={current} campaignLimit={current === "PRO" ? usage?.activeCampaigns.limit : undefined} />
      </div>
    </div>
  );
}

export default Billing;

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
  const bar =
    tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-rf-pink/30 hover:shadow-lg dark:border-white/10 dark:bg-[#101827]">
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-sm font-black text-slate-950 dark:text-white">{label}</p>
        <p className="text-left text-xs font-bold text-slate-500 dark:text-slate-300 sm:text-right">
          {value}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${isUnlimited(metric.limit) ? 8 : metric.percent}%` }} />
      </div>
      <p className={`mt-2 text-xs font-bold ${tone === "red" ? "text-red-600 dark:text-red-300" : tone === "amber" ? "text-amber-700 dark:text-amber-200" : "text-slate-500 dark:text-slate-300"}`}>
        {description}
      </p>
    </div>
  );
}
