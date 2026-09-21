"use client";

import { useEffect, useRef, useState } from "react";
import { revealTransition } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Reply, Send, Users } from "lucide-react";
import { translateUi } from "@/lib/i18n/translate";
import { useI18n } from "@/providers/i18n-provider";

const WORKFLOW_STEPS = [
  { step: "01", icon: MessageCircle, title: "Choose the trigger", copy: "Use a specific keyword like GUIDE, or respond to any eligible comment on the post." },
  { step: "02", icon: Reply, title: "Reply publicly", copy: "AP3K posts one of your saved replies so the commenter knows to check their DMs." },
  { step: "03", icon: Send, title: "Send the DM", copy: "Deliver your message and optional link button automatically while interest is fresh." },
  { step: "04", icon: Users, title: "See what happened", copy: "Keep replies, DMs, automation activity, and captured leads together in AP3K." },
] as const;

const SETUP_STEPS = [
  ["01", "Connect Instagram", "Authorize your professional Instagram account."],
  ["02", "Choose a post + trigger", "Use a keyword or any eligible comment."],
  ["03", "Choose Actions", "Reply to comment, Send a DM, or enable both."],
  ["04", "Activate", "AP3K starts listening and records the activity."],
] as const;

function useActiveStep(length: number) {
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.2),
      { threshold: [0, 0.2] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused || reduceMotion || active >= length - 1) return;
    const timer = window.setTimeout(() => setActive((current) => Math.min(current + 1, length - 1)), 1800);
    return () => window.clearTimeout(timer);
  }, [active, length, paused, reduceMotion, visible]);

  return { root, active, setActive, setPaused, reduceMotion };
}

export function AnimatedWorkflowCards() {
  const { locale } = useI18n();
  const tr = (text: string) => translateUi(text, locale);
  const { root, active, setActive, setPaused, reduceMotion } = useActiveStep(WORKFLOW_STEPS.length);

  return (
    <div
      ref={root}
      className="relative mt-12"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-[8%] right-[8%] top-6 hidden h-px overflow-hidden bg-violet-200 dark:bg-violet-400/15 lg:block">
        <span
          className="block h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-500 origin-left transition-transform duration-content ease-ui-out rtl:origin-right"
          style={{ transform: `scaleX(${(active + 1) / WORKFLOW_STEPS.length})` }}
        />
      </div>
      <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
        {WORKFLOW_STEPS.map(({ step, icon: Icon, title, copy }, index) => {
          const isActive = active === index;
          return (
            <motion.button
              key={title}
              type="button"
              aria-current={isActive ? "step" : undefined}
              onClick={() => setActive(index)}
              onPointerEnter={() => setActive(index)}
              initial={reduceMotion ? false : { y: 12 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={revealTransition(reduceMotion, index * 0.055)}
              className={`group relative h-full overflow-hidden rounded-2xl border bg-white/90 p-6 text-start shadow-surface transition-[border-color,box-shadow] duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500 dark:bg-[#111320] dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] ${isActive ? "border-violet-400 ring-1 ring-violet-400/20 dark:border-violet-300/45" : "border-slate-200/90 hover:border-violet-300 dark:border-violet-300/[0.14] dark:hover:border-violet-300/30"}`}
            >
              <span aria-hidden="true" className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent transition-opacity duration-base dark:via-violet-300 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
              <span className="flex items-center justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-200/80 dark:bg-violet-400/[0.12] dark:text-violet-200 dark:ring-violet-300/20">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.18em] transition-colors duration-base ${isActive ? "border-violet-600 bg-violet-600 text-white" : "border-violet-200/80 bg-violet-50 text-violet-700 dark:border-violet-300/15 dark:bg-violet-300/[0.07] dark:text-violet-200"}`}>
                  {step}
                </span>
              </span>
              <span className="mt-5 block text-lg font-black text-slate-950 dark:text-white">{tr(title)}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300/80">{tr(copy)}</span>
            </motion.button>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-5 flex justify-center gap-2 lg:hidden">
        {WORKFLOW_STEPS.map(({ step }, index) => <span key={step} className={`h-1.5 rounded-full transition-colors duration-base ${active === index ? "w-7 bg-violet-600" : "w-1.5 bg-violet-200 dark:bg-violet-400/25"}`} />)}
      </div>
    </div>
  );
}

export function AnimatedSetupSteps() {
  const { locale } = useI18n();
  const tr = (text: string) => translateUi(text, locale);
  const { root, active, setActive, setPaused, reduceMotion } = useActiveStep(SETUP_STEPS.length);

  return (
    <div
      ref={root}
      className="mt-8 space-y-3"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {SETUP_STEPS.map(([num, title, copy], index) => {
        const isActive = active === index;
        return (
          <motion.button
            key={num}
            type="button"
            aria-current={isActive ? "step" : undefined}
            onClick={() => setActive(index)}
            initial={reduceMotion ? false : { y: 10 }}
            whileInView={reduceMotion ? undefined : { y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={revealTransition(reduceMotion, index * 0.055)}
            className={`flex w-full gap-4 rounded-2xl border bg-white/90 p-4 text-start shadow-sm transition-[border-color,box-shadow] duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-violet-500 dark:bg-card ${isActive ? "border-violet-400 ring-1 ring-violet-400/15 dark:border-violet-300/40" : "border-violet-200/80 hover:border-violet-300 dark:border-white/8"}`}
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black text-white transition-[transform,background-color] duration-base ${isActive ? "bg-violet-700" : "bg-violet-600"}`}>{num}</span>
            <span>
              <span className="block font-black">{tr(title)}</span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{tr(copy)}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
