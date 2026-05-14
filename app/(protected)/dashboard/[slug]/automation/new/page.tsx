"use client";

import DmEditor from "@/components/global/dm-editor";
import EmptyState from "@/components/global/empty-state";
import KeywordInput from "@/components/global/keyword-input";
import PostPicker from "@/components/global/post-picker";
import WizardStepper from "@/components/global/wizard-stepper";
import type { StepStatus } from "@/components/global/wizard-stepper";
import { useQueryAutomationPosts, useQueryUser } from "@/hooks/user-queries";
import { useQueryAutomations } from "@/hooks/user-queries";
import { useWizard } from "@/hooks/use-wizard";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ edit?: string }>;
};

const STEP_LABELS = [
  "Choose post",
  "Keywords",
  "Write DM",
  "Public reply",
  "AI mode",
  "Activate",
];

const STEP_TIPS = [
  "Pick the Reel or post you want to run this campaign on.",
  "Use 2–4 keywords. More keywords = more DMs triggered.",
  "This is the most important step. Write a DM people actually want to receive.",
  "Optional — leave blank to skip. This appears publicly under the comment.",
  "Smart AI handles follow-up questions automatically. Requires Creator plan.",
  "Review everything. You can pause or edit this campaign at any time.",
];

export default function WizardPage({ params, searchParams }: Props) {
  const { slug } = use(params);
  const query = searchParams ? use(searchParams) : {};
  const editId = query.edit;
  const { data: posts, isLoading: postsLoading } = useQueryAutomationPosts();
  const { data: user } = useQueryUser();
  const { data: editing } = useQueryAutomations(editId ?? "", Boolean(editId));
  const [manualMedia, setManualMedia] = useState("");
  const [loadedEdit, setLoadedEdit] = useState(false);

  const isProUser = user?.data?.subscription?.plan === "PRO";
  const { step, data, update, next, back, goTo, canAdvance, activate, isSubmitting, error } =
    useWizard(slug, editId);

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    status: (i + 1 < step ? "done" : i + 1 === step ? "active" : "todo") as StepStatus,
  }));

  const postList: any[] = posts?.data?.data ?? [];
  const hasInstagramConnection = (user?.data?.integrations?.length ?? 0) > 0;

  useEffect(() => {
    if (!editId || loadedEdit || editing?.status !== 200 || !editing.data) return;
    const automation: any = editing.data;
    const post = automation.posts?.[0];
    update({
      campaignName: automation.name ?? "",
      active: Boolean(automation.active),
      matchingMode: automation.matchingMode ?? "CONTAINS",
      keywords: Array.isArray(automation.keywords)
        ? automation.keywords.map((keyword: any) => keyword.word).filter(Boolean)
        : [],
      dmMessage: automation.listener?.prompt ?? "",
      publicReply: automation.listener?.commentReply ?? "",
      ctaLink: automation.listener?.ctaLink ?? "",
      aiMode: automation.listener?.listener === "SMARTAI",
      post: post
        ? {
            postid: post.postid,
            caption: post.caption ?? undefined,
            media: post.media,
            mediaType: post.mediaType,
          }
        : null,
    });
    setLoadedEdit(true);
  }, [editId, editing, loadedEdit, update]);

  const selectManualMedia = () => {
    const value = manualMedia.trim();
    if (!value) return;

    update({
      post: {
        postid: value,
        caption: value.startsWith("http") ? "Manual Instagram post URL" : `Manual media ID ${value}`,
        media: value,
        mediaType: "IMAGE",
      },
    });
  };

  return (
    <div className="min-h-screen bg-rf-bg flex flex-col">

      {/* Wizard header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-10 py-4
                      border-b border-rf-border bg-rf-bg/90 backdrop-blur-xl">
        <Link href={`/dashboard/${slug}/automation`}
              className="text-rf-muted text-sm hover:text-rf-text transition-colors">
          ← Back
        </Link>
        <div className="text-center">
          <p className="text-sm font-bold text-rf-text">
            {editId ? "Edit Campaign" : "New Campaign"}
          </p>
          <p className="text-xs text-rf-muted">
            {editId ? "Update your automation flow" : "Launch in 60 seconds"}
          </p>
        </div>
        <span className="text-xs text-rf-muted flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rf-green" /> Auto-saved
        </span>
      </div>

      {/* Stepper */}
      <div className="max-w-2xl mx-auto w-full px-8 pt-8">
        <WizardStepper steps={steps} />
      </div>

      {/* Body */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-8 py-10">

        {/* Step 1 — Choose post */}
        {step === 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-2">
              📸 Step 1 of 6
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              Name it and choose a post or Reel
            </h2>
            <p className="text-rf-muted text-sm mb-6">
              Which post do you want to run this campaign on?
            </p>
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-rf-muted">
                Campaign name
              </label>
              <input
                value={data.campaignName}
                onChange={(event) => update({ campaignName: event.target.value })}
                placeholder="Example: May launch guide"
                className="w-full rounded-xl border border-white/10 bg-rf-surface px-4 py-3 text-sm text-rf-text outline-none transition-colors placeholder:text-rf-subtle focus:border-rf-pink/50"
              />
            </div>
            {postsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-rf-muted" />
              </div>
            ) : !hasInstagramConnection ? (
              <EmptyState
                icon="🔗"
                title="Connect Instagram first"
                description="AP3k needs an official Instagram connection before it can listen for comments or send private replies."
                ctaLabel="Connect Instagram"
                ctaHref={`/dashboard/${slug}/integrations`}
              />
            ) : postList.length === 0 ? (
              <ManualMediaFallback
                value={manualMedia}
                selected={data.post?.postid ?? null}
                onChange={setManualMedia}
                onSelect={selectManualMedia}
              />
            ) : (
              <div className="flex flex-col gap-6">
                <PostPicker
                  posts={postList}
                  selected={data.post?.postid ?? null}
                  onSelect={(p) =>
                    update({
                      post: {
                        postid: p.id,
                        caption: p.caption,
                        media: p.media_url,
                        mediaType: p.media_type === "VIDEO" ? "VIDEO"
                          : p.media_type === "CAROUSEL_ALBUM" ? "CAROSEL_ALBUM"
                          : "IMAGE",
                      },
                    })
                  }
                />
                <ManualMediaFallback
                  value={manualMedia}
                  selected={data.post?.postid ?? null}
                  onChange={setManualMedia}
                  onSelect={selectManualMedia}
                  compact
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Keywords */}
        {step === 2 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-2">
              🏷️ Step 2 of 6
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              What triggers your DM?
            </h2>
            <p className="text-rf-muted text-sm mb-6">
              Add the words people comment to receive your DM automatically.
            </p>
            <KeywordInput
              keywords={data.keywords}
              matchingMode={data.matchingMode}
              onAdd={(w) => update({ keywords: [...data.keywords, w] })}
              onRemove={(w) => update({ keywords: data.keywords.filter((k) => k !== w) })}
              onModeChange={(m) => update({ matchingMode: m })}
              isProUser={isProUser}
            />
          </div>
        )}

        {/* Step 3 — Write DM */}
        {step === 3 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-2">
              ✉️ Step 3 of 6
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              Write your DM
            </h2>
            <p className="text-rf-muted text-sm mb-6">
              This is the message people receive when they comment your keyword.
            </p>
            <DmEditor
              value={data.dmMessage}
              ctaLink={data.ctaLink}
              onChange={(v) => update({ dmMessage: v })}
              onCtaLinkChange={(l) => update({ ctaLink: l })}
            />
          </div>
        )}

        {/* Step 4 — Public reply (optional) */}
        {step === 4 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-muted mb-2">
              💬 Step 4 of 6 — Optional
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              Public comment reply
            </h2>
            <p className="text-rf-muted text-sm mb-6">
              Reply publicly under their comment before sending the DM. Leave blank to skip.
            </p>
            <textarea
              value={data.publicReply}
              onChange={(e) => update({ publicReply: e.target.value })}
              placeholder="Optional — e.g. 'Sending you the link now! 📩'"
              rows={3}
              className="w-full bg-rf-surface border border-rf-border rounded-xl px-4 py-3
                         text-sm text-rf-text placeholder:text-rf-subtle outline-none
                         focus:border-rf-blue resize-none transition-colors"
            />
            <p className="text-xs text-rf-muted mt-2">
              This appears publicly on your post. The DM is always sent regardless.
            </p>
          </div>
        )}

        {/* Step 5 — AI mode (optional) */}
        {step === 5 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-muted mb-2">
              🤖 Step 5 of 6 — Optional
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              Smart AI replies
            </h2>
            <p className="text-rf-muted text-sm mb-6">
              Let AI handle follow-up questions in the DM thread. 24/7, in your tone.
            </p>

            <button
              type="button"
              onClick={() => isProUser && update({ aiMode: !data.aiMode })}
              className={[
                "w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                data.aiMode && isProUser
                  ? "border-rf-purple/40 bg-rf-purple/6"
                  : "border-rf-border bg-rf-surface",
                !isProUser ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-rf-purple/30",
              ].join(" ")}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rf-blue to-rf-purple
                              flex items-center justify-center text-xl flex-shrink-0">
                🤖
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-rf-text text-sm">Smart AI</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5
                                   rounded bg-gradient-to-r from-rf-blue to-rf-purple text-white">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-rf-muted leading-snug">
                  AI reads follow-up messages and responds intelligently based on your DM prompt.
                  Converts more leads without your involvement.
                </p>
                {!isProUser && (
                  <Link
                    href="/payment"
                    className="text-xs text-rf-blue font-semibold mt-2 inline-block hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Upgrade to Creator to unlock →
                  </Link>
                )}
              </div>
              {/* Toggle */}
              <div className={[
                "w-10 h-5 rounded-full relative flex-shrink-0 transition-colors",
                data.aiMode && isProUser ? "bg-rf-purple" : "bg-rf-subtle",
              ].join(" ")}>
                <span className={[
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                  data.aiMode && isProUser ? "left-5" : "left-0.5",
                ].join(" ")} />
              </div>
            </button>
          </div>
        )}

        {/* Step 6 — Review & Activate */}
        {step === 6 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-green mb-2">
              🚀 Step 6 of 6
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              Review &amp; Activate
            </h2>
            <p className="text-rf-muted text-sm mb-6">
              Everything look good? Hit activate and your campaign goes live instantly.
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {[
                { label: "Name",         value: data.campaignName || "Untitled campaign",            step: 1 as const },
                { label: "Post",         value: data.post?.caption?.slice(0, 60) ?? "Selected post", step: 1 as const },
                { label: "Keywords",     value: data.keywords.join(", ") || "None",                  step: 2 as const },
                { label: "DM message",   value: data.dmMessage.slice(0, 80) + (data.dmMessage.length > 80 ? "…" : ""), step: 3 as const },
                { label: "Public reply", value: data.publicReply || "Skipped",                       step: 4 as const },
                { label: "AI mode",      value: data.aiMode ? "Smart AI enabled" : "Standard mode",  step: 5 as const },
                { label: "Status",       value: data.active ? "Activate immediately" : "Save paused", step: 6 as const },
              ].map((row) => (
                <div key={row.label}
                     className="flex items-center justify-between gap-3 px-4 py-3
                                bg-rf-surface border border-rf-border rounded-xl">
                  <span className="text-xs text-rf-muted w-24 flex-shrink-0">{row.label}</span>
                  <span className="text-xs text-rf-text flex-1 truncate">{row.value}</span>
                  <button
                    type="button"
                    onClick={() => goTo(row.step)}
                    className="text-xs text-rf-blue hover:underline flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20
                            rounded-lg px-4 py-3 mb-4">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => update({ active: !data.active })}
              className={[
                "mb-6 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                data.active
                  ? "border-rf-green/25 bg-rf-green/10"
                  : "border-rf-border bg-rf-surface",
              ].join(" ")}
            >
              <span>
                <span className="block text-sm font-bold text-rf-text">Active campaign</span>
                <span className="mt-1 block text-xs text-rf-muted">
                  When enabled, AP3k listens for matching comments and sends the configured DM.
                </span>
              </span>
              <span
                className={[
                  "relative h-6 w-11 rounded-full transition-colors",
                  data.active ? "bg-rf-green" : "bg-rf-subtle",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                    data.active ? "left-6" : "left-1",
                  ].join(" ")}
                />
              </span>
            </button>
          </div>
        )}

      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-white/10 bg-rf-surface/85 px-4 py-4
                      flex items-center justify-between backdrop-blur-xl sm:px-10">
        <p className="text-xs text-rf-muted hidden sm:block">
          💡 {STEP_TIPS[step - 1]}
        </p>
        <div className="flex items-center gap-3 ml-auto">
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              disabled={isSubmitting}
              className="border border-rf-border text-rf-muted hover:text-rf-text hover:border-rf-subtle
                         font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              ← Back
            </button>
          )}
          {step < 6 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              className="ap3k-gradient-button disabled:opacity-40
                         text-sm px-7 py-2.5"
            >
              {step === 4 || step === 5 ? "Skip →" : "Next →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={activate}
              disabled={isSubmitting}
              className="ap3k-gradient-button
                         text-sm px-8 py-2.5 rounded-xl flex items-center gap-2
                         disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" /> Activating…</>
              ) : (
                editId ? "Save Campaign" : "🚀 Activate Campaign"
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

function ManualMediaFallback({
  value,
  selected,
  onChange,
  onSelect,
  compact,
}: {
  value: string;
  selected: string | null;
  onChange: (value: string) => void;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-rf-border bg-rf-surface/60 p-5">
      <h3 className="text-sm font-black text-rf-text">
        {compact ? "Use a media ID manually" : "No posts found. Add a media ID manually."}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-rf-muted">
        Paste the Instagram media ID for the post or Reel. A post URL can be saved as a reference,
        but webhook matching is most reliable with the Meta media ID returned by Instagram.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Instagram media ID or post URL"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-rf-bg/70 px-4 py-3 text-sm text-rf-text outline-none transition-colors placeholder:text-rf-subtle focus:border-rf-pink/50"
        />
        <button
          type="button"
          onClick={onSelect}
          disabled={!value.trim()}
          className="ap3k-gradient-button px-5 py-3 text-sm disabled:opacity-40"
        >
          Use this post
        </button>
      </div>
      {selected && selected === value.trim() && (
        <p className="mt-3 text-xs font-semibold text-rf-green">Manual post selected.</p>
      )}
    </div>
  );
}
