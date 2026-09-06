"use client";

import InstagramPhoneFrame from "@/components/automations/instagram-phone-frame";
import type { LinkButton } from "@/lib/link-buttons";
import { Camera, ChevronLeft, ImageIcon, MessageCircle, Phone, Plus, Video } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  username?: string | null;
  profilePictureUrl?: string | null;
  sendPrivateDm: boolean;
  showOpeningSequence: boolean;
  openingDmText: string;
  openingDmButtonText: string;
  followGateRequired: boolean;
  followRequestDmText: string;
  followRequestButtonText: string;
  message: string;
  linkButtons: LinkButton[];
};

export default function AutomationDetailPhonePreview({
  username,
  profilePictureUrl,
  sendPrivateDm,
  showOpeningSequence,
  openingDmText,
  openingDmButtonText,
  followGateRequired,
  followRequestDmText,
  followRequestButtonText,
  message,
  linkButtons,
}: Props) {
  const handle = username || "instagram";

  return (
    <InstagramPhoneFrame>
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
          <ChevronLeft className="h-5 w-5" />
          <Avatar src={profilePictureUrl} name={handle} size="sm" />
          <p className="min-w-0 flex-1 truncate text-sm font-black">{handle}</p>
          <Phone className="h-5 w-5" />
          <Video className="h-5 w-5" />
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
          {!sendPrivateDm ? (
            <div className="grid h-full place-items-center px-8 text-center">
              <div>
                <MessageCircle className="mx-auto h-8 w-8 text-white/30" />
                <p className="mt-3 text-sm font-black">Direct message is off</p>
                <p className="mt-1 text-xs leading-5 text-white/45">Edit this automation to add a private response.</p>
              </div>
            </div>
          ) : (
            <>
              {showOpeningSequence ? (
                <>
                  <IncomingBubble avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />} text={openingDmText} />
                  <ReplyChip text={openingDmButtonText} />
                  <OutgoingBubble text={openingDmButtonText} />
                </>
              ) : null}

              {followGateRequired ? (
                <>
                  <IncomingBubble avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />} text={followRequestDmText} />
                  <ReplyChip text={followRequestButtonText} />
                  <OutgoingBubble text={followRequestButtonText} />
                </>
              ) : null}

              <IncomingBubble
                avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />}
                text={message || "Your DM message"}
                buttons={linkButtons}
              />
            </>
          )}
        </div>

        <div className="mx-3 mb-3 flex shrink-0 items-center gap-3 rounded-full bg-[#202023] px-3 py-2.5 text-white/40">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#4775ff] text-white"><Camera className="h-4 w-4" /></span>
          <span className="flex-1 text-xs">Message…</span>
          <ImageIcon className="h-5 w-5" />
          <MessageCircle className="h-5 w-5" />
          <Plus className="h-5 w-5" />
        </div>
      </div>
    </InstagramPhoneFrame>
  );
}

function IncomingBubble({ avatar, text, buttons = [] }: { avatar: ReactNode; text: string; buttons?: LinkButton[] }) {
  return (
    <div className="flex items-end gap-2">
      {avatar}
      <div className="w-fit max-w-[82%] overflow-hidden rounded-2xl rounded-bl-sm bg-[#262628] text-[11px] leading-[1.45]">
        <p dir="auto" className="whitespace-pre-wrap break-words px-3 py-2.5">{text}</p>
        {buttons.map((button, index) => (
          <div key={`${button.label}-${index}`} dir="auto" className="border-t border-white/10 px-3 py-2 text-center font-black text-white">
            {button.label || `Link ${index + 1}`}
          </div>
        ))}
      </div>
    </div>
  );
}

function OutgoingBubble({ text }: { text: string }) {
  return <p dir="auto" className="ml-auto w-fit max-w-[74%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#7047ff] to-[#bb28ec] px-3 py-2 text-[11px] leading-4">{text}</p>;
}

function ReplyChip({ text }: { text: string }) {
  return <div dir="auto" className="ml-9 w-fit max-w-[78%] rounded-full bg-[#f1f2f5] px-4 py-2 text-[11px] font-black text-[#3f6fe5]">{text}</div>;
}

function Avatar({ src, name, size }: { src?: string | null; name: string; size: "xs" | "sm" }) {
  const className = size === "xs" ? "h-7 w-7" : "h-9 w-9";
  return (
    <span className={`relative grid ${className} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 text-[10px] font-black uppercase ring-1 ring-white/15`}>
      {src ? <Image src={src} alt={`${name} profile picture`} fill sizes={size === "xs" ? "28px" : "36px"} className="object-cover" unoptimized /> : name.slice(0, 1)}
    </span>
  );
}
