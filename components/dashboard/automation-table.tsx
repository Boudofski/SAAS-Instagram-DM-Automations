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
import { getCampaignModeLabel } from "@/lib/campaign-mode-label";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { formatKeywordDisplay } from "@/lib/keyword-display";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState, useTransition } from "react";

type AutomationTableProps = {
  slug: string;
  automations: any[];
  showControls?: boolean;
};

export default function AutomationTable({
  slug,
  automations,
  showControls = true,
}: AutomationTableProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "active" | "name">("newest");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const appReviewMode = isAppReviewMode();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = automations.filter((automation) => {
      if (!needle) return true;
      const keywords = (automation.keywords ?? [])
        .map((keyword: any) => keyword.word)
        .join(" ");
      return `${automation.name ?? ""} ${keywords}`.toLowerCase().includes(needle);
    });

    return rows.sort((a, b) => {
      if (sort === "active") return Number(Boolean(b.active)) - Number(Boolean(a.active));
      if (sort === "name") return String(a.name ?? "").localeCompare(String(b.name ?? ""));
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [automations, query, sort]);

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
    if (!window.confirm("Delete this campaign? This keeps tenant checks in place but removes the campaign for your account.")) return;
    startTransition(() => {
      void deleteAutomation(id).then(() => router.refresh());
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:border-white/[0.12] dark:bg-[#111827]">
      {showControls && (
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-white/10 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns or keywords…"
              className="ap3k-input h-10 rounded-xl pr-4"
            />
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as "newest" | "active" | "name")}
            className="ap3k-select h-10 rounded-xl px-3 text-sm font-bold"
          >
            <option value="newest">Newest first</option>
            <option value="active">Active first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      )}

      {/* Mobile card layout */}
      <div className="grid gap-3 p-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/[0.12] dark:text-slate-400">
            No campaigns match your search.
          </div>
        ) : (
          filtered.map((automation) => {
            const post = automation.posts?.[0];
            const isAny = post?.postid === "ANY";
            const runs = automation.metrics?.runs ?? automation.listener?.commentCount ?? 0;
            const leads = automation.metrics?.leads ?? automation.leads?.length ?? automation._count?.leads ?? 0;
            const isAnyComment = automation.triggerMode === "ANY_COMMENT";
            const mode = getCampaignModeLabel(automation.sendPrivateDm === false, appReviewMode);
            const status = campaignStatus(automation);
            return (
              <article key={automation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#101827]">
                <div className="flex items-start gap-3">
                  {post?.media && !isAny ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.media} alt={post.caption ?? automation.name ?? "Campaign"} className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 text-xs font-black text-pink-600 dark:border dark:border-white/10 dark:bg-[#0b1020] dark:bg-none dark:text-pink-300">
                      AP
                    </div>
                  )}
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
                <CampaignBadges automation={automation} appReviewMode={appReviewMode} />
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <StatMini label="Runs" value={runs} />
                  <StatMini label="Leads" value={leads} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/dashboard/${slug}/automation/new?edit=${automation.id}`} className="ap3k-table-action">
                    {automation.needsReview || automation.stalePost ? "Review" : "Edit"}
                  </Link>
                  <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="ap3k-table-action">View</Link>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleActivate(automation.id, !Boolean(automation.active))}
                    className="ap3k-table-action"
                  >
                    {automation.active ? "Pause" : "Activate"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDuplicate(automation.id)}
                    className="ap3k-table-action"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(automation.id)}
                    className="ap3k-table-action-danger"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block xl:overflow-x-visible">
        <table className="w-full table-fixed text-left">
          <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
            <tr>
              <th className="w-[30%] px-3 py-3">Campaign</th>
              <th className="w-[8%] px-2 py-3">Post</th>
              <th className="w-[18%] px-2 py-3">Trigger</th>
              <th className="w-[8%] px-2 py-3">{appReviewMode ? "Reply" : "Mode"}</th>
              <th className="w-[6%] px-2 py-3">Runs</th>
              <th className="w-[6%] px-2 py-3">Leads</th>
              <th className="w-[10%] px-2 py-3">Status</th>
              <th className="w-[14%] px-2 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No campaigns match your search.
                </td>
              </tr>
            ) : (
              filtered.map((automation) => {
                const post = automation.posts?.[0];
                const isAny = post?.postid === "ANY";
                const runs = automation.metrics?.runs ?? automation.listener?.commentCount ?? 0;
                const leads = automation.metrics?.leads ?? automation.leads?.length ?? automation._count?.leads ?? 0;
                const isAnyComment = automation.triggerMode === "ANY_COMMENT";
                const mode = getCampaignModeLabel(automation.sendPrivateDm === false, appReviewMode);
                const status = campaignStatus(automation);

                return (
                  <tr key={automation.id} className="text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.04]">
                    <td className="px-3 py-4">
                      <div className="flex min-w-0 items-center gap-2">
                        {post?.media && !isAny ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.media} alt={post.caption ?? automation.name ?? "Campaign"} className="h-9 w-9 flex-shrink-0 rounded-xl object-cover" />
                        ) : (
                          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 text-xs font-black text-pink-600 dark:border dark:border-white/10 dark:bg-[#0b1020] dark:bg-none dark:text-pink-300">
                            AP
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="block truncate font-black text-slate-950 hover:text-pink-600 dark:text-white">
                            {automation.name || "Untitled campaign"}
                          </Link>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{mode.full}</p>
                          <CampaignBadges automation={automation} compact appReviewMode={appReviewMode} />
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span className="ap3k-badge ap3k-badge-slate">
                        {isAny ? "Any" : post?.postid ? "Specific" : "Manual"}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex max-w-[160px] flex-wrap gap-1">
                        {isAnyComment ? (
                          <span className="ap3k-badge ap3k-badge-blue">Any comment</span>
                        ) : (automation.keywords ?? []).slice(0, 2).map((keyword: any) => (
                          <span key={keyword.id ?? keyword.word} className="ap3k-badge ap3k-badge-pink">
                            {formatKeywordDisplay(String(keyword.word ?? ""), appReviewMode)}
                          </span>
                        ))}
                        {!isAnyComment && (automation.keywords ?? []).length > 2 && (
                          <span className="ap3k-badge ap3k-badge-slate">+{(automation.keywords ?? []).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span title={mode.full} className="ap3k-badge ap3k-badge-slate">{mode.short}</span>
                    </td>
                    <td className="px-2 py-3.5 font-black text-slate-950 dark:text-white">{runs}</td>
                    <td className="px-2 py-3.5 font-black text-slate-950 dark:text-white">{leads}</td>
                    <td className="px-2 py-4">
                      <StatusPill status={status} />
                    </td>
                    <td className="px-2 py-4">
                      <div className="inline-flex items-center justify-end rounded-xl border border-slate-200 bg-slate-50/80 p-0.5 dark:border-white/[0.10] dark:bg-white/[0.04]">
                        <Link
                          href={`/dashboard/${slug}/automation/new?edit=${automation.id}`}
                          className="rounded-[9px] px-2 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                        >
                          {automation.needsReview || automation.stalePost ? "Review" : "Edit"}
                        </Link>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleActivate(automation.id, !Boolean(automation.active))}
                          className="rounded-[9px] px-2 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-white hover:text-slate-950 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                        >
                          {automation.active ? "Pause" : "Activate"}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] text-slate-400 transition-colors hover:bg-white hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/[0.08] dark:hover:text-slate-300"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/${slug}/automation/${automation.id}`}>
                                View detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={isPending}
                              onSelect={() => handleDuplicate(automation.id)}
                            >
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={isPending}
                              onSelect={() => handleDelete(automation.id)}
                              className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-500/10"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
  const classes =
    status === "Live"
      ? "ap3k-badge-green"
      : status === "Needs review"
        ? "ap3k-badge-red"
        : status === "Draft"
          ? "ap3k-badge-blue"
          : "ap3k-badge-amber";
  return <span className={`ap3k-badge ${classes}`}>{status}</span>;
}

function CampaignBadges({ automation, compact, appReviewMode = isAppReviewMode() }: { automation: any; compact?: boolean; appReviewMode?: boolean }) {
  const hasPublicReply = Boolean(
    automation.listener?.commentReply ||
    automation.listener?.commentReply2 ||
    automation.listener?.commentReply3
  );
  const badges = [
    automation.currentAccountLabel ? { label: automation.currentAccountLabel, tone: "slate" } : null,
    automation.stalePost ? { label: "Stale post", tone: "red" } : null,
    automation.needsReview ? { label: "Needs review", tone: "red" } : null,
    appReviewMode
      ? {
          label: automation.active && !automation.needsReview
            ? "Public reply active"
            : hasPublicReply
              ? "Public reply configured"
              : "Public reply paused",
          tone: automation.active && !automation.needsReview ? "green" : "amber",
        }
      : automation.sendPrivateDm === false ? { label: "External DM", tone: "amber" } : { label: "AP3k DM", tone: "green" },
    !appReviewMode ? { label: hasPublicReply ? "Public reply on" : "Public reply off", tone: hasPublicReply ? "blue" : "slate" } : null,
  ].filter(Boolean) as { label: string; tone: string }[];

  const toneMap: Record<string, string> = {
    red: "ap3k-badge-red",
    amber: "ap3k-badge-amber",
    green: "ap3k-badge-green",
    blue: "ap3k-badge-blue",
    slate: "ap3k-badge-slate",
  };

  return (
    <div className={compact ? "mt-1 flex flex-wrap gap-1" : "mt-3 flex flex-wrap gap-1.5"}>
      {badges.map((badge) => (
        <span key={badge.label} className={`ap3k-badge ${toneMap[badge.tone] ?? "ap3k-badge-slate"}`}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/[0.12] dark:bg-white/[0.06]">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
