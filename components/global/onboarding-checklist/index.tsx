import { cn } from "@/lib/utils";

type ChecklistItem = {
  label: string;
  done: boolean;
  href?: string;
};

type Props = { items: ChecklistItem[] };

export default function OnboardingChecklist({ items }: Props) {
  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  if (doneCount === items.length) return null;

  return (
    <div className="ap3k-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-rf-text">Getting started</h3>
        <span className="text-xs text-rf-muted">{doneCount} of {items.length} done</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/[0.08] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-ap3k-gradient transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-xs">
            <span
              className={cn(
                "w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                item.done
                  ? "bg-rf-green text-white shadow-[0_0_18px_rgba(16,185,129,0.24)]"
                  : "border border-white/15 bg-white/[0.03] text-rf-subtle"
              )}
            >
              {item.done ? "✓" : ""}
            </span>
            {item.href && !item.done ? (
              <a href={item.href} className="font-semibold text-rf-pink hover:text-rf-purple">
                {item.label}
              </a>
            ) : (
              <span className={item.done ? "text-rf-text" : "text-rf-muted"}>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
