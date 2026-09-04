"use client";

import { UserCheck } from "lucide-react";

type DeliveryRuleFields = {
  followGateRequired: boolean;
  followRequestDmText: string;
  followRequestButtonText: string;
};

type Props = DeliveryRuleFields & {
  onChange: (next: Partial<DeliveryRuleFields>) => void;
};

export default function DeliveryRules({
  followGateRequired,
  followRequestDmText,
  followRequestButtonText,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-rf-purple/30 dark:border-white/10 dark:bg-white/[0.04]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rf-purple/10 text-rf-purple">
          <UserCheck className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-950 dark:text-white">
            Ask people to follow before sending the link
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
            Optional. AP3K checks their follow after they tap the button, then sends your final DM only when verified.
          </span>
        </span>
        <input
          type="checkbox"
          checked={followGateRequired}
          onChange={(event) => onChange({ followGateRequired: event.target.checked })}
          className="peer sr-only"
        />
        <span aria-hidden="true" className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-rf-purple dark:bg-slate-700">
          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>

      {followGateRequired ? (
        <div className="rounded-2xl border border-rf-purple/20 bg-rf-purple/[0.06] p-4 dark:border-rf-purple/30 dark:bg-rf-purple/[0.09] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-rf-purple dark:text-violet-300">Follow request DM</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Sent only when the person is not following yet.</p>
            </div>
            <span className="rounded-full bg-rf-purple/10 px-2.5 py-1 text-[11px] font-black text-rf-purple">Optional step</span>
          </div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Message</label>
          <textarea
            value={followRequestDmText}
            onChange={(event) => onChange({ followRequestDmText: event.target.value })}
            maxLength={640}
            rows={5}
            dir="auto"
            className="ap3k-textarea w-full rounded-xl px-4 py-3 text-sm"
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              Verification button
              <input
                value={followRequestButtonText}
                onChange={(event) => onChange({ followRequestButtonText: event.target.value })}
                maxLength={20}
                className="ap3k-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm"
              />
            </label>
            <span className="rounded-xl border border-rf-purple/20 bg-white px-4 py-3 text-center text-xs font-black text-rf-purple dark:bg-[#111827]">
              Rechecks follow
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Still not following? This request appears again. Follow confirmed? Your final DM is sent immediately.
          </p>
        </div>
      ) : null}
    </div>
  );
}
