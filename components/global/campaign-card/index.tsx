"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Keyword = { id: string; word: string };

type Props = {
  id?: string | null;
  slug: string;
  name?: string | null;
  active?: boolean | null;
  keywords?: Keyword[] | null;
  dmCount?: number | null;
  leadCount?: number;
  listenerType?: "SMARTAI" | "MESSAGE" | null;
};

const KW_COLOURS = [
  "bg-rf-pink/10 text-rf-pink border-rf-pink/20",
  "bg-rf-purple/10 text-rf-purple border-rf-purple/20",
  "bg-rf-blue/10 text-rf-blue border-rf-blue/20",
  "bg-rf-green/10 text-rf-green border-rf-green/20",
] as const;

export default function CampaignCard({
  id, slug, name, active, keywords, dmCount, leadCount, listenerType,
}: Props) {
  const safeKeywords = Array.isArray(keywords) ? keywords : [];
  const safeId = id ?? "";
  const safeName = name?.trim() || "Untitled campaign";
  const isActive = Boolean(active);
  const safeDmCount = typeof dmCount === "number" ? dmCount : 0;

  return (
    <Link
      href={safeId ? `/dashboard/${slug}/automation/${safeId}` : `/dashboard/${slug}/automation`}
      className="ap3k-card ap3k-card-hover group relative overflow-hidden rounded-2xl p-4
                 flex flex-col gap-4 sm:flex-row sm:items-center"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-ap3k-gradient opacity-70" />
      {/* Status dot */}
      <span
        className={cn(
          "absolute right-4 top-4 h-2.5 w-2.5 rounded-full sm:static sm:flex-shrink-0",
          isActive ? "bg-rf-green shadow-[0_0_14px_rgba(16,185,129,0.85)]" : "bg-rf-amber"
        )}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-rf-text truncate mb-2">{safeName}</p>
        <div className="flex gap-1.5 flex-wrap">
          {safeKeywords.length === 0 ? (
            <span className="text-xs text-rf-muted border border-dashed border-rf-border rounded-full px-2 py-0.5">
              No keywords
            </span>
          ) : (
            safeKeywords.slice(0, 4).map((kw, i) => (
              <span
                key={kw.id ?? `${kw.word}-${i}`}
                className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-full border bg-white/[0.03]",
                  KW_COLOURS[i % KW_COLOURS.length]
                )}
              >
                {kw.word}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-shrink-0 text-left sm:text-right">
        <div>
          <p className="text-base font-black text-rf-text">{safeDmCount}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-rf-muted">DMs</p>
        </div>
        {leadCount !== undefined && (
          <div>
            <p className="text-base font-black text-rf-text">{leadCount}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-rf-muted">Leads</p>
          </div>
        )}
      </div>

      {/* Tag */}
      <Badge
        className={cn(
          "w-fit text-xs font-bold flex-shrink-0 rounded-full",
          isActive
            ? "bg-rf-green/10 text-rf-green border-rf-green/25"
            : "bg-rf-amber/10 text-rf-amber border-rf-amber/25"
        )}
        variant="outline"
      >
        {isActive ? "Live" : "Paused"}
      </Badge>
    </Link>
  );
}
