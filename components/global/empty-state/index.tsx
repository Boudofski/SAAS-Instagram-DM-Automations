import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export default function EmptyState({ icon, title, description, ctaLabel, ctaHref }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 bg-ap3k-gradient-soft text-4xl shadow-sm dark:border-white/10 dark:shadow-ap3k-glow">
        {icon}
      </div>
      <div>
        <h3 className="mb-1 text-lg font-black text-slate-950 dark:text-rf-text">{title}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-rf-muted">{description}</p>
      </div>
      {ctaLabel && ctaHref && (
        <Button asChild className="ap3k-gradient-button mt-2 px-5">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
