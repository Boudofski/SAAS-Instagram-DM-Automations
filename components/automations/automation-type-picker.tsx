"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  GitBranch,
  Zap,
  Plus,
  MessageCircle,
  Sparkles,
  Lock,
  PlayCircle,
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Template | null>(null);
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
      <DialogContent className="flex h-[min(850px,92dvh)] max-w-6xl flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-950 dark:border-white/10 dark:bg-[#10131e] dark:text-slate-100">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-5 pr-14 dark:border-white/10">
          <div className="mr-auto">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              <UiText>
                {selected ? selected.name : "Automation templates"}
              </UiText>
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <UiText>
                {selected
                  ? "See how it works, then make it yours."
                  : "Start with a proven conversation. Make it your own."}
              </UiText>
            </DialogDescription>
          </div>
          {!selected && (
            <Link
              href={`/dashboard/${slug}/automation/new?type=flow`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-white/20"
            >
              <Plus size={16} />
              <UiText>Start from scratch</UiText>
            </Link>
          )}
        </header>
        {selected ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <button
              onClick={() => setSelected(null)}
              className="m-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-300"
            >
              <ArrowLeft size={16} />
              <UiText>Back to templates</UiText>
            </button>
            <div className="grid gap-8 px-5 pb-8 md:grid-cols-2 md:px-8">
              <section>
                <div className="mb-5 flex gap-2">
                  <Badge>
                    {selected.type === "flow" || selected.type === "ai"
                      ? "Flow Builder"
                      : "Quick Automation"}
                  </Badge>
                  {selected.pro && <Badge>Pro / Business</Badge>}
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  <UiText>{selected.name}</UiText>
                </h2>
                <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                  <UiText>{selected.description}</UiText>
                </p>
                <ol className="my-7 space-y-4">
                  {selected.steps.map((s, i) => (
                    <li key={s} className="flex items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-sm">
                        <UiText>{s}</UiText>
                      </span>
                    </li>
                  ))}
                </ol>
                {selected.id === "giveaway" && (
                  <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-500/10 dark:text-amber-200">
                    The default split selects 5% of entries independently. It
                    can select zero or several people; it does not guarantee one
                    winner. Set your rules and prize details before publishing.
                  </p>
                )}
                {selected.id === "email" && (
                  <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                    An email is saved as a lead. This does not subscribe someone
                    to marketing emails. They can reply SKIP or STOP.
                  </p>
                )}
                {selected.unavailable ? (
                  <p
                    role="status"
                    className="rounded-xl bg-slate-100 p-4 text-sm dark:bg-white/5"
                  >
                    {selected.unavailable}
                  </p>
                ) : (
                  <Link
                    href={href(selected)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
                  >
                    <UiText>Set up template</UiText>
                    <ArrowRight size={18} />
                  </Link>
                )}
                {selected.pro && !selected.unavailable && (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {selected.type === "flow"
                      ? "Build and preview free. Pro or Business is required to publish."
                      : "AI requires Pro or Business and an enabled AI workspace."}
                  </p>
                )}
              </section>
              <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-orange-50 p-5 dark:border-white/10 dark:from-violet-950/40 dark:to-slate-900">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <PlayCircle size={18} />
                  <UiText>How it works</UiText>
                </div>
                <video
                  key={selected.id}
                  controls
                  playsInline
                  preload="none"
                  poster="/automation-guides/flow-preview.jpg"
                  className="aspect-[4/3] w-full rounded-2xl bg-[#111425]"
                  aria-label={`${selected.name} walkthrough`}
                >
                  <source
                    src={`/automation-guides/${guide(selected)}.mp4`}
                    type="video/mp4"
                  />
                  <track
                    kind="captions"
                    src={`/automation-guides/${guide(selected)}.vtt`}
                    srcLang="en"
                    label="English"
                    default
                  />
                </video>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Illustrated walkthrough with sample messages. In the builder,
                  test your own text and branches in the interactive preview
                  before publishing.
                </p>
              </section>
            </div>
          </div>
        ) : (
          <>
            <label className="relative m-5 block">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Instagram templates…"
                aria-label="Search Instagram templates"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/5"
              />
            </label>
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
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
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
                <h2 className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {search || filter !== "all"
                    ? `${matches.length} templates`
                    : "Recommended for you"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-violet-400 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-violet-400"
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
                          <span className="ml-auto">Not connected</span>
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
          </>
        )}
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
      className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-sm ${value === filter ? "bg-violet-100 font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"}`}
    >
      <UiText>{label}</UiText>
    </button>
  );
}

function guide(t: Template) {
  return t.id === "giveaway"
    ? "giveaway"
    : t.id === "email" || t.id === "rsvp"
      ? "email"
      : t.type === "flow"
        ? "canvas"
        : t.type === "ai"
          ? "ai"
          : t.trigger === "story"
            ? "story"
            : t.trigger === "dm"
              ? "dm"
              : "comment";
}
