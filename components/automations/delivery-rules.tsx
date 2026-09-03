"use client";

import { Clock3, UserCheck, Waves } from "lucide-react";

type Props = {
  followGateRequired: boolean;
  typingIndicator: boolean;
  deliveryDelaySeconds: number;
  onChange: (next: Partial<Pick<Props, "followGateRequired" | "typingIndicator" | "deliveryDelaySeconds">>) => void;
};

const DELAYS = [0, 3, 5, 10, 30] as const;

export default function DeliveryRules({ followGateRequired, typingIndicator, deliveryDelaySeconds, onChange }: Props) {
  return (
    <div className="space-y-3">
      <RuleToggle
        icon={UserCheck}
        title="Follow gate required"
        description="Followers get the payload. Non-followers must use the Follow and I followed buttons first."
        checked={followGateRequired}
        onChange={(checked) => onChange({ followGateRequired: checked })}
      />
      {followGateRequired ? (
        <div className="rounded-2xl border border-rf-purple/20 bg-rf-purple/[0.06] p-4 dark:border-rf-purple/30 dark:bg-rf-purple/[0.09]">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rf-purple dark:text-violet-300">Follower experience</p>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
            AP3K sends two clickable options: <strong>Follow</strong> opens your Instagram profile and <strong>I followed ✅</strong> verifies the follow. If verification fails, the same options return with <strong>❌ Not Following Yet!</strong>
          </p>
        </div>
      ) : null}
      <RuleToggle
        icon={Waves}
        title="Show typing status"
        description="Displays Instagram's typing indicator before the automated response."
        checked={typingIndicator}
        onChange={(checked) => onChange({ typingIndicator: checked })}
      />
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rf-purple/10 text-rf-purple"><Clock3 className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-black text-slate-950 dark:text-white">Randomized delivery delay</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Waits a random amount up to your selection before sending.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {DELAYS.map((delay) => (
            <button
              key={delay}
              type="button"
              onClick={() => onChange({ deliveryDelaySeconds: delay })}
              className={[
                "rounded-xl border px-2 py-2.5 text-xs font-black transition",
                deliveryDelaySeconds === delay
                  ? "border-rf-purple bg-rf-purple text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-rf-purple/35 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300",
              ].join(" ")}
            >
              {delay === 0 ? "Immediately" : `${delay}s`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RuleToggle({ icon: Icon, title, description, checked, onChange }: { icon: typeof UserCheck; title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-rf-purple/30 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rf-purple/10 text-rf-purple"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-950 dark:text-white">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-rf-purple dark:bg-slate-700"><span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" /></span>
    </label>
  );
}
