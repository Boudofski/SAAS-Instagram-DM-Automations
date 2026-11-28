"use client";

import { useState } from "react";
import Link from "next/link";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { useI18n } from "@/providers/i18n-provider";
import { localizePublicPath } from "@/lib/i18n/config";
import { suggestPublicPlan } from "@/lib/pricing-plan-fit";
import { getPlanLimits } from "@/lib/plan-limits";
import { PLAN_FIT_COPY } from "./pricing-plan-fit-copy";

const fields = ["actions", "accounts", "automations"] as const;

export default function PricingPlanFit() {
  const { locale } = useI18n();
  const copy = PLAN_FIT_COPY[locale];
  const [values, setValues] = useState({ actions: "250", accounts: "1", automations: "1" });
  const [paidFeatures, setPaidFeatures] = useState(false);
  const valid = fields.every(key => /^\d+$/.test(values[key]) && Number.isSafeInteger(Number(values[key])) && (key !== "accounts" || Number(values[key]) > 0));
  const plan = valid ? suggestPublicPlan({
    actions: Number(values.actions),
    accounts: Number(values.accounts),
    automations: Number(values.automations),
    paidFeatures,
  }) : null;
  return (
    <section id="plan-fit" dir={locale === "ar" ? "rtl" : "ltr"} aria-labelledby="plan-fit-title" className="mx-auto mt-10 scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 text-start dark:border-white/10 dark:bg-[#161622] sm:p-8">
      <h2 id="plan-fit-title" className="flex items-center gap-2 text-xl font-bold text-slate-950 dark:text-white"><ChartNoAxesColumnIncreasing aria-hidden="true" size={22} className="shrink-0 text-violet-700 dark:text-violet-300" />{copy.jump}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.intro}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {fields.map(key => <label key={key} className="grid min-w-0 gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <span>{copy[key]}</span>
          <input type="number" inputMode="numeric" min={key === "accounts" ? 1 : 0} step={1} required value={values[key]} onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))}
            className="w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:border-white/25 dark:bg-slate-950" />
        </label>)}
      </div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
        <input type="checkbox" checked={paidFeatures} onChange={event => setPaidFeatures(event.target.checked)} className="h-4 w-4 shrink-0 accent-violet-700" />
        {copy.paid}
      </label>
      <div className="mt-3 flex min-h-24 flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/50">
        <div aria-live="polite" aria-atomic="true" className="text-sm text-slate-700 dark:text-slate-200">
          {valid ? <>{plan ? copy.match : copy.none}{plan && <strong className="mt-1 block text-xl text-violet-800 dark:text-violet-200">{plan === "FREE" ? copy.free : getPlanLimits(plan).label}</strong>}</> : copy.invalid}
        </div>
        {valid && (plan
          ? <a href={`#pricing-plan-${plan.toLowerCase()}`} className="font-semibold text-violet-800 underline underline-offset-4 dark:text-violet-200">{copy.see}</a>
          : <Link href={localizePublicPath("/contact", locale)} className="font-semibold text-violet-800 underline underline-offset-4 dark:text-violet-200">{copy.contact}</Link>)}
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-300">{copy.note}</p>
    </section>
  );
}
