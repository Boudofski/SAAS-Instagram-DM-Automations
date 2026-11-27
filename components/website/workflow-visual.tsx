import { ArrowRight, Check, ListChecks } from "lucide-react";

/** An illustration of the steps in this guide, without simulated customer data. */
export default function WorkflowVisual({ labels }: { labels: readonly string[] }) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-[#f3eeff] via-white to-[#e7faf4] p-4 text-slate-950 dark:border-violet-300/25 dark:from-[#211641] dark:via-[#131525] dark:to-[#092921] dark:text-white sm:p-7">
      <figcaption className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <ListChecks size={17} className="text-violet-600 dark:text-violet-300" aria-hidden="true" /> Workflow at a glance
      </figcaption>
      <ol className="grid gap-3 sm:grid-cols-3">
        {labels.map((label, i) => (
          <li key={label} className="relative flex min-w-0 items-center gap-3 rounded-2xl border border-violet-200/80 bg-white/90 p-4 text-sm font-bold shadow-sm dark:border-white/15 dark:bg-[#151829] sm:flex-col sm:items-start">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-700 text-white">
              {i === labels.length - 1 ? <Check size={17} aria-hidden="true" /> : String(i + 1).padStart(2, "0")}
            </span>
            <span>{label}</span>
            {i < labels.length - 1 && <ArrowRight aria-hidden="true" size={15} className="absolute -end-[14px] top-6 hidden text-violet-700 dark:text-violet-300 sm:block" />}
          </li>
        ))}
      </ol>
    </figure>
  );
}
