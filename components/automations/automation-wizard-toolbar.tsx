"use client";

import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

type Props = {
  backHref: string;
  currentStep: number;
  totalSteps: number;
  accountLabel?: string | null;
  onOpenPreview: () => void;
};

export default function AutomationWizardToolbar({ backHref, currentStep, totalSteps, accountLabel, onOpenPreview }: Props) {
  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1220]/95 sm:px-4">
      <Link
        href={backHref}
        aria-label="Back to automations"
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-rf-purple/30 hover:text-slate-950 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Automations</span>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-rf-blue">Step {currentStep} of {totalSteps}</span>
          {accountLabel ? <span className="hidden truncate text-[11px] font-bold text-slate-500 dark:text-slate-400 md:block">{accountLabel}</span> : null}
        </div>
        <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: totalSteps }, (_, index) => (
            <span
              key={index}
              className={[
                "h-1 flex-1 rounded-full transition-colors",
                index < currentStep ? "bg-gradient-to-r from-rf-blue to-rf-purple" : "bg-slate-200 dark:bg-white/10",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenPreview}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-rf-purple/25 px-3 text-xs font-black text-rf-purple xl:hidden"
      >
        <Eye className="h-4 w-4" /> Preview
      </button>
    </header>
  );
}
