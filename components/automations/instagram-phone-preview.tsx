"use client";

import type { WizardData, WizardStep } from "@/hooks/use-wizard";
import {
  Bookmark,
  Camera,
  ChevronLeft,
  Heart,
  ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Send,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type PreviewMode = "post" | "comments" | "dm";

type Props = {
  data: WizardData;
  step: WizardStep;
  username?: string | null;
  profilePictureUrl?: string | null;
};

const MODES: Array<{ value: PreviewMode; label: string }> = [
  { value: "post", label: "Post" },
  { value: "comments", label: "Comments" },
  { value: "dm", label: "DM" },
];

export default function InstagramPhonePreview({ data, step, username, profilePictureUrl }: Props) {
  const [mode, setMode] = useState<PreviewMode>(step === 1 ? "post" : step === 2 ? "comments" : "dm");
  const handle = username?.replace(/^@/, "") || "youraccount";

  useEffect(() => {
    setMode(step === 1 ? "post" : step === 2 ? "comments" : "dm");
  }, [step]);

  return (
    <section aria-label="Instagram live preview" className="mx-auto w-full max-w-[430px]">
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rf-purple">Live preview</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">See exactly what people experience.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Updates live
        </span>
      </div>

      <div className="rounded-[3.25rem] bg-[#171b24] p-3 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.65)] ring-1 ring-black/20 dark:ring-white/10">
        <div className="relative h-[690px] overflow-hidden rounded-[2.55rem] bg-[#0e0e0f] text-white">
          <PhoneStatus />
          {mode === "dm" ? (
            <DmPreview data={data} handle={handle} profilePictureUrl={profilePictureUrl} />
          ) : (
            <PostPreview
              data={data}
              handle={handle}
              profilePictureUrl={profilePictureUrl}
              showComments={mode === "comments"}
            />
          )}
        </div>
      </div>

      <div className="mx-auto mt-4 grid w-fit grid-cols-3 rounded-full bg-slate-200/80 p-1 dark:bg-white/10">
        {MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setMode(item.value)}
            aria-pressed={mode === item.value}
            className={[
              "min-w-24 rounded-full px-4 py-2 text-xs font-black transition-all",
              mode === item.value
                ? "bg-white text-slate-950 shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function PhoneStatus() {
  return (
    <div className="flex h-11 items-center justify-between px-7 text-[12px] font-black">
      <span>9:41</span>
      <span className="absolute left-1/2 top-3 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <span className="flex items-end gap-px" aria-hidden="true">
          {[5, 8, 11, 14].map((height) => <i key={height} className="w-[3px] rounded-sm bg-white" style={{ height }} />)}
        </span>
        <span className="h-2.5 w-4 rounded-sm border border-white/80" />
      </span>
    </div>
  );
}

function PostPreview({ data, handle, profilePictureUrl, showComments }: { data: WizardData; handle: string; profilePictureUrl?: string | null; showComments: boolean }) {
  const sampleComment = data.triggerMode === "ANY_COMMENT"
    ? "This looks amazing!"
    : data.keywords[0] || "guide";
  const reply = [data.publicReply, data.publicReply2, data.publicReply3].find((item) => item.trim()) || "Thanks! Please see DMs.";

  return (
    <div className="relative flex h-[646px] flex-col">
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <ChevronLeft className="h-5 w-5" />
        <div className="flex-1 text-center">
          <p className="text-[10px] font-bold uppercase text-white/45">{handle}</p>
          <p className="text-sm font-black">Posts</p>
        </div>
        <span className="w-5" />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar src={profilePictureUrl} name={handle} size="sm" />
        <span className="min-w-0 flex-1 truncate text-xs font-black">{handle}</span>
        <MoreHorizontal className="h-5 w-5" />
      </div>

      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-[#24104b] via-[#5119a8] to-[#ff3d86]">
        {data.post?.media && data.post.media.startsWith("http") ? (
          <Image
            src={data.post.media}
            alt={data.post.caption?.trim() || "Selected Instagram post"}
            fill
            sizes="(max-width: 1024px) 90vw, 390px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/15 backdrop-blur"><ImageIcon className="h-7 w-7" /></div>
              <p className="mt-5 text-2xl font-black tracking-tight">{data.post?.postid === "ANY" ? "Any post or Reel" : "Choose a post"}</p>
              <p className="mt-2 text-xs leading-5 text-white/65">Your selected Instagram media appears here instantly.</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-4"><Heart className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Send className="h-5 w-5" /><Bookmark className="ml-auto h-5 w-5" /></div>
        <p className="mt-3 line-clamp-3 text-xs leading-4"><strong>{handle}</strong> {data.post?.caption || "Your Instagram caption and automation trigger preview will appear here."}</p>
        <p className="mt-2 text-[11px] text-white/45">View all comments</p>
      </div>

      {showComments && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex h-[390px] flex-col rounded-t-[2rem] bg-[#252525] shadow-2xl">
          <span className="mx-auto mt-3 h-1 w-11 rounded-full bg-white/55" />
          <div className="flex items-center border-b border-white/10 px-5 py-4">
            <p className="flex-1 text-center text-sm font-black">Comments</p><Send className="h-5 w-5" />
          </div>
          <div className="space-y-5 p-5">
            <Comment avatar="U" username="username" text={sampleComment} />
            {data.publicReplyEnabled ? <Comment profilePictureUrl={profilePictureUrl} avatar={handle} username={handle} text={reply} /> : null}
          </div>
          <div className="mt-auto px-5 pb-3">
            <div className="mb-4 flex justify-between text-lg"><span>❤️</span><span>🙌</span><span>🔥</span><span>👏</span><span>🥹</span><span>😍</span><span>😂</span></div>
            <div className="flex items-center gap-3"><Avatar src={profilePictureUrl} name={handle} size="sm" /><div className="flex-1 rounded-full border border-white/15 px-4 py-2 text-[11px] text-white/35">Add a comment for {handle}…</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

function DmPreview({ data, handle, profilePictureUrl }: { data: WizardData; handle: string; profilePictureUrl?: string | null }) {
  return (
    <div className="flex h-[646px] flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <ChevronLeft className="h-5 w-5" />
        <Avatar src={profilePictureUrl} name={handle} size="sm" />
        <p className="min-w-0 flex-1 truncate text-sm font-black">{handle}</p>
        <Phone className="h-5 w-5" /><Video className="h-5 w-5" />
      </div>

      <div className="flex-1 space-y-3 overflow-hidden px-4 py-5">
        {!data.sendPrivateDm ? (
          <div className="grid h-full place-items-center px-8 text-center">
            <div><MessageCircle className="mx-auto h-8 w-8 text-white/30" /><p className="mt-3 text-sm font-black">Direct message is off</p><p className="mt-1 text-xs leading-5 text-white/45">Enable “Send a DM” to preview the private conversation.</p></div>
          </div>
        ) : (
          <>
            <IncomingBubble avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />} text={data.openingDmText || "Your opening DM"} button={data.openingDmButtonText || "Continue"} />
            <OutgoingBubble text={data.openingDmButtonText || "Continue"} />
            {data.followGateRequired ? (
              <>
                <IncomingBubble avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />} text={data.followRequestDmText || "Follow this account to receive the link."} button={data.followRequestButtonText || "Following"} />
                <OutgoingBubble text={data.followRequestButtonText || "Following"} />
              </>
            ) : null}
            <IncomingBubble
              avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />}
              text={data.dmMessage || "Your final message"}
              button={data.responseFormat === "LINK" ? data.ctaButtonTitle || "Open link" : undefined}
              media={data.responseFormat === "MEDIA"}
            />
            {data.quickReplies.length > 0 ? (
              <div className="ml-10 flex flex-wrap gap-1.5">
                {data.quickReplies.map((item) => <span key={item} className="rounded-full border border-[#6d5dfc] px-3 py-1.5 text-[10px] font-bold text-[#a9a0ff]">{item}</span>)}
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="mx-3 mb-3 flex items-center gap-3 rounded-full bg-[#202023] px-3 py-2.5 text-white/40">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#4775ff] text-white"><Camera className="h-4 w-4" /></span>
        <span className="flex-1 text-xs">Message…</span><ImageIcon className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Plus className="h-5 w-5" />
      </div>
    </div>
  );
}

function IncomingBubble({ avatar, text, button, media }: { avatar: React.ReactNode; text: string; button?: string; media?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      {avatar}
      <div className="max-w-[82%] overflow-hidden rounded-2xl rounded-bl-sm bg-[#262628] text-[11px] leading-[1.45]">
        {media ? <div className="grid h-24 place-items-center bg-white/5 text-white/35"><ImageIcon className="h-6 w-6" /></div> : null}
        <p dir="auto" className="whitespace-pre-wrap px-3 py-2.5">{text}</p>
        {button ? <div className="border-t border-white/10 px-3 py-2 text-center font-black text-white">{button}</div> : null}
      </div>
    </div>
  );
}

function OutgoingBubble({ text }: { text: string }) {
  return <p dir="auto" className="ml-auto max-w-[74%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#7047ff] to-[#bb28ec] px-3 py-2 text-[11px] leading-4">{text}</p>;
}

function Comment({ avatar, username, text, profilePictureUrl }: { avatar: string; username: string; text: string; profilePictureUrl?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar src={profilePictureUrl} name={avatar} size="sm" />
      <div className="min-w-0 flex-1 text-[11px] leading-4"><p><strong>{username}</strong> <span className="text-white/45">Now</span></p><p className="break-words">{text}</p><p className="mt-1 text-white/35">Reply</p></div>
      <Heart className="mt-2 h-4 w-4 text-white/45" />
    </div>
  );
}

function Avatar({ src, name, size }: { src?: string | null; name: string; size: "xs" | "sm" }) {
  const className = size === "xs" ? "h-7 w-7" : "h-9 w-9";
  return (
    <span className={`relative grid ${className} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 text-[10px] font-black uppercase ring-1 ring-white/15`}>
      {src ? <Image src={src} alt={`${name} profile picture`} fill sizes={size === "xs" ? "28px" : "36px"} className="object-cover" unoptimized /> : name.slice(0, 1)}
    </span>
  );
}
