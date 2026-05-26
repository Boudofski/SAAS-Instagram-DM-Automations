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
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 bg-ap3k-gradient-soft text-4xl shadow-[0_4px_16px_rgba(221,42,123,0.10)] dark:border-white/[0.12] dark:shadow-[0_4px_24px_rgba(221,42,123,0.18)]">
        {icon}
      </div>
      <div>
        <h3 className="mb-1.5 text-lg font-black text-slate-950 dark:text-rf-text">{title}</h3>
        <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-rf-muted">{description}</p>
      </div>
      {ctaLabel && ctaHref && (
        <Button asChild className="ap3k-gradient-button px-5">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
