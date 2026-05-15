"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export type InstagramPost = {
  id: string;
  caption?: string;
  media_url: string;
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
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rf-border p-10 text-center text-rf-muted text-sm">
        No posts found. Make sure your Instagram account is connected.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {posts.map((post) => {
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
              "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all",
              isSelected
                ? "border-rf-blue shadow-[0_0_0_3px_rgba(59,130,246,0.25)] scale-[1.03]"
                : "border-rf-border hover:border-rf-blue/50 hover:scale-[1.02]"
            )}
          >
            {thumb ? (
              <Image
                src={thumb}
                alt={post.caption ?? "Post"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-rf-surface flex items-center justify-center text-2xl">
                🎬
              </div>
            )}
            <span className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              {post.media_type === "VIDEO" ? "🎬" : post.media_type === "CAROUSEL_ALBUM" ? "🖼️" : "📷"}
            </span>
            {isSelected && (
              <div className="absolute inset-0 bg-rf-blue/15 flex items-start justify-end p-1.5">
                <span className="w-5 h-5 bg-rf-blue rounded-full flex items-center justify-center text-white text-[10px] shadow-md">
                  ✓
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
