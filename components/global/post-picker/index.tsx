"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

type Post = {
  id: string;
  caption?: string;
  media_url: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
};

type Props = {
  posts: Post[];
  selected: string | null;
  onSelect: (post: Post) => void;
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
    <div className="grid grid-cols-4 gap-2.5">
      {posts.map((post) => {
        const isSelected = selected === post.id;
        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onSelect(post)}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
              isSelected
                ? "border-rf-blue shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                : "border-rf-border hover:border-rf-blue/50 hover:scale-[1.02]"
            )}
          >
            <Image
              src={post.media_url}
              alt={post.caption ?? "Post"}
              fill
              className="object-cover"
              unoptimized
            />
            {/* Type badge */}
            <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              {post.media_type === "VIDEO" ? "🎬 Reel" : "📷 Post"}
            </span>
            {/* Selected checkmark */}
            {isSelected && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rf-blue rounded-full flex items-center justify-center text-white text-[10px] shadow">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
