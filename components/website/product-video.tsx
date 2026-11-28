"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Play, Send } from "lucide-react";
import { PRODUCT_VIDEOS } from "@/lib/product-videos";

export default function ProductVideo({
  video = "overview",
}: { video?: keyof typeof PRODUCT_VIDEOS }) {
  const item = PRODUCT_VIDEOS[video];
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const showPlayer = video === "tutorial" || playing;

  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);

  return (
    <div className="relative isolate my-8 aspect-video min-h-[200px] w-full overflow-hidden rounded-xl bg-black ring-1 ring-black/10 dark:ring-white/15 sm:rounded-2xl">
      {showPlayer ? (
        <iframe
          ref={frame}
          className="absolute inset-0 block h-full w-full border-0"
          src={`https://www.youtube-nocookie.com/embed/${item.id}?playsinline=1&rel=0${playing ? "&autoplay=1" : ""}`}
          title={item.title}
          loading={playing ? "eager" : "lazy"}
          allow={playing ? "autoplay; encrypted-media; picture-in-picture; fullscreen" : "encrypted-media; picture-in-picture; fullscreen"}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <a
          href={`https://www.youtube.com/watch?v=${item.id}`}
          aria-label={`Play video: ${item.title}`}
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            setPlaying(true);
          }}
          className="group absolute inset-0 grid place-items-center bg-[#100d23] bg-[radial-gradient(ellipse_at_50%_85%,#43266e_0%,#18122d_58%,#100d23_100%)] text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-4 focus-visible:outline-white"
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-[11%] flex items-center justify-between text-violet-200/90 sm:inset-x-[15%]">
            <span className="grid -rotate-6 place-items-center rounded-2xl border border-violet-300/30 bg-violet-300/10 p-4 sm:p-8">
              <MessageCircle className="h-6 w-6 sm:h-12 sm:w-12" strokeWidth={1.5} />
            </span>
            <span className="grid rotate-6 place-items-center rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/10 p-4 sm:p-8">
              <Send className="h-6 w-6 sm:h-12 sm:w-12" strokeWidth={1.5} />
            </span>
          </span>
          <span aria-hidden="true" className="relative grid h-16 w-16 place-items-center rounded-full bg-white text-violet-800 shadow-xl motion-safe:transition-transform motion-safe:group-hover:scale-110 sm:h-20 sm:w-20">
            <Play className="ml-1 h-6 w-6 fill-current" />
          </span>
        </a>
      )}
    </div>
  );
}
