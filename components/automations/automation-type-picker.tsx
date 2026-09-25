"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  GitBranch,
  Zap,
  MessageCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TEMPLATES, type Template } from "@/lib/automation-flow/templates";
import { UiText } from "@/components/i18n/localized-copy";

export default function AutomationTypePicker({ slug }: { slug: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const matches = TEMPLATES.filter(
    (t) =>
      (!search ||
        `${t.name} ${t.description}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (filter === "all" || t.goal === filter || t.trigger === filter),
  );
  const href = (t: Template) =>
    `/dashboard/${slug}/automation/new?type=${t.type}&template=${t.id}`;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.push(`/dashboard/${slug}/automation`);
      }}
    >
      <DialogContent ref={dialogRef} tabIndex={-1} onOpenAutoFocus={(event) => { event.preventDefault(); dialogRef.current?.focus(); }} className="flex h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-h-[calc(100dvh-1rem)] max-w-6xl sm:h-[min(850px,92dvh)] sm:w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-950 dark:border-white/10 dark:bg-[#10131e] dark:text-slate-100">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 p-4 pe-14 sm:p-5 sm:pe-14 dark:border-white/10">
          <div className="min-w-0 me-auto">
            <DialogTitle className="break-words text-xl font-bold tracking-tight sm:text-2xl">
              <UiText>Automation templates</UiText>
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <UiText>
                Start with a proven conversation. Make it your own.
              </UiText>
            </DialogDescription>
          </div>
        </header>
        <label className="relative m-4 block shrink-0 sm:m-5">
          <Search className="absolute start-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Instagram templates…"
            aria-label="Search Instagram templates"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 ps-12 pe-4 text-base sm:text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
          <nav
            aria-label="Template filters"
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 px-5 pb-4 md:w-52 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r dark:border-white/10"
          >
            <Filter
              value="all"
              label="All templates"
              filter={filter}
              set={setFilter}
            />
            <p className="hidden pb-2 pt-6 text-xs font-semibold uppercase tracking-widest text-slate-400 md:block">
              By goal
            </p>
            {[
              ["followers", "Grow your followers"],
              ["engagement", "Engage your audience"],
              ["traffic", "Drive traffic"],
            ].map(([v, l]) => (
              <Filter
                key={v}
                value={v}
                label={l}
                filter={filter}
                set={setFilter}
              />
            ))}
            <p className="hidden pb-2 pt-6 text-xs font-semibold uppercase tracking-widest text-slate-400 md:block">
              By trigger
            </p>
            {[
              ["comment", "Post or Reel comment"],
              ["dm", "DM"],
              ["story", "Story reply"],
              ["live", "Live comment"],
            ].map(([v, l]) => (
              <Filter
                key={v}
                value={v}
                label={l}
                filter={filter}
                set={setFilter}
              />
            ))}
          </nav>
          <div className="min-h-0 min-w-0 flex-1 overscroll-contain overflow-y-auto px-4 py-4 sm:px-5 md:pt-0">
            <h2 className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {search || filter !== "all"
                ? `${matches.length} templates`
                : "Recommended for you"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={Boolean(t.unavailable)}
                  title={t.unavailable}
                  onClick={() => router.push(href(t))}
                  className="group flex min-w-0 min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-start transition enabled:hover:border-violet-400 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-white/10 dark:bg-white/[0.025] dark:enabled:hover:border-violet-400"
                >
                  <div className="mb-5 flex w-full items-center justify-between">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${i % 3 === 0 ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300" : i % 3 === 1 ? "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300" : "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"}`}
                    >
                      {t.type === "ai" ? (
                        <Sparkles size={20} />
                      ) : t.type === "flow" ? (
                        <GitBranch size={20} />
                      ) : (
                        <MessageCircle size={20} />
                      )}
                    </span>
                    {t.popular && <Badge>Popular</Badge>}
                  </div>
                  <h3 className="text-lg font-bold leading-6 tracking-tight">
                    <UiText>{t.name}</UiText>
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    <UiText>{t.description}</UiText>
                  </p>
                  <div className="mt-5 flex w-full flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {t.type === "flow" || t.type === "ai" ? (
                      <GitBranch size={13} />
                    ) : (
                      <Zap size={13} />
                    )}
                    <span>
                      {t.type === "flow" || t.type === "ai"
                        ? "Flow Builder"
                        : "Quick Automation"}
                    </span>
                    {t.unavailable ? (
                      <span className="ml-auto">Unavailable</span>
                    ) : t.pro ? (
                      <span className="ml-auto inline-flex items-center gap-1 font-semibold text-violet-600 dark:text-violet-300">
                        <Lock size={11} />
                        Pro
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
            {!matches.length && (
              <p className="py-20 text-center text-slate-500">
                No templates match. Try another keyword or filter.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
      {children}
    </span>
  );
}
function Filter({
  value,
  label,
  filter,
  set,
}: {
  value: string;
  label: string;
  filter: string;
  set: (v: string) => void;
}) {
  return (
    <button
      aria-pressed={value === filter}
      onClick={() => set(value)}
      className={`min-h-11 shrink-0 rounded-lg px-3 py-2.5 text-start text-sm ${value === filter ? "bg-violet-100 font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"}`}
    >
      <UiText>{label}</UiText>
    </button>
  );
}
