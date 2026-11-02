"use client";
import { useUi } from "@/components/i18n/use-ui";
import { UiText } from "@/components/i18n/localized-copy";
import { useState } from "react";
import { Instagram, Trash2, RefreshCw, Check } from "lucide-react";
import type { FlowTrigger } from "@/lib/automation-flow/triggers";
const choices = [
  {
    label: "User comments on your Post or Reel",
    detail: "Post or Reel Comments",
    source: "COMMENT",
  },
  {
    label: "User replies to your Story",
    detail: "Story reply",
    source: "STORY",
    storyTrigger: "REPLY",
  },
  { label: "User sends a message", detail: "Instagram message", source: "DM" },
  {
    label: "User mentions you in a Story",
    detail: "Story mention",
    source: "STORY",
    storyTrigger: "MENTION",
  },
  {
    label: "User shares a post or reel",
    detail: "Instagram message",
    source: "DM",
    sharedPost: true,
  },
] as const;
export function triggerLabel(t: FlowTrigger) {
  return t.sharedPost
    ? "User shares a post or reel"
    : t.source === "COMMENT"
      ? "User comments on your Post or Reel"
      : t.source === "STORY"
        ? t.storyTrigger === "MENTION"
          ? "User mentions you in a Story"
          : "User replies to your Story"
        : "User sends a message";
}
export default function FlowTriggerEditor({
  trigger,
  posts,
  postsLoading,
  postsError,
  refreshPosts,
  onChange,
  onAdd,
  onRemove,
}: {
  trigger?: FlowTrigger;
  posts: any[];
  postsLoading?: boolean;
  postsError?: string;
  refreshPosts: () => void;
  onChange: (t: FlowTrigger) => void;
  onAdd: (t: FlowTrigger) => void;
  onRemove?: () => void;
}) {
  const tr = useUi();
  if (!trigger)
    return (
      <div className="space-y-3 p-5">
        {choices.map((c, i) => (
          <button
            key={i}
            onClick={() =>
              onAdd({
                id: `trigger_${crypto.randomUUID().slice(0, 8)}`,
                source: c.source,
                storyTrigger: "storyTrigger" in c ? c.storyTrigger : "REPLY",
                sharedPost: "sharedPost" in c ? c.sharedPost : false,
                keyword: "",
                anyMessage: c.source === "STORY" || "sharedPost" in c,
                post: null,
                postScope: "specific",
              })
            }
            className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-[#f5f5f5] px-4 py-4 text-start transition hover:border-violet-400 dark:bg-white/5"
          >
            <Instagram className="h-5 w-5 shrink-0 text-pink-500" />
            <span>
              <strong className="block text-[13px] font-semibold">
                {tr(c.label)}
              </strong>
              <span className="mt-1 block text-xs text-slate-500 light:text-slate-600 dark:text-slate-400">
                {tr(c.detail)}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  const patch = (p: Partial<FlowTrigger>) => onChange({ ...trigger, ...p });
  return (
    <div className="space-y-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold">{triggerLabel(trigger)}</h3>
        {onRemove && (
          <button
            aria-label={tr("Remove trigger")}
            onClick={onRemove}
            className="p-1 text-red-500"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {trigger.source === "COMMENT" && (
        <>
          <label className="block text-sm font-medium"><UiText>{"Post"}</UiText><select
              value={trigger.postScope ?? "specific"}
              onChange={(e) =>
                patch({
                  postScope: e.target.value as FlowTrigger["postScope"],
                  post:
                    e.target.value === "all"
                      ? { postid: "ANY", media: "", mediaType: "IMAGE" }
                      : null,
                  boundPostId: undefined,
                })
              }
              className="flow-editor-input"
            >
              <option value="specific"><UiText>{"A specific post or reel"}</UiText></option>
              <option value="all"><UiText>{"All posts and reels"}</UiText></option>
              <option value="next"><UiText>{"Next published post or reel"}</UiText></option>
            </select>
          </label>
          {trigger.postScope === "next" && (
            <p className="rounded-xl bg-violet-50 p-3 text-xs leading-5 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><UiText>{"Listens to the first Instagram post or reel published after you publish this automation."}</UiText></p>
          )}
          {(!trigger.postScope || trigger.postScope === "specific") && (
            <div>
              <div className="mb-3 flex justify-between text-xs">
                <span><UiText>{"Select a post"}</UiText></span>
                <button
                  onClick={refreshPosts}
                  disabled={postsLoading}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-violet-700 hover:bg-violet-50 disabled:opacity-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
                >
                  <RefreshCw size={14} className={postsLoading ? "animate-spin" : ""} /><UiText>{"Refresh"}</UiText></button>
              </div>
              {postsError && (
                <p role="alert" className="mb-3 text-xs text-red-500">
                  {postsError}
                </p>
              )}
              <div className="flow-post-scroll max-h-72 overflow-y-auto overscroll-contain rounded-xl p-1" role="group" aria-label={tr("Instagram posts")}>
              <div className="grid grid-cols-3 content-start items-start gap-2">
                {posts.map((p) => {
                  const id = String(p.id ?? p.postid);
                  const src = p.thumbnail_url || p.media_url || p.media;
                  return (
                    <button
                      key={id}
                      onClick={() =>
                        patch({
                          post: {
                            postid: id,
                            media: src ?? "",
                            caption: p.caption ?? "",
                            mediaType: p.media_type ?? p.mediaType ?? "IMAGE",
                          },
                        })
                      }
                      type="button"
                      aria-pressed={trigger.post?.postid === id}
                      aria-label={`Select post ${p.caption?.slice(0, 45) || id}`}
                      className={`flow-post-tile relative block w-full aspect-square overflow-hidden rounded-xl border-2 ${trigger.post?.postid === id ? "border-violet-500" : "border-transparent"}`}
                    >
                      <PostThumbnail src={src} caption={p.caption} />
                      {trigger.post?.postid === id && <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-violet-600 text-white shadow-sm"><Check size={14} /></span>}
                    </button>
                  );
                })}
              </div>
              </div>
              {postsLoading && (
                <p className="py-5 text-center text-xs"><UiText>{"Loading posts…"}</UiText></p>
              )}
              {!postsLoading && !posts.length && (
                <p className="py-5 text-center text-xs text-slate-500 light:text-slate-600"><UiText>{"No posts loaded. Refresh your connected Instagram account."}</UiText></p>
              )}
            </div>
          )}
        </>
      )}
      {trigger.source === "STORY" && (
        <label className="block text-sm font-medium"><UiText>{"Story interaction"}</UiText><select
            className="flow-editor-input"
            value={trigger.storyTrigger}
            onChange={(e) =>
              patch({
                storyTrigger: e.target.value as FlowTrigger["storyTrigger"],
              })
            }
          >
            <option value="REPLY"><UiText>{"Story reply"}</UiText></option>
            <option value="MENTION"><UiText>{"Story mention"}</UiText></option>
            <option value="REACTION"><UiText>{"Story reaction"}</UiText></option>
          </select>
        </label>
      )}
      {!trigger.sharedPost && (
        <>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              {trigger.source === "COMMENT" ? "Any comment" : "Any message"}
            </span>
            <input
              type="checkbox"
              checked={trigger.anyMessage}
              onChange={(e) => patch({ anyMessage: e.target.checked })}
              className="h-4 w-4 accent-violet-600"
            />
          </label>
          {!trigger.anyMessage && (
            <label className="block text-sm font-medium"><UiText>{"Keyword"}</UiText><input
                className="flow-editor-input"
                value={trigger.keyword}
                maxLength={100}
                placeholder={tr("e.g. link")}
                onChange={(e) => patch({ keyword: e.target.value })}
              />
              <span className="mt-2 block text-xs leading-5 text-slate-500 light:text-slate-600 dark:text-slate-400"><UiText>{"Matches this phrase inside the message. Add another trigger for a different keyword."}</UiText></span>
            </label>
          )}
        </>
      )}
      {trigger.sharedPost && (
        <p className="text-xs leading-5 text-slate-500 light:text-slate-600 dark:text-slate-400"><UiText>{"Runs when Instagram delivers a post or reel share in your inbox. Ordinary text messages do not trigger this rule."}</UiText></p>
      )}
    </div>
  );
}

function PostThumbnail({ src, caption }: { src?: string; caption?: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!src || failedSrc === src || /\.(mp4|mov)(?:[?#]|$)/i.test(src)) return <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-300"><Instagram size={22} /><span className="text-[10px]"><UiText>{"Instagram post"}</UiText></span></span>;
  // Expired Instagram images should leave a selectable tile, never a broken icon.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={caption?.slice(0, 70) || "Instagram post"} loading="lazy" decoding="async" onError={() => setFailedSrc(src)} className="absolute inset-0 h-full w-full object-cover" />;
}
