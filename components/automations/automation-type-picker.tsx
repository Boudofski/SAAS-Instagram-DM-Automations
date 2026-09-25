"use client";

import { UiText } from "@/components/i18n/localized-copy";
import { MessageCircle, MessagesSquare, Sparkles, ShoppingBag } from "lucide-react";
import { revealTransition } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

const TYPES = [
  {
    type: "comment",
    icon: MessageCircle,
    eyebrow: "Posts & Reels",
    title: "Comment automation",
    description: "Reply publicly, send a DM, or do both when someone comments.",
    accent: "from-orange-500 to-pink-500",
  },
  {
    type: "dm",
    icon: MessagesSquare,
    eyebrow: "Inbox",
    title: "DM automation",
    description: "Send a saved response when a new DM contains a keyword—or any message arrives.",
    accent: "from-blue-600 to-cyan-500",
  },
  { type: "ai", icon: Sparkles, eyebrow: "Flow Builder", title: "Automate conversations with AI", description: "Collect information, answer questions, and recommend the right offer in a personal conversation.", accent: "from-violet-600 to-indigo-500" },
  { type: "affiliate", icon: ShoppingBag, eyebrow: "Quick Automation", title: "Send affiliate product links", description: "Send a product card with a photo and affiliate links when someone comments.", accent: "from-violet-600 to-pink-500" },

  {
    type: "story",
    icon: Sparkles,
    eyebrow: "Stories",
    title: "Story automation",
    description: "Respond to mentions, emoji reactions, or text replies in DMs.",
    accent: "from-violet-600 to-fuchsia-500",
  },
] as const;

export default function AutomationTypePicker({ slug }: { slug: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-[calc(100dvh-8rem)] px-1 py-6 text-slate-950 dark:text-white sm:px-4 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <Link href={`/dashboard/${slug}/automation`} className="text-sm font-semibold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
          <UiText>{"← Back to automations"}</UiText></Link>
        <div className="mt-6 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rf-purple"><UiText>{"Create automation"}</UiText></p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl"><UiText>{"What should start the conversation?"}</UiText></h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300"><UiText>{"Choose one starting point. You can fine-tune the trigger, message, and delivery rules next."}</UiText></p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TYPES.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.type}
                initial={reduceMotion ? false : { y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={revealTransition(reduceMotion, index * 0.055)}
              >
                <Link
                  href={`/dashboard/${slug}/automation/new?type=${item.type}`}
                  className="group flex h-full min-h-[230px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,transform,box-shadow] duration-base motion-safe:hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-surface dark:border-white/10 dark:bg-[#111320] dark:hover:border-rf-purple/45"
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"><UiText>{item.eyebrow}</UiText></span>
                  <span className="mt-2 text-xl font-bold tracking-tight"><UiText>{item.title}</UiText></span>
                  <span className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300"><UiText>{item.description}</UiText></span>
                  <span className="mt-5 inline-flex items-center text-sm font-black text-rf-purple"><UiText>{"Build this flow"}</UiText><span className="ms-2 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">→</span></span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
