"use client";

import PricingExperience from "@/components/global/pricing-experience";
import { planDisplayName, type CustomerPlan } from "@/lib/billing-plans";
import type { BillingSnapshot } from "@/lib/billing-snapshot";
import { getBillingUsagePresentation, type BillingMetricKind } from "@/lib/billing-presentation";
import { isManageableSubscriptionStatus } from "@/lib/billing-snapshot";
import { isUnlimited, type UsageSummary } from "@/lib/plan-limits";
import { CalendarDays, CreditCard, Info } from "lucide-react";
import { ManageBillingButton } from "./manage-billing-button";

type Props = {
  current?: CustomerPlan;
  usage?: UsageSummary;
  billingEmail?: string;
  billingState?: "none" | "subscription" | "unavailable";
  billing?: BillingSnapshot | null;
};

export default function Billing({
  current = "FREE",
  usage,
  billingEmail,
  billingState = "none",
  billing,
}: Props) {
  const planLabel = usage?.planLabel ?? planDisplayName(current);
  const hasStripeSubscription = billingState === "subscription" && Boolean(billing);
  const activeStripeSubscription = hasStripeSubscription && isManageableSubscriptionStatus(billing?.status);
  const internalAccess = current !== "FREE" && billingState === "none";

  return (
    <div className="flex w-full flex-col gap-5">
      <div id="manage-billing" className="ap3k-page-header scroll-mt-24">
        <div>
          <p className="ap3k-kicker">Billing</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Plans, usage &amp; subscription
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Manage your plan and monthly automated-action usage.</p>
        </div>
        {hasStripeSubscription && <ManageBillingButton activeSubscription={activeStripeSubscription} />}
      </div>

      {internalAccess ? (
        <section className="flex gap-3 rounded-2xl border border-violet-300/40 bg-violet-50/80 p-4 text-violet-950 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-100">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
          <div>
            <p className="text-sm font-black">Internal plan access</p>
            <p className="mt-1 text-xs leading-5 text-violet-800/80 dark:text-violet-200/80">
              This workspace has complimentary AP3K access and is not billed through Stripe. There is no recurring charge, cancellation, or invoice history.
              {billingEmail ? ` Account: ${billingEmail}.` : ""}
            </p>
          </div>
        </section>
      ) : null}

      {billingState === "unavailable" ? (
        <p role="status" className="rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
          Stripe billing status is temporarily unavailable. Refresh this page before starting another checkout.
        </p>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-rf-pink/20 bg-gradient-to-br from-white via-orange-50/40 to-pink-50/50 p-4 shadow-sm dark:border-rf-pink/20 dark:from-[#151312] dark:via-[#101217] dark:to-[#171018] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="ap3k-kicker">Current plan</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{planLabel}</h2>
              <span className="ap3k-badge ap3k-badge-green">Active</span>
              {internalAccess ? <span className="ap3k-badge ap3k-badge-slate">Internal access</span> : null}
              {billing?.interval && (
                <span className="ap3k-badge ap3k-badge-slate">
                  {billing.interval === "year" ? "Annual billing" : "Monthly billing"}
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">
              Usage refreshes monthly. Free includes up to 5 active automations; paid plans include unlimited automations. Each workspace supports one connected Instagram account.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[390px]">
            <BillingFact
              icon={<CreditCard className="h-4 w-4" />}
              label="Subscription"
              value={billing?.status ? friendlyStatus(billing.status, billing.cancelAtPeriodEnd) : current === "FREE" ? "Free" : internalAccess ? "Internal access" : "Status unavailable"}
            />
            <BillingFact
              icon={<CalendarDays className="h-4 w-4" />}
              label={internalAccess ? "Billing" : billing?.cancelAtPeriodEnd ? "Access until" : "Next renewal"}
              value={billing?.renewsAt
                  ? formatDate(billing.renewsAt)
                  : internalAccess
                    ? "No recurring charge"
                  : usage
                    ? `${usage.periodLabel} usage`
                    : "Monthly reset"}
            />
          </div>
        </div>

        {usage && (
          <div className={`mt-4 grid gap-2 ${current === "FREE" ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
            <UsageBar label="Automated actions" metric={usage.staticReplies} />
            {current !== "FREE" ? <UsageBar label="AI replies" metric={usage.aiReplies} helper="Comment replies, DM replies, and playground tests this month." /> : null}
            <UsageBar label="Active automations" metric={usage.activeCampaigns} helper={current === "FREE" ? "Free includes up to 5 active automations." : "Unlimited automations are included."} />
          </div>
        )}
        <p className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">One successful comment reply or DM counts as one automated action.</p>
      </section>

      <section>
        <div className="mb-3">
          <p className="ap3k-kicker">Choose your volume</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">Plans</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Paid subscribers change plans and payment details securely in the billing portal.</p>
        </div>
        <PricingExperience compact dashboardCompact currentPlan={current} existingPaid={activeStripeSubscription} internalPlanAccess={internalAccess} />
      </section>
    </div>
  );
}

function BillingFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
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
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-3.5 dark:border-white/10 dark:bg-[#101217]">
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-sm font-black text-slate-950 dark:text-white">{label}</p>
        <p className="text-left text-xs font-bold text-slate-500 dark:text-slate-300 sm:text-right">{value}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
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
