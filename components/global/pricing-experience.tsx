"use client";

import {
  PLAN_CARDS,
  PLAN_COMPARISON,
  annualMonthlyEquivalent,
  checkoutHref,
  type BillingInterval,
  type CustomerPlan,
  type PaidPlan,
} from "@/lib/billing-plans";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
  compact?: boolean;
  dashboardCompact?: boolean;
  currentPlan?: CustomerPlan;
  existingPaid?: boolean;
};

export default function PricingExperience({
  compact = false,
  dashboardCompact = false,
  currentPlan,
  existingPaid = false,
}: Props) {
  const [interval, setInterval] = useState<BillingInterval>("year");

  return (
    <div className="w-full">
      <div className={`mx-auto flex w-fit items-center rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] ${dashboardCompact ? "mb-5" : "mb-8"}`}>
        <button
          type="button"
          onClick={() => setInterval("month")}
          className={`rounded-xl px-4 py-2 text-sm font-black transition-all ${
            interval === "month"
              ? "bg-slate-950 text-white shadow dark:bg-white dark:text-slate-950"
              : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all ${
            interval === "year"
              ? "bg-slate-950 text-white shadow dark:bg-white dark:text-slate-950"
              : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Annual
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-300">
            Save up to 27%
          </span>
        </button>
      </div>

      {existingPaid && (
        <p className={`mx-auto max-w-3xl rounded-2xl border border-blue-200 bg-blue-50 px-4 text-center font-bold text-blue-800 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200 ${dashboardCompact ? "mb-5 py-2.5 text-xs sm:text-sm" : "mb-6 py-3 text-sm"}`}>
          You already have a paid subscription. Use <strong>Manage billing</strong> to change plan, billing interval, payment method, or cancellation settings.
        </p>
      )}

      <div className={`grid ${dashboardCompact ? "gap-3 sm:grid-cols-2 xl:grid-cols-4" : "gap-5 md:grid-cols-2 xl:grid-cols-4"}`}>
        {PLAN_CARDS.map((plan, index) => {
          const isPaid = plan.id === "PRO" || plan.id === "BUSINESS";
          const paidPlan = isPaid ? (plan.id as PaidPlan) : null;
          const isCurrent = Boolean(currentPlan && plan.id === currentPlan);
          const price =
            plan.id === "CUSTOM"
              ? null
              : interval === "year"
                ? plan.annualPrice
                : plan.monthlyPrice;

          let href =
            plan.id === "FREE"
              ? "/sign-up"
              : plan.id === "CUSTOM"
                ? "mailto:support@ap3k.com?subject=AP3K%20Custom%20Plan"
                : checkoutHref(paidPlan!, interval);
          let cta =
            plan.id === "FREE"
              ? "Start free"
              : plan.id === "CUSTOM"
                ? "Contact us"
                : `Choose ${plan.name}`;

          if (isCurrent) {
            href = existingPaid ? "#manage-billing" : "/dashboard";
            cta = "Current plan";
          } else if (existingPaid && plan.id !== "CUSTOM") {
            href = "#manage-billing";
            cta = "Manage in portal";
          }

          const visibleFeatures = dashboardCompact ? plan.features.slice(0, 4) : plan.features;
          const remainingFeatures = Math.max(0, plan.features.length - visibleFeatures.length);

          return (
            <article
              key={plan.id}
              className={`group relative flex min-h-full flex-col overflow-visible border shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-xl ${dashboardCompact ? "rounded-2xl p-4" : "rounded-[28px] p-6"} ${
                isCurrent ? "ring-2 ring-emerald-500/50" : ""
              } ${
                plan.featured
                  ? "border-rf-pink/45 bg-gradient-to-b from-orange-50 via-pink-50/70 to-white shadow-[0_20px_60px_rgba(236,72,153,0.10)] dark:border-orange-500/40 dark:from-[#241611] dark:via-[#171218] dark:to-[#101114]"
                  : "border-slate-200 bg-white/90 dark:border-white/10 dark:bg-[#101217]"
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {plan.featured && (
                <div className={`absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-rf-pink font-black text-white shadow-lg ${dashboardCompact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"}`}>
                  <Sparkles className="h-3.5 w-3.5" /> Most popular
                </div>
              )}
              {isCurrent && (
                <span className="absolute right-3 top-3 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Current
                </span>
              )}

              <div className={dashboardCompact ? "pt-1" : "pt-2"}>
                <h2 className={`${dashboardCompact ? "text-xl" : "text-2xl"} font-black tracking-tight text-slate-950 dark:text-white`}>{plan.name}</h2>
                <p className={`${dashboardCompact ? "mt-1 min-h-[2.5rem] text-xs leading-5" : "mt-2 min-h-[3rem] text-sm leading-relaxed"} text-slate-500 dark:text-slate-400`}>{plan.description}</p>
              </div>

              <div className={dashboardCompact ? "mt-3 min-h-[3.8rem]" : "mt-6 min-h-[5rem]"}>
                {plan.id === "CUSTOM" ? (
                  <p className={`${dashboardCompact ? "text-3xl" : "text-4xl"} font-black tracking-tight text-slate-950 dark:text-white`}>Let&apos;s talk</p>
                ) : plan.id === "FREE" ? (
                  <div>
                    <p className={`${dashboardCompact ? "text-3xl" : "text-4xl"} font-black tracking-tight text-slate-950 dark:text-white`}>
                      Free forever
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-slate-400">No credit card required</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-1">
                      <span className={`${dashboardCompact ? "text-3xl" : "text-4xl"} font-black tracking-tight text-slate-950 dark:text-white`}>${price}</span>
                      <span className="mb-1 text-xs font-semibold text-slate-400">/{interval === "year" ? "year" : "month"}</span>
                    </div>
                    {interval === "year" && paidPlan && (
                      <p className="mt-1 text-[11px] font-black text-emerald-600 dark:text-emerald-300">
                        Save {plan.annualSavingsPercent}% · ${annualMonthlyEquivalent(paidPlan).toFixed(2)}/mo
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className={`${dashboardCompact ? "mt-3 gap-1.5 border-t pt-3" : "mt-5 gap-3 border-t pt-5"} flex flex-1 flex-col border-slate-100 dark:border-white/[0.08]`}>
                {visibleFeatures.map((feature, featureIndex) => (
                  <div
                    key={feature}
                    className={`flex items-start gap-2 rounded-xl ${dashboardCompact ? "px-1 py-1 text-xs" : "px-2 py-1.5 text-sm"} ${
                      featureIndex === 0 && plan.id !== "FREE"
                        ? "font-bold text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                    <span>{feature}</span>
                  </div>
                ))}
                {dashboardCompact && remainingFeatures > 0 && (
                  <p className="px-1 pt-1 text-[11px] font-bold text-violet-600 dark:text-violet-300">+{remainingFeatures} more included</p>
                )}
              </div>

              <Link
                href={href}
                className={`${dashboardCompact ? "mt-4 min-h-10 rounded-xl px-3 text-xs" : "mt-7 min-h-12 rounded-2xl px-5 text-sm"} inline-flex items-center justify-center font-black transition-all duration-200 ${
                  isCurrent
                    ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : plan.featured
                      ? "bg-gradient-to-r from-orange-500 to-rf-pink text-white shadow-[0_12px_30px_rgba(236,72,153,0.20)]"
                      : "border border-slate-200 bg-slate-50 text-slate-900 hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                }`}
              >
                {cta}
              </Link>
            </article>
          );
        })}
      </div>

      {!compact && (
        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="ap3k-kicker">Compare plans</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Plans, side by side</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Real AP3K features and limits—no feature placeholders or hidden reply terminology.</p>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-[#0f1012]">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="px-6 py-5 font-black text-slate-500">Feature</th>
                  <th className="bg-orange-500/[0.06] px-6 py-5 font-black text-orange-500">Pro</th>
                  <th className="px-6 py-5 font-black text-slate-950 dark:text-white">Business</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-100 last:border-b-0 dark:border-white/[0.07]">
                    <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">{row.feature}</td>
                    <td className="bg-orange-500/[0.04] px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{row.pro}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{row.business}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
