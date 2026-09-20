"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/providers/i18n-provider";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import VisibleProductVideo from "./visible-product-video";

type Demo = {
  kicker: string;
  title: string;
  body: string;
  bullets: readonly string[];
  src: string;
  poster?: string;
  label: string;
};

export default function FeatureDemos({ demos }: { demos: readonly Demo[] }) {
  const [selected, setSelected] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStart = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const { locale } = useI18n();
  const tr = (text: string) => translateUi(text, locale);
  const demo = demos[selected];

  const select = (next: number) => {
    const normalized = (next + demos.length) % demos.length;
    if (normalized === selected) return;
    const wrapsForward = selected === demos.length - 1 && normalized === 0;
    const wrapsBackward = selected === 0 && normalized === demos.length - 1;
    setDirection(wrapsForward ? 1 : wrapsBackward ? -1 : normalized > selected ? 1 : -1);
    setSelected(normalized);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) >= 45) select(selected + (distance < 0 ? 1 : -1));
  };

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };
  const slide = reduceMotion ? {} : { initial: { opacity: 0, x: direction * 28 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: direction * -22 } };

  return (
    <section id="features" aria-labelledby="feature-demo-title" className="bg-gradient-to-br from-[#5521c8] to-[#7832e3] px-4 py-14 text-white sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mb-10 sm:px-0">
          <div role="tablist" aria-label={tr("Automation demos")} className="mx-auto flex w-max min-w-full justify-start gap-2 sm:w-auto sm:min-w-0 sm:flex-wrap sm:justify-center">
            {demos.map((item, index) => (
              <button
                key={item.src}
                id={`feature-demo-tab-${index}`}
                role="tab"
                type="button"
                aria-selected={selected === index}
                aria-controls="feature-demo-panel"
                onClick={() => select(index)}
                className={`min-h-11 shrink-0 rounded-full border px-5 py-3 text-sm font-bold transition-[background-color,color,border-color,transform,box-shadow] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${selected === index ? "scale-[1.02] border-white bg-white text-[#5521c8] shadow-[0_10px_28px_rgba(31,8,80,0.22)]" : "border-white/40 bg-black/10 text-white hover:-translate-y-0.5 hover:bg-black/20"}`}
              >
                {tr(item.kicker)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={handleTouchEnd}>
          <div id="feature-demo-panel" role="tabpanel" aria-labelledby={`feature-demo-tab-${selected}`} className="grid min-h-[520px] items-center gap-8 overflow-hidden lg:min-h-[540px] lg:grid-cols-2 lg:gap-20">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div key={`copy-${demo.src}`} {...slide} transition={transition} className="text-start">
                <h2 id="feature-demo-title" className="max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">{tr(demo.title)}</h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/90">{tr(demo.body)}</p>
                <ul className="mt-6 space-y-3">
                  {demo.bullets.map((bullet, index) => (
                    <motion.li key={bullet} initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={reduceMotion ? undefined : { opacity: 1, x: 0 }} transition={{ ...transition, delay: reduceMotion ? 0 : 0.08 + index * 0.055 }} className="flex items-start gap-3 text-sm font-semibold">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />{tr(bullet)}
                    </motion.li>
                  ))}
                </ul>
                <Link href={localizePublicPath("/sign-up", locale)} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#5521c8] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  {tr("GET STARTED")}<ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div key={`phone-${demo.src}`} {...slide} transition={transition} className="mx-auto w-[min(64vw,260px)] rounded-[2.5rem] border border-white/25 bg-black p-1.5 shadow-xl">
                <VisibleProductVideo src={demo.src} poster={demo.poster} label={demo.label} className="aspect-[240/426] w-full rounded-[2.1rem] bg-black object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 sm:mt-6">
            <button type="button" onClick={() => select(selected - 1)} aria-label={tr("Previous slide")} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-black/10 transition hover:-translate-y-0.5 hover:bg-black/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <ChevronLeft aria-hidden="true" className="h-5 w-5 rtl:rotate-180" />
            </button>
            <div aria-hidden="true" className="flex items-center gap-2">
              {demos.map((item, index) => <span key={item.src} className={`h-2 rounded-full bg-white transition-all duration-300 ${selected === index ? "w-7" : "w-2 opacity-35"}`} />)}
            </div>
            <button type="button" onClick={() => select(selected + 1)} aria-label={tr("Next slide")} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-black/10 transition hover:-translate-y-0.5 hover:bg-black/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <ChevronRight aria-hidden="true" className="h-5 w-5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
