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
        "relative flex flex-col gap-5 rounded-2xl border p-7",
        featured
          ? "border-rf-blue/40 bg-gradient-to-b from-rf-blue/8 to-rf-surface shadow-[0_0_40px_rgba(59,130,246,0.12)]"
          : "border-rf-border bg-rf-surface"
      )}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rf-blue to-rf-purple
                        text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap">
          Most popular
        </div>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-rf-muted mb-3">{tier}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-rf-text">{price}</span>
          <span className="text-sm text-rf-muted">{period}</span>
        </div>
        <p className="text-sm text-rf-muted mt-2">{description}</p>
      </div>

      <ul className="flex flex-col gap-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={f.included ? "text-rf-green" : "text-rf-subtle"}>
              {f.included ? "✓" : "—"}
            </span>
            <span className={f.included ? "text-rf-text" : "text-rf-subtle line-through"}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={cn(
          "w-full font-bold",
          featured
            ? "bg-rf-blue hover:bg-rf-blue/90 text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)]"
            : "bg-transparent border border-rf-border hover:border-rf-subtle text-rf-text"
        )}
        variant={featured ? "default" : "outline"}
      >
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
