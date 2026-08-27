"use client";

import {
  PLAN_CARDS,
  PLAN_COMPARISON,
  annualMonthlyEquivalent,
  checkoutHref,
  type BillingInterval,
  type PaidPlan,
} from "@/lib/billing-plans";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PricingExperience({ compact = false }: { compact?: boolean }) {
  const [interval, setInterval] = useState<BillingInterval>("year");

  return (
    <div className="w-full">
      <div className="mx-auto mb-8 flex w-fit items-center rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_CARDS.map((plan, index) => {
          const isPaid = plan.id === "PRO" || plan.id === "BUSINESS";
          const paidPlan = isPaid ? (plan.id as PaidPlan) : null;
          const price =
            plan.id === "CUSTOM"
              ? null
              : interval === "year"
                ? plan.annualPrice
                : plan.monthlyPrice;
          const href =
            plan.id === "FREE"
              ? "/sign-up"
              : plan.id === "CUSTOM"
                ? "mailto:support@ap3k.com?subject=AP3K%20Custom%20Plan"
                : checkoutHref(paidPlan!, interval);
          const cta =
            plan.id === "FREE"
              ? "Start free"
              : plan.id === "CUSTOM"
                ? "Contact us"
                : `Choose ${plan.name}`;

          return (
            <article
              key={plan.id}
              className={`group relative flex min-h-full flex-col overflow-visible rounded-[28px] border p-6 shadow-sm transition-all duration-500 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-2xl ${
                plan.featured
                  ? "border-rf-pink/45 bg-gradient-to-b from-orange-50 via-pink-50/70 to-white shadow-[0_24px_80px_rgba(236,72,153,0.12)] dark:border-orange-500/45 dark:from-[#28150f] dark:via-[#171216] dark:to-[#101010]"
                  : "border-slate-200 bg-white/90 dark:border-white/10 dark:bg-[#0f1012]"
              }`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              {plan.featured && (
                <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-rf-pink px-4 py-1.5 text-xs font-black text-white shadow-lg">
                  <Sparkles className="h-3.5 w-3.5" /> Most popular
                </div>
              )}

              <div className="pt-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{plan.name}</h2>
                <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-slate-500 dark:text-slate-400">{plan.description}</p>
              </div>

              <div className="mt-6 min-h-[5rem]">
                {plan.id === "CUSTOM" ? (
                  <p className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">Let&apos;s talk</p>
                ) : (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">${price}</span>
                      <span className="mb-1 text-sm font-semibold text-slate-400">/{interval === "year" ? "year" : "month"}</span>
                    </div>
                    {interval === "year" && paidPlan && (
                      <p className="mt-1 text-xs font-black text-emerald-600 dark:text-emerald-300">
                        Save {plan.annualSavingsPercent}% · ${annualMonthlyEquivalent(paidPlan).toFixed(2)}/mo equivalent
                      </p>
                    )}
                    {plan.id === "FREE" && <p className="mt-1 text-xs font-bold text-slate-400">No credit card required</p>}
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-1 flex-col gap-3 border-t border-slate-100 pt-5 dark:border-white/[0.08]">
                {plan.features.map((feature, featureIndex) => (
                  <div
                    key={feature}
                    className={`flex items-start gap-2.5 rounded-xl px-2 py-1.5 text-sm ${
                      featureIndex === 0 && plan.id !== "FREE"
                        ? "border border-orange-500/15 bg-orange-500/[0.07] font-bold text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={href}
                className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-black transition-all duration-300 motion-safe:hover:-translate-y-0.5 ${
                  plan.featured
                    ? "bg-gradient-to-r from-orange-500 to-rf-pink text-white shadow-[0_14px_38px_rgba(249,115,22,0.26)] hover:shadow-[0_18px_48px_rgba(236,72,153,0.30)]"
                    : "border border-slate-200 bg-slate-50 text-slate-900 hover:border-orange-500/30 hover:bg-orange-500/[0.06] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
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
