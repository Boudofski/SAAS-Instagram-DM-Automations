"use client";

import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion, type MotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Feature = {
  kicker: string;
  title: string;
  body: string;
  bullets: readonly string[];
  src: string;
  label: string;
};

export default function ScrollFeatureSlider({ features }: { features: readonly Feature[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const nextIndex = Math.min(features.length - 1, Math.max(0, Math.floor(progress * features.length)));
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  return (
    <section ref={sectionRef} id="features" className="relative h-[300svh] bg-[#5922ca] text-white">
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
        {features.map((feature, index) => (
          <FeatureSlide
            key={feature.title}
            feature={feature}
            index={index}
            total={features.length}
            progress={scrollYProgress}
            active={activeIndex === index}
          />
        ))}

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-6">
          {features.map((feature, index) => (
            <span
              key={feature.title}
              className={`h-1.5 rounded-full transition-all duration-500 ${activeIndex === index ? "w-8 bg-white" : "w-1.5 bg-white/35"}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="absolute bottom-4 right-5 z-20 text-[10px] font-black uppercase tracking-[0.18em] text-white/45 sm:bottom-6 sm:right-8">
          {String(activeIndex + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
        </p>
      </div>
    </section>
  );
}

function FeatureSlide({
  feature,
  index,
  total,
  progress,
  active,
}: {
  feature: Feature;
  index: number;
  total: number;
  progress: MotionValue<number>;
  active: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const segmentStart = index / total;
  const segmentEnd = (index + 1) / total;
  const center = (segmentStart + segmentEnd) / 2;
  const fade = 0.065;
  const opacity = useTransform(
    progress,
    index === 0
      ? [0, segmentEnd - fade, segmentEnd + fade]
      : index === total - 1
        ? [segmentStart - fade, segmentStart + fade, 1]
        : [0, segmentStart - fade, segmentStart + fade, segmentEnd - fade, segmentEnd + fade, 1],
    index === 0 ? [1, 1, 0] : index === total - 1 ? [0, 1, 1] : [0, 0, 1, 1, 0, 0]
  );
  const y = useTransform(progress, [Math.max(0, segmentStart - fade), center, Math.min(1, segmentEnd + fade)], [44, 0, -44]);
  const scale = useTransform(progress, [Math.max(0, segmentStart - fade), center, Math.min(1, segmentEnd + fade)], [0.97, 1, 0.97]);

  const gradients = [
    "bg-[radial-gradient(circle_at_12%_18%,rgba(244,114,182,0.28),transparent_28rem),linear-gradient(135deg,#5521c8,#7832e3)]",
    "bg-[radial-gradient(circle_at_86%_22%,rgba(244,114,182,0.25),transparent_28rem),linear-gradient(135deg,#6725d4,#8b35df)]",
    "bg-[radial-gradient(circle_at_18%_78%,rgba(30,41,59,0.28),transparent_30rem),linear-gradient(135deg,#5c22cc,#7431df)]",
  ];

  return (
    <motion.article
      style={reduceMotion ? undefined : { opacity, y, scale }}
      animate={reduceMotion ? { opacity: active ? 1 : 0 } : undefined}
      transition={reduceMotion ? { duration: 0 } : undefined}
      className={`absolute inset-0 flex items-center px-4 py-7 sm:px-8 sm:py-10 lg:px-16 ${gradients[index % gradients.length]}`}
      aria-hidden={!active}
    >
      <div className={`mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-2 lg:gap-24 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="text-center lg:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200 sm:text-xs">{feature.kicker}</p>
          <h2 className="mx-auto mt-3 max-w-xl text-3xl font-black leading-[0.96] tracking-[-0.05em] sm:text-5xl lg:mx-0 lg:mt-4">{feature.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-base sm:leading-7 lg:mx-0 lg:mt-6 lg:text-lg lg:leading-8">{feature.body}</p>
          <div className="mt-7 hidden space-y-3 lg:block">
            {feature.bullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-3 text-sm font-bold text-white/90">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10"><CheckCircle2 className="h-4 w-4 text-fuchsia-200" /></span>
                {bullet}
              </div>
            ))}
          </div>
          <Link href="/sign-up" tabIndex={active ? 0 : -1} className="mt-8 hidden items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#6128c8] shadow-lg transition hover:-translate-y-0.5 lg:inline-flex">
            Try it free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mx-auto flex w-full items-center justify-center">
          <SliderVideo src={feature.src} label={feature.label} active={active} />
        </div>
      </div>
    </motion.article>
  );
}

function SliderVideo({ src, label, active }: { src: string; label: string; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) void video.play().catch(() => undefined);
    else video.pause();
  }, [active]);

  return (
    <div className="relative w-[min(60vw,250px)] sm:w-[260px] lg:w-full lg:max-w-[300px]">
      <div className="pointer-events-none absolute -inset-10 rounded-[4rem] bg-[radial-gradient(circle,rgba(244,114,182,0.28),rgba(124,58,237,0.16)_42%,transparent_70%)] blur-2xl" />
      <motion.div
        animate={active ? { y: [0, -8, 0], rotate: [-0.3, 0.3, -0.3] } : undefined}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        className="relative rounded-[2.7rem] border border-white/25 bg-[#090a10] p-[7px] shadow-[0_34px_90px_rgba(25,7,66,0.42)] ring-1 ring-black/25"
      >
        <div className="overflow-hidden rounded-[2.32rem] bg-black">
          <video ref={videoRef} muted loop playsInline preload="metadata" aria-label={label} className="aspect-[240/426] w-full bg-black object-cover">
            <source src={src} type="video/mp4" />
          </video>
        </div>
      </motion.div>
    </div>
  );
}
