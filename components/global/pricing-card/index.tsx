import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Feature = { text: string; included: boolean };

type Props = {
  tier: string;
  price: string;
  period?: string;
  description: string;
  features: readonly Feature[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
};

export default function PricingCard({
  tier, price, period = "/month", description, features,
  ctaLabel, ctaHref, featured,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 overflow-hidden rounded-3xl p-7",
        featured
          ? "border border-rf-pink/35 bg-ap3k-gradient-soft shadow-ap3k-glow backdrop-blur-xl dark:border-rf-pink/35"
          : "ap3k-card"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      {featured && (
        <div className="absolute -right-16 top-8 h-32 w-32 rounded-full bg-rf-pink/20 blur-3xl" />
      )}
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ap3k-gradient px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-ap3k-glow">
          Most popular
        </div>
      )}

      <div className="relative">
        <p className={cn(
          "mb-3 text-xs font-black uppercase tracking-[0.2em]",
          featured ? "text-rf-magenta dark:text-white" : "text-slate-500 dark:text-rf-muted"
        )}>
          {tier}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-rf-text">{price}</span>
          <span className="text-sm text-slate-500 dark:text-rf-muted">{period}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-rf-muted">{description}</p>
      </div>

      <ul className="relative flex flex-1 flex-col gap-2.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={cn(
              "mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[11px] font-black",
              f.included
                ? "bg-emerald-50 text-emerald-600 dark:bg-rf-green/12 dark:text-rf-green"
                : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-rf-subtle"
            )}>
              {f.included ? "✓" : "—"}
            </span>
            <span className={f.included
              ? "text-slate-700 dark:text-rf-text"
              : "text-slate-400 line-through dark:text-rf-subtle"
            }>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={cn(
          "relative w-full rounded-xl font-bold",
          featured
            ? "ap3k-gradient-button border-0"
            : "ap3k-outline-button"
        )}
        variant={featured ? "default" : "outline"}
      >
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
