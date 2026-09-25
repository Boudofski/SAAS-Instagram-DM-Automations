"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  GitBranch,
  Loader2,
  Save,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  saveAutomationFlow,
  type SaveFlowInput,
} from "@/actions/automation/flow";
import { templateById, templateFlow } from "@/lib/automation-flow/templates";
import {
  readFlow,
  validateFlow,
  type Flow,
} from "@/lib/automation-flow/definition";
import FlowCanvas from "./flow-canvas";
import FlowPreview from "./flow-preview";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  slug: string;
  integrationId: string;
  templateId?: string;
  automation?: any;
  posts?: any[];
  postsLoading?: boolean;
  postsError?: string;
  refreshPosts: () => void;
  plan?: string;
};
export default function FlowBuilder({
  slug,
  integrationId,
  templateId,
  automation,
  posts = [],
  postsLoading,
  postsError,
  refreshPosts,
  plan = "FREE",
}: Props) {
  const template = templateById(templateId);
  const queryClient = useQueryClient();
  const [step, setStep] = useState(automation ? 2 : 1);
  const stepContent = useRef<HTMLElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step) {
      stepContent.current?.scrollIntoView({ block: "start", behavior: "auto" });
      previousStep.current = step;
    }
  }, [step]);
  const [preview, setPreview] = useState(false);
  const [flow, setFlow] = useState<Flow>(
    () =>
      readFlow(automation?.listener?.flowDefinition) ??
      templateFlow(templateId),
  );
  const [draft, setDraft] = useState<Omit<SaveFlowInput, "flow">>(() => ({
    id: automation?.id,
    revision: automation?.listener?.flowRevision ?? 0,
    integrationId,
    name: automation?.name ?? template?.name ?? "Untitled flow",
    active: false,
    source:
      automation?.source ??
      (template?.trigger === "comment"
        ? "COMMENT"
        : template?.trigger === "story"
          ? "STORY"
          : "DM"),
    storyTrigger: automation?.storyTriggerType ?? "REPLY",
    keyword: automation?.keywords?.[0]?.word ?? template?.keyword ?? "",
    anyMessage: automation
      ? automation.triggerMode !== "SPECIFIC_KEYWORD"
      : false,
    post: automation?.posts?.[0]
      ? {
          postid: automation.posts[0].postid,
          media: automation.posts[0].media,
          mediaType: automation.posts[0].mediaType,
          caption: automation.posts[0].caption ?? "",
        }
      : null,
    opening:
      automation?.listener?.openingDmText ??
      "Thanks for your interest! Tap below to continue.",
    openingButton: automation?.listener?.openingDmButtonText ?? "Continue",
    publicReply: automation?.listener?.commentReply ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [live, setLive] = useState(Boolean(automation?.active));
  const patch = (p: Partial<typeof draft>) => {
    setDraft((v) => ({ ...v, ...p }));
    setDirty(true);
    setNotice("");
  };
  const changeFlow = (f: Flow) => {
    setFlow(f);
    setDirty(true);
    setNotice("");
  };
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const validation = validateFlow(flow);
  const triggerReady = Boolean(
    draft.name.trim() &&
    (draft.source === "STORY" || draft.anyMessage || draft.keyword.trim()) &&
    (draft.source !== "COMMENT" || draft.post),
  );
  async function save(active: boolean) {
    setError("");
    setNotice("");
    if (!triggerReady) {
      setError("Complete the trigger settings before saving.");
      setStep(1);
      return;
    }
    if (!validation.flow) {
      setError(validation.errors.join(" "));
      return;
    }
    setBusy(true);
    try {
      const result = await saveAutomationFlow({
        ...draft,
        integrationId,
        active,
        flow,
      });
      if (result.status !== 200 || !result.id) {
        setError(result.error ?? "Could not save this flow.");
        return;
      }
      setDraft((v) => ({
        ...v,
        id: result.id,
        revision: result.revision ?? v.revision,
      }));
      setDirty(false);
      setLive(active);
      setNotice(
        active
          ? "Your flow is live. Test it with a real Instagram conversation."
          : "Draft saved. This flow is not sending messages.",
      );
      await queryClient.invalidateQueries({ queryKey: ["user-automation"] });
    } catch {
      setError(
        "Could not save. Your changes are still here. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0 max-w-full min-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fc] text-slate-950 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#141824]">
        <Link
          onClick={(e) => {
            if (dirty && !window.confirm("Leave without saving these changes?"))
              e.preventDefault();
          }}
          href={`/dashboard/${slug}/automation`}
          aria-label="Back to automations"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
            Flow Builder
          </p>
          <h1 className="mt-1 break-words font-bold">
            {draft.name || "Untitled flow"}{" "}
            <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-[10px] uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
              {dirty ? "Unsaved" : live ? "Live" : "Draft"}
            </span>
          </h1>
        </div>
        <button
          onClick={() => setPreview(true)}
          className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-white/15"
        >
          <Eye size={16} />
          Preview
        </button>
        <button
          disabled={busy || !integrationId}
          onClick={() => void save(false)}
          className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-white/15"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save draft
        </button>
      </header>
      <nav
        aria-label="Flow setup steps"
        className="grid grid-cols-3 gap-1 border-b border-slate-200 p-2 sm:gap-2 sm:p-4 dark:border-white/10"
      >
        {["Choose trigger", "Build conversation", "Review & publish"].map(
          (label, i) => (
            <button
              key={label}
              onClick={() => setStep(i + 1)}
              aria-current={step === i + 1 ? "step" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl px-1 py-2.5 text-center text-xs sm:flex-row sm:px-4 sm:text-sm font-semibold ${step === i + 1 ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"}`}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full border border-current text-xs">
                {i + 1}
              </span>
              {label}
            </button>
          ),
        )}
      </nav>
      {error && (
        <p
          role="alert"
          className="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="m-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {notice}
        </p>
      )}
      {!integrationId && (
        <p className="m-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          No Instagram account is available. Connect or select an account before
          saving this flow.
        </p>
      )}
      <main ref={stepContent} className="min-w-0 scroll-mt-4 p-3 sm:p-6">
        {step === 1 ? (
          <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  When should this flow start?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Choose the starting interaction. The conversation steps come
                  next.
                </p>
              </div>
              <label className="block text-sm font-semibold">
                Automation name
                <input
                  value={draft.name}
                  maxLength={120}
                  onChange={(e) => patch({ name: e.target.value })}
                  className="ap3k-input mt-2 w-full rounded-xl p-3"
                />
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(["COMMENT", "DM", "STORY"] as const).map((source) => (
                  <button
                    aria-pressed={draft.source === source}
                    key={source}
                    onClick={() => patch({ source, anyMessage: false })}
                    className={`rounded-xl border p-3 text-sm font-semibold ${draft.source === source ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "border-slate-200 dark:border-white/15"}`}
                  >
                    {source === "COMMENT"
                      ? "Post comment"
                      : source === "STORY"
                        ? "Story reply"
                        : "Instagram DM"}
                  </button>
                ))}
              </div>
              {draft.source === "STORY" ? (
                <label className="block text-sm font-semibold">
                  Story interaction
                  <select
                    value={draft.storyTrigger}
                    onChange={(e) =>
                      patch({
                        storyTrigger: e.target
                          .value as SaveFlowInput["storyTrigger"],
                      })
                    }
                    className="ap3k-input mt-2 w-full rounded-xl p-3"
                  >
                    <option value="REPLY">Text reply</option>
                    <option value="REACTION">Emoji reaction</option>
                    <option value="MENTION">Mention</option>
                  </select>
                </label>
              ) : (
                <>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.anyMessage}
                      onChange={(e) => patch({ anyMessage: e.target.checked })}
                    />
                    Any {draft.source === "COMMENT" ? "comment" : "incoming DM"}
                  </label>
                  {!draft.anyMessage && (
                    <label className="block text-sm font-semibold">
                      Contains keyword
                      <input
                        value={draft.keyword}
                        maxLength={100}
                        placeholder="EBOOK, JOIN, WIN…"
                        onChange={(e) => patch({ keyword: e.target.value })}
                        className="ap3k-input mt-2 w-full rounded-xl p-3"
                      />
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        Enter one phrase. Matching is case insensitive.
                      </span>
                    </label>
                  )}
                </>
              )}
              {draft.source === "COMMENT" && (
                <>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        Choose a post or Reel
                      </h3>
                      <button
                        onClick={refreshPosts}
                        className="text-xs font-semibold text-violet-500"
                      >
                        Refresh posts
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        patch({
                          post: {
                            postid: "ANY",
                            media: "",
                            mediaType: "IMAGE",
                          },
                        })
                      }
                      className={`mb-3 w-full rounded-xl border p-3 text-sm ${draft.post?.postid === "ANY" ? "border-violet-500 bg-violet-500/10" : "border-slate-200 dark:border-white/15"}`}
                    >
                      Any post or Reel
                    </button>
                    {postsLoading ? (
                      <p className="p-4 text-sm text-slate-500">
                        Loading posts…
                      </p>
                    ) : (
                      <div className="grid max-h-72 grid-cols-3 gap-2 overflow-auto">
                        {posts.map((p) => (
                          <button
                            key={p.id}
                            onClick={() =>
                              patch({
                                post: {
                                  postid: p.id,
                                  media: p.thumbnail_url ?? p.media_url ?? "",
                                  caption: p.caption ?? "",
                                  mediaType:
                                    p.media_type === "VIDEO"
                                      ? "VIDEO"
                                      : p.media_type === "CAROUSEL_ALBUM"
                                        ? "CAROUSEL_ALBUM"
                                        : "IMAGE",
                                },
                              })
                            }
                            className={`overflow-hidden rounded-xl border-2 text-left ${draft.post?.postid === p.id ? "border-violet-500" : "border-transparent"}`}
                          >
                            <img
                              src={p.thumbnail_url ?? p.media_url}
                              alt={p.caption?.slice(0, 80) ?? "Instagram post"}
                              className="aspect-square w-full object-cover"
                            />
                            <span className="block truncate p-2 text-xs">
                              {p.caption || "Instagram post"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {postsError && (
                      <p className="mt-2 text-xs text-red-500">{postsError}</p>
                    )}
                  </div>
                  <label className="block text-sm font-semibold">
                    Opening DM
                    <textarea
                      rows={3}
                      value={draft.opening}
                      maxLength={800}
                      onChange={(e) => patch({ opening: e.target.value })}
                      className="ap3k-textarea mt-2 w-full rounded-xl p-3"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Opening button
                    <input
                      value={draft.openingButton}
                      maxLength={20}
                      onChange={(e) => patch({ openingButton: e.target.value })}
                      className="ap3k-input mt-2 w-full rounded-xl p-3"
                    />
                  </label>
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                    The person must respond to this opening DM before your
                    custom conversation runs.
                  </p>
                  <label className="block text-sm font-semibold">
                    Public comment reply (optional)
                    <input
                      value={draft.publicReply}
                      maxLength={300}
                      onChange={(e) => patch({ publicReply: e.target.value })}
                      placeholder="Thanks! Check your DMs."
                      className="ap3k-input mt-2 w-full rounded-xl p-3"
                    />
                  </label>
                </>
              )}
              <button
                disabled={!triggerReady}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Build conversation
                <ArrowRight size={16} />
              </button>
            </section>
            <FlowPreview flow={flow} />
          </div>
        ) : step === 2 ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Build the conversation
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Connect each step to what happens next. Test every path in
                  preview.
                </p>
              </div>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Review flow
                <ArrowRight size={16} />
              </button>
            </div>
            <FlowCanvas flow={flow} onChange={changeFlow} />
          </>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 space-y-5">
              <h2 className="text-2xl font-bold tracking-tight">
                Ready for a real conversation?
              </h2>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-white/10 dark:bg-[#141824]">
                <p>
                  <strong>Trigger:</strong>{" "}
                  {draft.source === "COMMENT"
                    ? "Post / Reel comment"
                    : draft.source === "STORY"
                      ? `Story ${draft.storyTrigger.toLowerCase()}`
                      : "Instagram DM"}
                </p>
                <p>
                  <strong>Keyword:</strong>{" "}
                  {draft.source === "STORY"
                    ? "Not required"
                    : draft.anyMessage
                      ? "Any message"
                      : draft.keyword || "Missing"}
                </p>
                <p>
                  <strong>Conversation:</strong> {flow.nodes.length} steps
                </p>
                <p>
                  <strong>Usage:</strong> Each message sent counts toward your
                  plan’s action limit.
                </p>
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm dark:border-white/10">
                <input
                  type="checkbox"
                  checked={flow.oncePerContact}
                  onChange={(e) =>
                    changeFlow({ ...flow, oncePerContact: e.target.checked })
                  }
                  className="mt-1"
                />
                <span>
                  <strong>One entry per person</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Repeated triggers will not restart this flow for the same
                    person. Existing entry records survive edits.
                  </span>
                </span>
              </label>
              {flow.nodes.some((n) => n.kind === "random") && (
                <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                  Random splits are probabilities, not a guaranteed winner
                  count. Add the giveaway rules and prize details to your
                  opening message before publishing.
                </p>
              )}
              {!validation.flow ? (
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
                >
                  <strong>Fix these steps first:</strong>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {validation.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-300">
                  <Check size={17} />
                  All steps are connected and valid.
                </p>
              )}
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                Flows run only after an inbound Instagram interaction and within
                its messaging window. STOP cancels the conversation. Saving
                edits cancels pending runs of this flow.
              </p>
              {["PRO", "BUSINESS"].includes(plan) ? (
                <button
                  disabled={
                    busy || !integrationId || !validation.flow || !triggerReady
                  }
                  onClick={() => void save(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white disabled:opacity-40"
                >
                  {busy ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <GitBranch size={17} />
                  )}
                  Publish flow
                </button>
              ) : (
                <div className="rounded-2xl bg-violet-50 p-5 dark:bg-violet-500/10">
                  <h3 className="font-semibold">
                    Publish with Pro or Business
                  </h3>
                  <p className="my-3 text-sm text-slate-600 dark:text-slate-300">
                    Keep designing, previewing, and saving drafts on Free.
                  </p>
                  <Link
                    href={`/dashboard/${slug}/settings`}
                    className="text-sm font-bold text-violet-600 dark:text-violet-300"
                  >
                    View your plan →
                  </Link>
                </div>
              )}
            </section>
            <FlowPreview flow={flow} />
          </div>
        )}
      </main>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-md bg-white p-4 pt-6 dark:bg-[#141824] sm:p-6">
          <DialogTitle className="pe-10">Test your flow</DialogTitle>
          <DialogDescription>
            No Instagram messages are sent from this preview.
          </DialogDescription>
          <FlowPreview flow={flow} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
