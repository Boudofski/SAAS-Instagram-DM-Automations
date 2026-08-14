"use client";

import { activateAutomation, deleteAutomation, duplicateAutomation } from "@/actions/automation";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCampaignModeLabel } from "@/lib/campaign-mode-label";
import { formatKeywordDisplay } from "@/lib/keyword-display";
import { isMessagingReviewMode } from "@/lib/messaging-review-mode";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

type AutomationTableProps = {
  slug: string;
  automations: any[];
  showControls?: boolean;
  pageSize?: number;
};

type ReplySummary = {
  label: string;
  compactLabel: string;
  tone: "green" | "amber" | "slate";
};

export default function AutomationTable({
  slug,
  automations,
  showControls = true,
  pageSize = 12,
}: AutomationTableProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "active" | "name">("newest");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const appReviewMode = isAppReviewMode();
  const messagingReviewMode = isMessagingReviewMode();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = automations.filter((automation) => {
      if (!needle) return true;
      const keywords = (automation.keywords ?? []).map((keyword: any) => keyword.word).join(" ");
      const post = automation.posts?.[0];
      return `${automation.name ?? ""} ${keywords} ${post?.caption ?? ""} ${post?.postid ?? ""}`.toLowerCase().includes(needle);
    });

    return rows.sort((a, b) => {
      if (sort === "active") return Number(Boolean(b.active)) - Number(Boolean(a.active));
      if (sort === "name") return String(a.name ?? "").localeCompare(String(b.name ?? ""));
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [automations, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => setPage(1), [query, sort, automations.length]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function handleActivate(id: string, active: boolean) {
    startTransition(() => {
      void activateAutomation(id, active).then(() => router.refresh());
    });
  }

  function handleDuplicate(id: string) {
    startTransition(() => {
      void duplicateAutomation(id).then(() => router.refresh());
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this campaign? This keeps all activity history, but removes the campaign from your account.")) return;
    startTransition(() => {
      void deleteAutomation(id).then(() => router.refresh());
    });
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-white/[0.12] dark:bg-[#111827] dark:shadow-ap3k-card">
      {showControls && (
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-white/10 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns, keywords, captions, or media IDs…"
              className="ap3k-input h-11 rounded-2xl pr-4"
            />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as "newest" | "active" | "name")}
              className="ap3k-select h-11 rounded-2xl px-3 text-sm font-bold"
            >
              <option value="newest">Newest first</option>
              <option value="active">Active first</option>
              <option value="name">Name A–Z</option>
            </select>
            <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
              {filtered.length ? `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}` : "0 campaigns"}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-3 p-3 xl:hidden">
        {paged.length === 0 ? (
          <EmptyRows />
        ) : (
          paged.map((automation) => (
            <CampaignMobileCard
              key={automation.id}
              slug={slug}
              automation={automation}
              appReviewMode={appReviewMode}
              messagingReviewMode={messagingReviewMode}
              isPending={isPending}
              onActivate={handleActivate}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <div className="hidden xl:block">
        <div className="grid grid-cols-[minmax(220px,1.6fr)_minmax(78px,.55fr)_minmax(118px,.8fr)_minmax(86px,.55fr)_minmax(68px,.42fr)_minmax(68px,.42fr)_minmax(84px,.52fr)_minmax(132px,.75fr)] items-center gap-3 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
          <span>Campaign</span>
          <span>Post</span>
          <span>Trigger</span>
          <span>Replies</span>
          <span>Runs</span>
          <span>Leads</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/10">
          {paged.length === 0 ? (
            <div className="p-4"><EmptyRows /></div>
          ) : (
            paged.map((automation) => (
              <CampaignDesktopRow
                key={automation.id}
                slug={slug}
                automation={automation}
                appReviewMode={appReviewMode}
                messagingReviewMode={messagingReviewMode}
                isPending={isPending}
                onActivate={handleActivate}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {filtered.length > pageSize && (
        <PaginationFooter
          page={safePage}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function CampaignMobileCard({ slug, automation, appReviewMode, messagingReviewMode, isPending, onActivate, onDuplicate, onDelete }: any) {
  const post = automation.posts?.[0];
  const isAny = post?.postid === "ANY";
  const runs = automation.metrics?.runs ?? automation.listener?.commentCount ?? 0;
  const leads = automation.metrics?.leads ?? automation.leads?.length ?? automation._count?.leads ?? 0;
  const isAnyComment = automation.triggerMode === "ANY_COMMENT";
  const mode = getCampaignModeLabel(automation.sendPrivateDm === false, appReviewMode, messagingReviewMode);
  const status = campaignStatus(automation);
  const replySummary = getReplySummary(automation);

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-300/50 hover:shadow-lg dark:border-white/10 dark:bg-[#101827] dark:hover:bg-white/[0.045]">
      <div className="flex items-start gap-3">
        <CampaignThumb post={post} isAny={isAny} size="lg" />
        <div className="min-w-0 flex-1">
          <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="block truncate font-black text-slate-950 hover:text-pink-600 dark:text-white">
            {automation.name || "Untitled campaign"}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {isAny ? "Any post" : "Specific post"} · {isAnyComment ? "Any comment" : "Keyword trigger"} · {mode.full}
          </p>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {automation.currentAccountLabel && <span className="ap3k-badge ap3k-badge-slate">{automation.currentAccountLabel}</span>}
        <ReplyPill summary={replySummary} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <StatMini label="Runs" value={runs} />
        <StatMini label="Leads" value={leads} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/dashboard/${slug}/automation/new?edit=${automation.id}`} className="ap3k-table-action">{automation.needsReview || automation.stalePost ? "Review" : "Edit"}</Link>
        <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="ap3k-table-action">View</Link>
        <button type="button" disabled={isPending} onClick={() => onActivate(automation.id, !Boolean(automation.active))} className="ap3k-table-action">{automation.active ? "Pause" : "Start"}</button>
        <button type="button" disabled={isPending} onClick={() => onDuplicate(automation.id)} className="ap3k-table-action">Duplicate</button>
        <button type="button" disabled={isPending} onClick={() => onDelete(automation.id)} className="ap3k-table-action-danger">Delete</button>
      </div>
    </article>
  );
}

function CampaignDesktopRow({ slug, automation, appReviewMode, messagingReviewMode, isPending, onActivate, onDuplicate, onDelete }: any) {
  const post = automation.posts?.[0];
  const isAny = post?.postid === "ANY";
  const runs = automation.metrics?.runs ?? automation.listener?.commentCount ?? 0;
  const leads = automation.metrics?.leads ?? automation.leads?.length ?? automation._count?.leads ?? 0;
  const isAnyComment = automation.triggerMode === "ANY_COMMENT";
  const mode = getCampaignModeLabel(automation.sendPrivateDm === false, appReviewMode, messagingReviewMode);
  const status = campaignStatus(automation);
  const replySummary = getReplySummary(automation);

  return (
    <div className="grid grid-cols-[minmax(220px,1.6fr)_minmax(78px,.55fr)_minmax(118px,.8fr)_minmax(86px,.55fr)_minmax(68px,.42fr)_minmax(68px,.42fr)_minmax(84px,.52fr)_minmax(132px,.75fr)] items-center gap-3 px-4 py-3 text-sm text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.04]">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <CampaignThumb post={post} isAny={isAny} />
          <div className="min-w-0 flex-1">
            <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="block max-w-full truncate font-black text-slate-950 hover:text-pink-600 dark:text-white">
              {automation.name || "Untitled campaign"}
            </Link>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">{mode.full}</span>
              {automation.currentAccountLabel && (
                <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 dark:bg-white/[0.07] dark:text-slate-400 2xl:inline-flex">
                  {automation.currentAccountLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0"><span className="ap3k-badge ap3k-badge-slate">{isAny ? "Any" : post?.postid ? "Specific" : "Manual"}</span></div>
      <div className="min-w-0">
        {isAnyComment ? (
          <span className="ap3k-badge ap3k-badge-blue">Any</span>
        ) : (automation.keywords ?? []).length ? (
          <span className="ap3k-badge ap3k-badge-pink">{formatKeywordDisplay(String((automation.keywords ?? [])[0]?.word ?? ""), appReviewMode)}</span>
        ) : (
          <span className="ap3k-badge ap3k-badge-slate">No trigger</span>
        )}
      </div>
      <div className="min-w-0"><ReplyPill summary={replySummary} compact /></div>
      <div className="font-black text-slate-950 dark:text-white">{runs}</div>
      <div className="font-black text-slate-950 dark:text-white">{leads}</div>
      <div className="min-w-0"><StatusPill status={status} /></div>
      <div className="flex justify-end">
        <div className="inline-flex items-center justify-end rounded-xl border border-slate-200 bg-slate-50/80 p-0.5 dark:border-white/[0.10] dark:bg-white/[0.04]">
          <Link href={`/dashboard/${slug}/automation/new?edit=${automation.id}`} className="shrink-0 rounded-[9px] px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white">
            Edit
          </Link>
          <button type="button" disabled={isPending} onClick={() => onActivate(automation.id, !Boolean(automation.active))} className="shrink-0 rounded-[9px] px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-white hover:text-slate-950 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white">
            {automation.active ? "Pause" : "Start"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-slate-400 transition-colors hover:bg-white hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/[0.08] dark:hover:text-slate-300" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild><Link href={`/dashboard/${slug}/automation/${automation.id}`}>View detail</Link></DropdownMenuItem>
              <DropdownMenuItem disabled={isPending} onSelect={() => onDuplicate(automation.id)}>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={isPending} onSelect={() => onDelete(automation.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-500/10">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function PaginationFooter({ page, totalPages, total, pageSize, onPageChange }: { page: number; totalPages: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} campaigns
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="ap3k-table-action disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={[
              "h-8 min-w-8 rounded-xl px-2 text-xs font-black transition-all duration-200",
              item === page
                ? "bg-rf-pink text-white shadow-ap3k-glow"
                : "border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-rf-pink/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
            ].join(" ")}
          >
            {item}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="ap3k-table-action disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

function CampaignThumb({ post, isAny, size = "sm" }: { post: any; isAny: boolean; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  if (post?.media && !isAny) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.media} alt={post.caption ?? "Campaign post"} className={`${sizeClass} flex-shrink-0 rounded-xl object-cover`} />;
  }
  return (
    <div className={`${sizeClass} grid flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 text-xs font-black text-pink-600 dark:border dark:border-white/10 dark:bg-[#0b1020] dark:bg-none dark:text-pink-300`}>
      {isAny ? "∞" : "AP"}
    </div>
  );
}

function EmptyRows() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-400">
      No campaigns match your search.
    </div>
  );
}

function campaignStatus(automation: any) {
  if (automation.archivedAt) return "Archived";
  if (automation.needsReview) return "Needs review";
  if (!automation.listener || !automation.posts?.length) return "Draft";
  return automation.active ? "Live" : "Paused";
}

function StatusPill({ status }: { status: string }) {
  const classes = status === "Live"
    ? "ap3k-badge-green"
    : status === "Needs review"
      ? "ap3k-badge-red"
      : status === "Draft"
        ? "ap3k-badge-blue"
        : "ap3k-badge-amber";
  return <span className={`ap3k-badge whitespace-nowrap ${classes}`}>{status}</span>;
}

function getReplySummary(automation: any): ReplySummary {
  const hasPublicReply = Boolean(automation.listener?.commentReply || automation.listener?.commentReply2 || automation.listener?.commentReply3);
  const hasPrivateReply = automation.sendPrivateDm !== false && Boolean(automation.listener?.prompt);
  const activeTone = automation.active && !automation.needsReview ? "green" : "amber";

  if (hasPublicReply && hasPrivateReply) return { label: "Public + Private", compactLabel: "Both", tone: activeTone };
  if (hasPublicReply) return { label: "Public only", compactLabel: "Public", tone: activeTone };
  if (hasPrivateReply) return { label: "Private only", compactLabel: "Private", tone: activeTone };
  return { label: "Not set", compactLabel: "Off", tone: "slate" };
}

function ReplyPill({ summary, compact = false }: { summary: ReplySummary; compact?: boolean }) {
  const toneClass = summary.tone === "green"
    ? "ap3k-badge-green"
    : summary.tone === "amber"
      ? "ap3k-badge-amber"
      : "ap3k-badge-slate";
  return <span title={summary.label} className={`ap3k-badge whitespace-nowrap ${toneClass}`}>{compact ? summary.compactLabel : summary.label}</span>;
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/[0.12] dark:bg-white/[0.06]">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
