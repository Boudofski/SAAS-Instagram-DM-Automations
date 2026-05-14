import { cn } from "@/lib/utils";

export type StepStatus = "done" | "active" | "todo";

type Step = { label: string; status: StepStatus };

type Props = { steps: Step[] };

export default function WizardStepper({ steps }: Props) {
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          {/* Circle + label */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step.status === "done" &&
                  "bg-rf-green text-white shadow-[0_0_10px_rgba(16,185,129,0.35)]",
                step.status === "active" &&
                  "bg-rf-blue text-white shadow-[0_0_14px_rgba(59,130,246,0.4)]",
                step.status === "todo" &&
                  "bg-rf-surface2 border border-rf-subtle text-rf-muted"
              )}
            >
              {step.status === "done" ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold whitespace-nowrap",
                step.status === "done" && "text-rf-green",
                step.status === "active" && "text-rf-blue",
                step.status === "todo" && "text-rf-subtle"
              )}
            >
              {step.label}
            </span>
          </div>
          {/* Connector */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 flex-1 mx-1 mb-4",
                step.status === "done"
                  ? "bg-rf-green"
                  : "bg-rf-subtle"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
