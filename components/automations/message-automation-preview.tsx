"use client";

import InstagramPhoneFrame from "@/components/automations/instagram-phone-frame";
import type { LinkButton } from "@/lib/link-buttons";
import { AtSign, Camera, ChevronLeft, ImageIcon, Phone, Plus, Send, SmilePlus, Video } from "lucide-react";

type Props = {
  source: "STORY" | "DM";
  step: number;
  trigger: "MENTION" | "REACTION" | "REPLY";
  triggerMode: "SPECIFIC_KEYWORD" | "ANY_MESSAGE";
  keywords: string[];
  message: string;
  linkButtons: LinkButton[];
  followGateRequired: boolean;
  followRequestDmText: string;
  followRequestButtonText: string;
};

export default function MessageAutomationPreview(props: Props) {
  const interaction = props.source === "STORY"
    ? props.trigger === "MENTION" ? "mentioned you in their story" : props.trigger === "REACTION" ? "reacted 🔥 to your story" : "replied to your story"
    : props.triggerMode === "ANY_MESSAGE" ? "sent you a message" : `sent “${props.keywords[0] || "guide"}”`;

  return (
    <section className="mx-auto h-full min-h-0 w-full max-w-[480px]">
      <InstagramPhoneFrame>
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4"><ChevronLeft className="h-5 w-5" /><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 font-black">A</span><p className="min-w-0 flex-1 truncate text-sm font-black">youraccount</p><Phone className="h-5 w-5" /><Video className="h-5 w-5" /></div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
            <div className="mx-auto mb-7 w-fit rounded-full bg-white/[0.07] px-4 py-2 text-[10px] font-bold text-white/60">{interaction}</div>
            {props.source === "STORY" && props.step === 1 ? (
              <div className="mx-auto mt-16 max-w-[250px] rounded-3xl border border-white/10 bg-gradient-to-br from-[#39236c] to-[#d92f88] p-6 text-center shadow-xl">
                {props.trigger === "MENTION" ? <AtSign className="mx-auto h-8 w-8" /> : <SmilePlus className="mx-auto h-8 w-8" />}
                <p className="mt-4 text-lg font-black">Story interaction</p><p className="mt-2 text-xs leading-5 text-white/65">AP3K listens through the official Instagram webhook.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-[10px] font-black">A</span><div className="max-w-[82%] overflow-hidden rounded-2xl rounded-bl-sm bg-[#262628] text-[11px] leading-[1.45]"><p dir="auto" className="whitespace-pre-wrap break-words px-3 py-2.5">{props.message || "Your response message"}</p>{props.linkButtons.map((button, index) => <div key={`${button.label}-${index}`} dir="auto" className="border-t border-white/10 px-3 py-2.5 text-center font-black">{button.label || `Link ${index + 1}`}</div>)}</div></div>
                {props.followGateRequired ? <><div className="flex items-end gap-2 pt-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-[10px] font-black">A</span><div className="max-w-[82%] overflow-hidden rounded-2xl rounded-bl-sm bg-[#262628] text-[11px] leading-[1.45]"><p dir="auto" className="whitespace-pre-wrap px-3 py-2.5">{props.followRequestDmText}</p><div className="border-t border-white/10 px-3 py-2.5 text-center font-black">Follow</div></div></div><div dir="auto" className="ml-9 w-fit max-w-[78%] rounded-full bg-[#f1f2f5] px-4 py-2 text-[10px] font-black text-[#3f6fe5]">{props.followRequestButtonText}</div></> : null}
              </div>
            )}
          </div>
          <div className="mx-3 mb-3 flex items-center gap-3 rounded-full bg-[#202023] px-3 py-2.5 text-white/40"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#4775ff] text-white"><Camera className="h-4 w-4" /></span><span className="flex-1 text-xs">Message…</span><ImageIcon className="h-5 w-5" /><Send className="h-5 w-5" /><Plus className="h-5 w-5" /></div>
        </div>
      </InstagramPhoneFrame>
    </section>
  );
}
