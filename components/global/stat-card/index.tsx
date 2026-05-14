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
    <div className="bg-rf-surface border border-rf-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-rf-muted text-xs font-semibold uppercase tracking-widest">
        <span>{icon}</span>
        {label}
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-rf-text">
        {empty ? "—" : value}
      </div>
      {delta && !empty && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md w-fit",
            deltaDir === "up" && "bg-rf-green/10 text-rf-green",
            deltaDir === "down" && "bg-red-500/10 text-red-400",
            deltaDir === "neutral" && "bg-rf-border text-rf-muted"
          )}
        >
          {delta}
        </span>
      )}
    </div>
  );
}
