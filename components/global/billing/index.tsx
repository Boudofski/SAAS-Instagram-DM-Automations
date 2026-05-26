"use client";

import { formatConnectedAccountsHelper, formatUsageMetricValue, isUnlimited, usageTone, type UsageSummary } from "@/lib/plan-limits";
import PaymentCard from "./payment-card";

type Props = {
  current?: "PRO" | "FREE";
  usage?: UsageSummary;
};

function Billing({ current = "FREE", usage }: Props) {
  const planLabel = usage?.planLabel ?? (current === "PRO" ? "Creator" : "Free");

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <p className="ap3k-kicker">Billing</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Plans &amp; Usage
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Free for testing. Creator for serious campaigns. Agency for multi-account teams.
        </p>
      </div>
      {usage && (
        <div className="overflow-hidden rounded-3xl border border-rf-pink/25 bg-gradient-to-br from-white via-pink-50/70 to-indigo-50 p-5 shadow-sm dark:border-rf-pink/30 dark:from-[#16111f] dark:via-[#101827] dark:to-[#0b1020] sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="ap3k-kicker">Current plan</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Plan: {planLabel}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {usage.periodLabel} usage. Successful static public replies and private DMs count toward your monthly limit.
              </p>
            </div>
            <div className="w-fit rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-xs font-black text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
              Enforcement from {new Date(usage.enforcementStart).toLocaleDateString()}
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <UsageBar label="Static replies" metric={usage.staticReplies} />
            <UsageBar label="Active campaigns" metric={usage.activeCampaigns} />
            <UsageBar label="Connected Instagram accounts" metric={usage.connectedAccounts} helper={formatConnectedAccountsHelper(planLabel, usage.connectedAccounts)} />
          </div>
          {current === "FREE" ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Upgrade to Creator to unlock more replies and unlimited campaigns.
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              Creator plan active.
            </p>
          )}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <PaymentCard label="FREE" current={current} />
        <PaymentCard label="PRO" current={current} />
        <PaymentCard label="AGENCY" current={current} />
      </div>
    </div>
  );
}

export default Billing;

function UsageBar({ label, metric, helper }: { label: string; metric: UsageSummary["staticReplies"]; helper?: string }) {
  const tone = usageTone(metric.percent, metric.blocked);
  const bar =
    tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#101827]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-950 dark:text-white">{label}</p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-300">
          {formatUsageMetricValue(metric)}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${isUnlimited(metric.limit) ? 6 : metric.percent}%` }} />
      </div>
      <p className={`mt-2 text-xs font-bold ${metric.blocked ? "text-red-600 dark:text-red-300" : "text-slate-500 dark:text-slate-300"}`}>
        {helper ?? (metric.blocked ? "Limit reached" : isUnlimited(metric.limit) ? "Unlimited" : `${metric.remaining?.toLocaleString()} remaining`)}
      </p>
    </div>
  );
}
