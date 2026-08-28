"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, Heart, Instagram, MessageCircle, Send, Sparkles, UserRound } from "lucide-react";
import type { ReactNode } from "react";

const spring = { type: "spring" as const, stiffness: 140, damping: 18 };

export default function AutomationFlowDemo() {
  const reduceMotion = useReducedMotion();
  const loop = reduceMotion ? undefined : { duration: 4.8, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className="relative mx-auto w-full max-w-[610px]" aria-label="A comment triggers an automatic reply and direct message">
      <div className="absolute inset-8 rounded-full bg-fuchsia-400/25 blur-[90px]" />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, 0.4, 0] }}
        transition={loop}
        className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-[#0b0b17]/88 p-3 shadow-[0_45px_120px_rgba(30,8,76,0.48)] backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-5"
      >
        <div className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.055] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-ap3k-gradient shadow-ap3k-glow"><Instagram className="h-4 w-4" /></span>
            <div><p className="text-xs font-black">AP3K live campaign</p><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Listening now</p></div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Active
          </span>
        </div>

        <div className="relative mt-3 grid gap-2.5 sm:grid-cols-[1fr_34px_1fr_34px_1fr] sm:items-stretch">
          <FlowCard icon={<UserRound className="h-4 w-4" />} label="1 · Comment" tone="orange">
            <div className="rounded-xl bg-white/[0.07] p-3">
              <p className="text-[10px] font-bold text-white/45">@sarah</p>
              <p className="mt-1 text-sm font-black">“Send me the guide”</p>
              <div className="mt-2 flex gap-3 text-[9px] text-white/35"><span className="flex gap-1"><Heart className="h-3 w-3" /> 12</span><span>Reply</span></div>
            </div>
          </FlowCard>

          <Connector delay={0.45} />

          <FlowCard icon={<Sparkles className="h-4 w-4" />} label="2 · AP3K reacts" tone="pink">
            <div className="space-y-2 text-[10px] font-bold">
              <StatusRow text="Keyword matched" delay={0.8} />
              <StatusRow text="Public reply sent" delay={1.15} />
              <StatusRow text="DM triggered" delay={1.5} />
            </div>
          </FlowCard>

          <Connector delay={1.75} />

          <FlowCard icon={<Send className="h-4 w-4" />} label="3 · Lead captured" tone="violet">
            <div className="rounded-xl bg-violet-400/10 p-3 ring-1 ring-violet-300/15">
              <p className="text-[10px] font-bold text-violet-200">AP3K</p>
              <p className="mt-1 text-xs font-bold leading-5 text-white/85">Here’s the guide you asked for ✨</p>
              <span className="mt-2 inline-flex rounded-lg bg-white px-2.5 py-1 text-[9px] font-black text-violet-700">Open guide</span>
            </div>
          </FlowCard>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-[1.15rem] border border-white/10 bg-white/[0.045] p-2.5 text-center">
          {[['Reply time', '< 3 sec'], ['Manual work', '0'], ['New lead', 'Captured']].map(([label, value]) => (
            <div key={label} className="rounded-xl px-1 py-2"><p className="text-[9px] font-bold uppercase tracking-wider text-white/35">{label}</p><p className="mt-1 text-xs font-black text-white sm:text-sm">{value}</p></div>
          ))}
        </div>
      </motion.div>

      <motion.div animate={reduceMotion ? undefined : { y: [0, -9, 0], rotate: [-2, 1, -2] }} transition={{ ...loop, delay: 0.7 }} className="absolute -left-2 top-24 hidden items-center gap-2 rounded-2xl border border-white/20 bg-white px-3 py-2 text-xs font-black text-slate-950 shadow-xl sm:flex">
        <MessageCircle className="h-4 w-4 text-orange-500" /> New comment
      </motion.div>
      <motion.div animate={reduceMotion ? undefined : { y: [0, 8, 0], rotate: [2, -1, 2] }} transition={{ ...loop, delay: 1.3 }} className="absolute -right-3 bottom-20 hidden items-center gap-2 rounded-2xl border border-emerald-200/30 bg-[#121525] px-3 py-2 text-xs font-black text-white shadow-xl sm:flex">
        <Check className="h-4 w-4 text-emerald-300" /> Lead saved
      </motion.div>
    </div>
  );
}

function FlowCard({ icon, label, tone, children }: { icon: ReactNode; label: string; tone: "orange" | "pink" | "violet"; children: ReactNode }) {
  const toneClass = tone === "orange" ? "bg-orange-400/12 text-orange-200" : tone === "pink" ? "bg-pink-400/12 text-pink-200" : "bg-violet-400/12 text-violet-200";
  return <div className="min-h-[150px] rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-3"><div className="mb-3 flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center rounded-lg ${toneClass}`}>{icon}</span><p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/55">{label}</p></div>{children}</div>;
}

function StatusRow({ text, delay }: { text: string; delay: number }) {
  const reduceMotion = useReducedMotion();
  return <motion.div initial={reduceMotion ? false : { opacity: 0.35, x: -3 }} animate={reduceMotion ? undefined : { opacity: [0.35, 1, 1, 0.35], x: [-3, 0, 0, -3] }} transition={{ duration: 4.8, repeat: Infinity, delay }} className="flex items-center gap-2 rounded-lg bg-white/[0.055] px-2 py-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-300/15 text-emerald-200"><Check className="h-2.5 w-2.5" /></span>{text}</motion.div>;
}

function Connector({ delay }: { delay: number }) {
  const reduceMotion = useReducedMotion();
  return <div className="relative grid place-items-center py-0.5 sm:py-0"><div className="absolute h-full w-px bg-white/10 sm:h-px sm:w-full" /><motion.span initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }} animate={reduceMotion ? undefined : { scale: [0.7, 1, 0.7], opacity: [0, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay }} className="relative z-10 grid h-6 w-6 place-items-center rounded-full border border-white/15 bg-[#171225] text-white/60"><ArrowDown className="h-3 w-3 sm:-rotate-90" /></motion.span></div>;
}
