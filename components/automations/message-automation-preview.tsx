"use client";

import { AtSign, Camera, ChevronLeft, ImageIcon, MessageCircle, Plus, Send, SmilePlus } from "lucide-react";
import Image from "next/image";

type Props = {
  source: "STORY" | "DM";
  step: number;
  trigger: "MENTION" | "REACTION" | "REPLY";
  triggerMode: "SPECIFIC_KEYWORD" | "ANY_MESSAGE";
  keywords: string[];
  message: string;
  responseFormat: "TEXT" | "LINK" | "MEDIA";
  ctaButtonTitle: string;
  mediaUrl: string;
  quickReplies: string[];
  followGateRequired: boolean;
  followRequestDmText: string;
  followRequestButtonText: string;
};

export default function MessageAutomationPreview(props: Props) {
  const interaction = props.source === "STORY"
    ? props.trigger === "MENTION" ? "mentioned you in their story" : props.trigger === "REACTION" ? "reacted 🔥 to your story" : "replied to your story"
    : props.triggerMode === "ANY_MESSAGE" ? "sent you a message" : `sent “${props.keywords[0] || "guide"}”`;

  return (
    <section className="mx-auto w-full max-w-[430px]">
      <div className="mb-4 px-1"><p className="text-xs font-black uppercase tracking-[0.18em] text-rf-purple">Live preview</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Trigger and response update as you type.</p></div>
      <div className="rounded-[3.25rem] bg-[#171b24] p-3 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.65)] ring-1 ring-black/20 dark:ring-white/10">
        <div className="flex h-[690px] flex-col overflow-hidden rounded-[2.55rem] bg-[#0e0e0f] text-white">
          <div className="relative flex h-11 items-center justify-between px-7 text-[12px] font-black"><span>9:41</span><span className="absolute left-1/2 top-3 h-5 w-20 -translate-x-1/2 rounded-full bg-black" /><span>••• ▰</span></div>
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4"><ChevronLeft className="h-5 w-5" /><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 font-black">A</span><p className="flex-1 text-sm font-black">youraccount</p><MessageCircle className="h-5 w-5" /></div>

          <div className="flex-1 overflow-hidden px-4 py-5">
            <div className="mx-auto mb-7 w-fit rounded-full bg-white/[0.07] px-4 py-2 text-[10px] font-bold text-white/60">{interaction}</div>
            {props.source === "STORY" && props.step === 1 ? (
              <div className="mx-auto mt-16 max-w-[250px] rounded-3xl border border-white/10 bg-gradient-to-br from-[#39236c] to-[#d92f88] p-6 text-center shadow-xl">
                {props.trigger === "MENTION" ? <AtSign className="mx-auto h-8 w-8" /> : <SmilePlus className="mx-auto h-8 w-8" />}
                <p className="mt-4 text-lg font-black">Story interaction</p><p className="mt-2 text-xs leading-5 text-white/65">AP3K listens through the official Instagram webhook.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-[10px] font-black">A</span><div className="max-w-[82%] overflow-hidden rounded-2xl rounded-bl-sm bg-[#262628] text-[11px] leading-[1.45]">{props.responseFormat === "MEDIA" ? <div className="relative grid h-28 place-items-center bg-white/5 text-white/35">{props.mediaUrl ? <Image src={props.mediaUrl} alt="Message media preview" fill sizes="260px" className="object-cover" unoptimized /> : <ImageIcon className="h-7 w-7" />}</div> : null}<p dir="auto" className="whitespace-pre-wrap px-3 py-2.5">{props.message || "Your response message"}</p>{props.responseFormat === "LINK" ? <div className="border-t border-white/10 px-3 py-2.5 text-center font-black">{props.ctaButtonTitle || "Open link"}</div> : null}</div></div>
                {props.quickReplies.length ? <div className="ml-9 flex flex-wrap gap-1.5">{props.quickReplies.map((chip) => <span key={chip} className="rounded-full border border-violet-500/70 px-3 py-1.5 text-[10px] font-bold text-violet-300">{chip}</span>)}</div> : null}
                {props.followGateRequired ? <div className="flex items-end gap-2 pt-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-[10px] font-black">A</span><div className="max-w-[82%] overflow-hidden rounded-2xl rounded-bl-sm bg-[#262628] text-[11px] leading-[1.45]"><p dir="auto" className="whitespace-pre-wrap px-3 py-2.5">{props.followRequestDmText}</p><div className="border-t border-white/10 px-3 py-2.5 text-center font-black">{props.followRequestButtonText}</div></div></div> : null}
              </div>
            )}
          </div>
          <div className="mx-3 mb-3 flex items-center gap-3 rounded-full bg-[#202023] px-3 py-2.5 text-white/40"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#4775ff] text-white"><Camera className="h-4 w-4" /></span><span className="flex-1 text-xs">Message…</span><ImageIcon className="h-5 w-5" /><Send className="h-5 w-5" /><Plus className="h-5 w-5" /></div>
        </div>
      </div>
    </section>
  );
}
