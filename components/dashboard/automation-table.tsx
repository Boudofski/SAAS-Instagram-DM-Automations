"use client";

import { activateAutomation, deleteAutomation, duplicateAutomation } from "@/actions/automation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      {showControls && (
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-white/10 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search automations or keywords"
              className="ap3k-input h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as "newest" | "active" | "name")}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none dark:border-white/10 dark:bg-[#101827] dark:text-slate-200"
            >
              <option value="newest">Newest first</option>
              <option value="active">Active first</option>
              <option value="name">Name A-Z</option>
            </select>
            <Button type="button" variant="outline" disabled className="h-11 rounded-xl border-slate-200 dark:border-white/10">
              Export coming soon
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 p-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            No automations match your search.
          </div>
        ) : (
          filtered.map((automation) => {
            const post = automation.posts?.[0];
            const isAny = post?.postid === "ANY";
            const runs = automation.listener?.commentCount ?? 0;
            const leads = automation.leads?.length ?? automation._count?.leads ?? 0;
            const isAnyComment = automation.triggerMode === "ANY_COMMENT";
            return (
              <article key={automation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#101827]">
                <div className="flex items-start gap-3">
                  {post?.media && !isAny ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.media} alt={post.caption ?? automation.name ?? "Campaign"} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 text-xs font-black text-pink-600">
                      AP
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="block truncate font-black text-slate-950 hover:text-pink-600 dark:text-white">
                      {automation.name || "Untitled automation"}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {isAny ? "Any post" : "Specific post"} · {isAnyComment ? "Any comment" : "Keyword"} · {automation.sendPrivateDm === false ? "External DM" : "AP3k DM"}
                    </p>
                  </div>
                  <span className={[
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-black",
                    automation.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                  ].join(" ")}>
                    {automation.active ? "Live" : "Paused"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Runs</p>
                    <p className="font-black text-slate-950 dark:text-white">{runs}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Leads</p>
                    <p className="font-black text-slate-950 dark:text-white">{leads}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionLink href={`/dashboard/${slug}/automation/new?edit=${automation.id}`}>Edit</ActionLink>
                  <ActionLink href={`/dashboard/${slug}/automation/${automation.id}`}>View</ActionLink>
                  <ActionButton disabled={isPending} onClick={() => startTransition(() => { void activateAutomation(automation.id, !Boolean(automation.active)).then(() => router.refresh()); })}>
                    {automation.active ? "Pause" : "Activate"}
                  </ActionButton>
                  <ActionButton disabled={isPending} onClick={() => startTransition(() => { void duplicateAutomation(automation.id).then(() => router.refresh()); })}>
                    Duplicate
                  </ActionButton>
                  <ActionButton
                    danger
                    disabled={isPending}
                    onClick={() => {
                      if (!window.confirm("Delete this campaign? This keeps tenant checks in place but removes the campaign for your account.")) return;
                      startTransition(() => {
                        void deleteAutomation(automation.id).then(() => router.refresh());
                      });
                    }}
                  >
                    Delete
                  </ActionButton>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Post/Reel</th>
              <th className="px-4 py-3">Trigger</th>
              <th className="px-4 py-3">Runs</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  No automations match your search.
                </td>
              </tr>
            ) : (
              filtered.map((automation) => {
                const post = automation.posts?.[0];
                const isAny = post?.postid === "ANY";
                const runs = automation.listener?.commentCount ?? 0;
                const leads = automation.leads?.length ?? automation._count?.leads ?? 0;
                const isAnyComment = automation.triggerMode === "ANY_COMMENT";

                return (
                  <tr key={automation.id} className="text-sm text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {post?.media && !isAny ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.media} alt={post.caption ?? automation.name ?? "Campaign"} className="h-11 w-11 rounded-xl object-cover" />
                        ) : (
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 text-xs font-black text-pink-600">
                            AP
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="block truncate font-black text-slate-950 hover:text-pink-600 dark:text-white">
                            {automation.name || "Untitled automation"}
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {automation.sendPrivateDm === false ? "DM handled externally" : "Private DM"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {isAny ? "Any post" : post?.postid ? "Specific post" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-[220px] flex-wrap gap-1.5">
                        {isAnyComment ? (
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                            Any comment
                          </span>
                        ) : (automation.keywords ?? []).slice(0, 3).map((keyword: any) => (
                          <span key={keyword.id ?? keyword.word} className="rounded-full border border-pink-100 bg-pink-50 px-2 py-0.5 text-xs font-bold text-pink-700">
                            {keyword.word}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-black text-slate-950 dark:text-white">{runs}</td>
                    <td className="px-4 py-4 font-black text-slate-950 dark:text-white">{leads}</td>
                    <td className="px-4 py-4">
                      <span className={[
                        "rounded-full px-2.5 py-1 text-xs font-black",
                        automation.active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                      ].join(" ")}>
                        {automation.active ? "Live" : "Paused"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/dashboard/${slug}/automation/new?edit=${automation.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]">
                          Edit
                        </Link>
                        <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]">
                          View
                        </Link>
                        <button
                          disabled={isPending}
                          onClick={() => {
                            startTransition(() => {
                              void activateAutomation(automation.id, !Boolean(automation.active))
                                .then(() => router.refresh());
                            });
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]"
                        >
                          {automation.active ? "Pause" : "Activate"}
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => {
                            startTransition(() => {
                              void duplicateAutomation(automation.id).then(() => router.refresh());
                            });
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]"
                        >
                          Duplicate
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => {
                            if (!window.confirm("Delete this campaign? This keeps tenant checks in place but removes the campaign for your account.")) return;
                            startTransition(() => {
                              void deleteAutomation(automation.id).then(() => router.refresh());
                            });
                          }}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
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

function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
      {children}
    </Link>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  danger,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-lg border bg-white px-3 py-2 text-xs font-bold disabled:opacity-50 dark:bg-white/[0.04]",
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300"
          : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
