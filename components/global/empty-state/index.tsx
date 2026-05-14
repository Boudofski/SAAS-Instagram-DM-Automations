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
      <div className="text-5xl">{icon}</div>
      <div>
        <h3 className="text-lg font-bold text-rf-text mb-1">{title}</h3>
        <p className="text-sm text-rf-muted max-w-sm leading-relaxed">{description}</p>
      </div>
      {ctaLabel && ctaHref && (
        <Button asChild className="bg-rf-blue hover:bg-rf-blue/90 text-white font-bold mt-2">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
