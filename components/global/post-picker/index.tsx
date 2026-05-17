"use client";

import { cn } from "@/lib/utils";
import { ExternalLink, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

export type InstagramPost = {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
  permalink?: string;
};

type Props = {
  posts: InstagramPost[];
  selected: string | null;
  onSelect: (post: InstagramPost) => void;
};

export default function PostPicker({ posts, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((post) =>
      `${post.caption ?? ""} ${post.id}`.toLowerCase().includes(needle)
    );
  }, [posts, query]);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rf-border p-10 text-center text-rf-muted text-sm">
        No posts found. Make sure your Instagram account is connected.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by caption or media ID"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
      {filtered.map((post) => {
        const isSelected = selected === post.id;
        const thumb =
          post.media_type === "VIDEO"
            ? (post.thumbnail_url ?? post.media_url)
            : post.media_url;

        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onSelect(post)}
            className={cn(
              "group overflow-hidden rounded-2xl border-2 bg-white text-left transition-all",
              isSelected
                ? "border-rf-blue shadow-[0_0_0_3px_rgba(59,130,246,0.25)] scale-[1.03]"
                : "border-slate-200 hover:border-rf-blue/50"
            )}
          >
            <div className="flex gap-3 p-3">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={post.caption ?? "Post"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xl text-slate-400">
                    Post
                  </div>
                )}
                <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                  {post.media_type === "VIDEO" ? "VIDEO" : post.media_type === "CAROUSEL_ALBUM" ? "CAROUSEL" : "IMAGE"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-950">
                  {post.caption?.trim() || "Instagram post or Reel"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatPostDate(post.timestamp)}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
                  {post.id}
                </p>
                {post.permalink && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rf-blue">
                    Open on Instagram <ExternalLink className="h-3 w-3" />
                  </span>
                )}
              </div>
              {isSelected && (
                <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-rf-blue text-xs font-bold text-white">
                  ✓
                </span>
              )}
            </div>
          </button>
        );
      })}
      </div>
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No posts match your search.
        </div>
      )}
    </div>
  );
}

function formatPostDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
