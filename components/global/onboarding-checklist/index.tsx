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
    <div className="bg-rf-surface border border-rf-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-rf-text">Getting started</h3>
        <span className="text-xs text-rf-muted">{doneCount} of {items.length} done</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-rf-border rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rf-blue to-rf-purple transition-all duration-500"
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
                  ? "bg-rf-green text-white"
                  : "border-2 border-rf-subtle text-rf-subtle"
              )}
            >
              {item.done ? "✓" : ""}
            </span>
            {item.href && !item.done ? (
              <a href={item.href} className="text-rf-blue font-semibold hover:underline">
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
