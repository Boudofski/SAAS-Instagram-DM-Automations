"use client";

import { activateAutomation, deleteAutomation, duplicateAutomation } from "@/actions/automation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {showControls && (
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search automations or keywords"
              className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as "newest" | "active" | "name")}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="active">Active first</option>
              <option value="name">Name A-Z</option>
            </select>
            <Button type="button" variant="outline" disabled className="h-11 rounded-xl border-slate-200">
              Export soon
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Post/Reel</th>
              <th className="px-4 py-3">Keywords</th>
              <th className="px-4 py-3">Runs</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Button clicks</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                  No automations match your search.
                </td>
              </tr>
            ) : (
              filtered.map((automation) => {
                const post = automation.posts?.[0];
                const isAny = post?.postid === "ANY";
                const runs = automation.listener?.commentCount ?? 0;
                const leads = automation.leads?.length ?? automation._count?.leads ?? 0;

                return (
                  <tr key={automation.id} className="text-sm text-slate-700">
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
                          <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="block truncate font-black text-slate-950 hover:text-pink-600">
                            {automation.name || "Untitled automation"}
                          </Link>
                          <p className="text-xs text-slate-500">{automation.listener?.listener === "SMARTAI" ? "Smart AI" : "Standard DM"}</p>
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
                        {(automation.keywords ?? []).slice(0, 3).map((keyword: any) => (
                          <span key={keyword.id ?? keyword.word} className="rounded-full border border-pink-100 bg-pink-50 px-2 py-0.5 text-xs font-bold text-pink-700">
                            {keyword.word}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-black text-slate-950">{runs}</td>
                    <td className="px-4 py-4 font-black text-slate-950">{leads}</td>
                    <td className="px-4 py-4 text-slate-400">Soon</td>
                    <td className="px-4 py-4">
                      <span className={[
                        "rounded-full px-2.5 py-1 text-xs font-black",
                        automation.active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                      ].join(" ")}>
                        {automation.active ? "Live" : "Paused"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/${slug}/automation/new?edit=${automation.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                          Edit
                        </Link>
                        <Link href={`/dashboard/${slug}/automation/${automation.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
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
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Duplicate
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => {
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
