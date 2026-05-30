"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function AdvancedPanel({
  children,
  label = "Advanced",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-500 hover:text-slate-300"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-white/[0.06] px-4 py-3">{children}</div>}
    </div>
  );
}
