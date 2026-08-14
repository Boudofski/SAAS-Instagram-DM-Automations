"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ExternalLink, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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

const POSTS_PER_PAGE = 14;

export default function PostPicker({ posts, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((post) =>
      `${post.caption ?? ""} ${post.id}`.toLowerCase().includes(needle)
    );
  }, [posts, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const pagedPosts = filtered.slice(start, start + POSTS_PER_PAGE);
  const pageNumbers = getVisiblePageNumbers(currentPage, totalPages);

  useEffect(() => {
    setPage(1);
  }, [query, posts]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
          className="ap3k-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + POSTS_PER_PAGE, filtered.length)} of {filtered.length} media
        </span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          Page {currentPage} of {totalPages} · 14 posts per page
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
      {pagedPosts.map((post) => {
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
              "group overflow-hidden rounded-2xl border-2 bg-white text-left transition-all dark:bg-[#101827]",
              isSelected
                ? "border-rf-blue shadow-[0_0_0_3px_rgba(59,130,246,0.25)] scale-[1.03]"
                : "border-slate-200 hover:border-rf-blue/50 dark:border-white/10"
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
                <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-950 dark:text-slate-50">
                  {post.caption?.trim() || "Instagram post or Reel"}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  {formatPostDate(post.timestamp)}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
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
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
          No posts match your search.
        </div>
      )}

      {filtered.length > POSTS_PER_PAGE && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {pageNumbers.map((item, index) => item === "…" ? (
              <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-500">…</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                className={cn(
                  "h-8 min-w-8 rounded-lg px-2 text-xs font-black transition-colors",
                  currentPage === item
                    ? "bg-rf-blue text-white shadow-[0_0_0_3px_rgba(59,130,246,0.18)]"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push("…");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

function formatPostDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
