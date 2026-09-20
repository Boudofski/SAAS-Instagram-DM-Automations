"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useI18n } from "@/providers/i18n-provider";
import { translateUi } from "@/lib/i18n/translate";

/** Keep off-screen demos out of the initial download and decoding workload. */
export default function VisibleProductVideo({ src, poster, label, className, deferUntilLoaded = false, showPlaybackControl = false }: {
  src: string;
  showPlaybackControl?: boolean;
  deferUntilLoaded?: boolean;
  poster?: string;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const { locale } = useI18n();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ready = !deferUntilLoaded;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let disposed = false;
    const sync = () => {
      const active = ready && visible && document.visibilityState === "visible";
      if (active && !video.getAttribute("src")) {
        video.src = src;
        video.load();
      }
      video.controls = motion.matches;
      if (active && !motion.matches && !userPaused.current) {
        void video.play().then(() => {
          // A pending play request may resolve after leaving the viewport.
          if (disposed || !visible || document.visibilityState !== "visible" || motion.matches || userPaused.current) video.pause();
        }).catch(() => { if (!disposed) video.controls = true; });
      } else {
        video.pause();
      }
    };
    // Let critical CSS, fonts and the initial paint finish before hero video bytes compete.
    const afterLoad = () => { timer = setTimeout(() => { ready = true; sync(); }, 1200); };
    if (deferUntilLoaded) {
      if (document.readyState === "complete") afterLoad();
      else window.addEventListener("load", afterLoad, { once: true });
    }
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      // A sliver at the viewport edge should not start a large media download.
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      sync();
    }, { threshold: [0, 0.25] });
    if (observer) observer.observe(video);
    else { visible = true; sync(); }
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      disposed = true;
      clearTimeout(timer);
      window.removeEventListener("load", afterLoad);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, deferUntilLoaded]);

  const togglePlayback = () => {
    const video = ref.current;
    if (!video) return;
    if (!video.paused) {
      userPaused.current = true;
      video.pause();
    } else {
      userPaused.current = false;
      if (!video.getAttribute("src")) { video.src = src; video.load(); }
      void video.play().catch(() => { video.controls = true; });
    }
  };

  const video = <video ref={ref} muted loop playsInline preload="none" poster={poster} aria-label={translateUi(label, locale)} className={className} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />;
  if (!showPlaybackControl) return video;
  return <div className="relative">
    {video}
    <button type="button" onClick={togglePlayback} aria-label={translateUi(playing ? "Pause demo" : "Play demo", locale)} className="absolute end-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/80 text-white transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
      {playing ? <Pause aria-hidden="true" className="h-3.5 w-3.5" /> : <Play aria-hidden="true" className="h-3.5 w-3.5" />}
    </button>
  </div>;
}
