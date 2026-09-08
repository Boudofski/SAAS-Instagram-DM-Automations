"use client";

import { Check, MessageCircle, Play, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AutomationDemo({ keyword }: { keyword: string }) {
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  function run() {
    clearTimers();
    setStep(1);
    timers.current = [
      window.setTimeout(() => setStep(2), 650),
      window.setTimeout(() => setStep(3), 1300),
    ];
  }

  useEffect(() => clearTimers, []);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0f19] shadow-2xl shadow-violet-950/30">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Interactive example</p>
          <p className="mt-1 text-sm font-bold text-white">Comment → match → DM</p>
        </div>
        <button onClick={step ? () => { clearTimers(); setStep(0); } : run} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-violet-700 transition hover:-translate-y-0.5">
          {step ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {step ? "Reset" : "Run example"}
        </button>
      </div>
      <div className="grid min-h-[330px] gap-5 p-5 sm:p-7">
        <div className={`flex items-start gap-3 transition-all duration-300 ${step >= 1 ? "opacity-100" : "opacity-35"}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fuchsia-500/15 text-fuchsia-300"><MessageCircle className="h-4 w-4" /></span>
          <div className="rounded-2xl rounded-tl-md bg-white/8 px-4 py-3 text-sm text-white">Please send me the {keyword.toLowerCase()}.</div>
        </div>
        <div className={`mx-auto flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition-all duration-300 ${step >= 2 ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/30"}`}>
          <Check className="h-3.5 w-3.5" /> Keyword {keyword} matched
        </div>
        <div className={`ml-auto flex max-w-[90%] items-start gap-3 transition-all duration-300 ${step >= 3 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-25"}`}>
          <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 py-3 text-sm text-white shadow-lg">
            Here’s what you asked for.
            <span className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/16 px-4 py-2 font-black"><Send className="h-3.5 w-3.5" /> Open link</span>
          </div>
        </div>
      </div>
    </div>
  );
}
