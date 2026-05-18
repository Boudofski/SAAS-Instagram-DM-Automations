import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  icon: string;
  delta?: string;
  deltaDir?: "up" | "down" | "neutral";
  empty?: boolean;
};

export default function StatCard({ label, value, icon, delta, deltaDir = "neutral", empty }: Props) {
  return (
    <div className="ap3k-card ap3k-card-hover relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rf-pink/50 to-transparent" />
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-rf-muted">
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-black text-rf-pink shadow-inner dark:border-white/10 dark:bg-white/[0.04] dark:text-base">
          {icon}
        </span>
        {label}
      </div>
      <div className="text-3xl font-black tracking-tight text-slate-950 dark:text-rf-text">
        {empty ? "—" : value}
      </div>
      {delta && !empty && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full w-fit border",
            deltaDir === "up" && "bg-rf-green/10 text-rf-green",
            deltaDir === "down" && "bg-red-500/10 text-red-400",
            deltaDir === "neutral" && "bg-white/5 text-rf-muted border-white/10"
          )}
        >
          {delta}
        </span>
      )}
    </div>
  );
}
