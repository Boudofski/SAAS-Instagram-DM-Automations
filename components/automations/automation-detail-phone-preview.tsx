"use client";

import InstagramPhoneFrame from "@/components/automations/instagram-phone-frame";
import type { LinkButton } from "@/lib/link-buttons";
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
import type { ReactNode } from "react";
import { useState } from "react";

type PreviewMode = "post" | "comments" | "dm";

type Props = {
  username?: string | null;
  profilePictureUrl?: string | null;
  isCommentAutomation: boolean;
  post?: { media?: string | null; caption?: string | null; postid?: string | null } | null;
  triggerComment: string;
  publicReplyEnabled: boolean;
  publicReply: string;
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

const COMMENT_MODES: Array<{ value: PreviewMode; label: string }> = [
  { value: "post", label: "Post" },
  { value: "comments", label: "Comments" },
  { value: "dm", label: "DM" },
];

const DM_MODES: Array<{ value: PreviewMode; label: string }> = [{ value: "dm", label: "DM" }];

export default function AutomationDetailPhonePreview(props: Props) {
  const [mode, setMode] = useState<PreviewMode>(props.isCommentAutomation ? "post" : "dm");
  const handle = props.username?.replace(/^@/, "") || "instagram";
  const modes = props.isCommentAutomation ? COMMENT_MODES : DM_MODES;
  const activeIndex = Math.max(0, modes.findIndex((item) => item.value === mode));

  return (
    <section aria-label="Instagram automation preview" className="mx-auto flex h-full min-h-0 w-full max-w-[480px] flex-col">
      <div className="min-h-0 flex-1">
        <InstagramPhoneFrame>
          <div key={mode} className="h-full animate-[ap3kDashboardRise_0.22s_ease-out_both]">
            {mode === "dm" ? (
              <DmPreview {...props} handle={handle} />
            ) : (
              <PostPreview
                handle={handle}
                profilePictureUrl={props.profilePictureUrl}
                post={props.post}
                triggerComment={props.triggerComment}
                publicReplyEnabled={props.publicReplyEnabled}
                publicReply={props.publicReply}
                showComments={mode === "comments"}
              />
            )}
          </div>
        </InstagramPhoneFrame>
      </div>

      <div className="relative mx-auto mt-3 grid w-full max-w-[410px] shrink-0 rounded-full bg-slate-200/80 p-1 dark:bg-white/10" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}>
        <span
          aria-hidden="true"
          className="absolute bottom-1 top-1 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out"
          style={{ left: 4, width: `calc((100% - 8px) / ${modes.length})`, transform: `translateX(${activeIndex * 100}%)` }}
        />
        {modes.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setMode(item.value)}
            aria-pressed={mode === item.value}
            className={[
              "relative z-10 rounded-full px-3 py-2 text-xs font-black transition-colors duration-300 sm:px-4",
              mode === item.value
                ? "text-slate-950"
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

function PostPreview({
  handle,
  profilePictureUrl,
  post,
  triggerComment,
  publicReplyEnabled,
  publicReply,
  showComments,
}: {
  handle: string;
  profilePictureUrl?: string | null;
  post?: Props["post"];
  triggerComment: string;
  publicReplyEnabled: boolean;
  publicReply: string;
  showComments: boolean;
}) {
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
        <ChevronLeft className="h-5 w-5" />
        <div className="flex-1 text-center">
          <p className="text-[10px] font-bold uppercase text-white/45">{handle}</p>
          <p className="text-sm font-black">Posts</p>
        </div>
        <span className="w-5" />
      </div>

      <div className="flex shrink-0 items-center gap-3 px-4 py-3">
        <Avatar src={profilePictureUrl} name={handle} size="sm" />
        <span className="min-w-0 flex-1 truncate text-xs font-black">{handle}</span>
        <MoreHorizontal className="h-5 w-5" />
      </div>

      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#24104b] via-[#5119a8] to-[#ff3d86]">
        {post?.media?.startsWith("http") ? (
          <Image
            src={post.media}
            alt={post.caption?.trim() || "Selected Instagram post"}
            fill
            sizes="(max-width: 1024px) 90vw, 390px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/15 backdrop-blur"><ImageIcon className="h-7 w-7" /></div>
              <p className="mt-5 text-2xl font-black tracking-tight">{post?.postid === "ANY" ? "Any post or Reel" : "Instagram post"}</p>
              <p className="mt-2 text-xs leading-5 text-white/65">This automation listens for comments on the selected media.</p>
            </div>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        <div className="flex items-center gap-4"><Heart className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Send className="h-5 w-5" /><Bookmark className="ml-auto h-5 w-5" /></div>
        <p dir="auto" className="mt-3 line-clamp-3 text-xs leading-4"><strong>{handle}</strong> {post?.caption || "Your Instagram post caption appears here."}</p>
        <p className="mt-2 text-[11px] text-white/45">View all comments</p>
      </div>

      {showComments ? (
        <div className="absolute inset-x-0 bottom-0 z-10 flex h-[390px] flex-col rounded-t-[2rem] bg-[#252525] shadow-[0_-24px_60px_rgba(0,0,0,0.45)]">
          <span className="mx-auto mt-3 h-1 w-11 rounded-full bg-white/55" />
          <div className="flex items-center border-b border-white/10 px-5 py-4">
            <p className="flex-1 text-center text-sm font-black">Comments</p>
            <Send className="h-5 w-5" />
          </div>
          <div className="space-y-4 overflow-y-auto p-5">
            <Comment avatar="U" username="username" text={triggerComment} />
            {publicReplyEnabled ? <div className="ml-8 border-l border-white/10 pl-3"><Comment profilePictureUrl={profilePictureUrl} avatar={handle} username={handle} text={publicReply} /></div> : null}
          </div>
          <div className="mt-auto px-5 pb-3">
            <div className="mb-4 flex justify-between text-lg"><span>❤️</span><span>🙌</span><span>🔥</span><span>👏</span><span>🥹</span><span>😍</span><span>😂</span></div>
            <div className="flex items-center gap-3"><Avatar src={profilePictureUrl} name={handle} size="sm" /><div className="flex-1 rounded-full border border-white/15 px-4 py-2 text-[11px] text-white/35">Add a comment for {handle}…</div></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DmPreview({
  handle,
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
}: Props & { handle: string }) {
  return (
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
            <div><MessageCircle className="mx-auto h-8 w-8 text-white/30" /><p className="mt-3 text-sm font-black">Direct message is off</p><p className="mt-1 text-xs leading-5 text-white/45">Edit this automation to add a private response.</p></div>
          </div>
        ) : (
          <>
            {showOpeningSequence ? <><IncomingBubble avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />} text={openingDmText} /><ReplyChip text={openingDmButtonText} /><OutgoingBubble text={openingDmButtonText} /></> : null}
            {followGateRequired ? <><IncomingBubble avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />} text={followRequestDmText} buttons={[{ label: "Follow", url: `https://www.instagram.com/${handle}/` }]} /><ReplyChip text={followRequestButtonText} /><OutgoingBubble text={followRequestButtonText} /></> : null}
            <IncomingBubble avatar={<Avatar src={profilePictureUrl} name={handle} size="xs" />} text={message || "Your DM message"} buttons={linkButtons} />
          </>
        )}
      </div>

      <div className="mx-3 mb-3 flex shrink-0 items-center gap-3 rounded-full bg-[#202023] px-3 py-2.5 text-white/40">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#4775ff] text-white"><Camera className="h-4 w-4" /></span>
        <span className="flex-1 text-xs">Message…</span><ImageIcon className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Plus className="h-5 w-5" />
      </div>
    </div>
  );
}

function IncomingBubble({ avatar, text, buttons = [] }: { avatar: ReactNode; text: string; buttons?: LinkButton[] }) {
  return <div className="flex items-end gap-2">{avatar}<div className="w-fit max-w-[82%] overflow-hidden rounded-2xl rounded-bl-sm bg-[#262628] text-[11px] leading-[1.45]"><p dir="auto" className="whitespace-pre-wrap break-words px-3 py-2.5">{text}</p>{buttons.map((button, index) => <div key={`${button.label}-${index}`} dir="auto" className="border-t border-white/10 px-3 py-2 text-center font-black text-white">{button.label || `Link ${index + 1}`}</div>)}</div></div>;
}

function OutgoingBubble({ text }: { text: string }) {
  return <p dir="auto" className="ml-auto w-fit max-w-[74%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#7047ff] to-[#bb28ec] px-3 py-2 text-[11px] leading-4">{text}</p>;
}

function ReplyChip({ text }: { text: string }) {
  return <div dir="auto" className="ml-9 w-fit max-w-[78%] rounded-full bg-[#f1f2f5] px-4 py-2 text-[11px] font-black text-[#3f6fe5]">{text}</div>;
}

function Comment({ avatar, username, text, profilePictureUrl }: { avatar: string; username: string; text: string; profilePictureUrl?: string | null }) {
  return <div className="flex items-start gap-3"><Avatar src={profilePictureUrl} name={avatar} size="sm" /><div className="min-w-0 flex-1 text-[11px] leading-4"><p><strong>{username}</strong> <span className="text-white/45">Now</span></p><p dir="auto" className="break-words">{text}</p><p className="mt-1 text-white/35">Reply</p></div><Heart className="mt-2 h-4 w-4 text-white/45" /></div>;
}

function Avatar({ src, name, size }: { src?: string | null; name: string; size: "xs" | "sm" }) {
  const className = size === "xs" ? "h-7 w-7" : "h-9 w-9";
  return <span className={`relative grid ${className} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 text-[10px] font-black uppercase ring-1 ring-white/15`}>{src ? <Image src={src} alt={`${name} profile picture`} fill sizes={size === "xs" ? "28px" : "36px"} className="object-cover" unoptimized /> : name.slice(0, 1)}</span>;
}
