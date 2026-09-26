"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, ChevronLeft, Grid2X2, Heart, MessageCircle, MoreHorizontal, Phone, Send, Smartphone, Video } from "lucide-react";
import { useUi } from "@/components/i18n/use-ui";
import type { WizardData } from "@/hooks/use-wizard";
import { emailRequestMessage } from "@/lib/automation-engagement-settings";
import styles from "./editor-preview.module.css";

export type EditorPreviewMode = "post" | "comments" | "dm";
export default function EditorPreview({ data, mode, onModeChange, username, avatar, source = "COMMENT", interaction, aiDmReply = false }: {
  data: WizardData; mode: EditorPreviewMode; onModeChange: (mode: EditorPreviewMode) => void; username?: string | null; avatar?: string | null;
  source?: "COMMENT" | "STORY" | "DM"; interaction?: string; aiDmReply?: boolean;
}) {
  const tr = useUi(); const reduced = useReducedMotion(); const handle = username?.replace(/^@/, "") || tr("youraccount");
  const avatarNode = <span className={styles.avatar}>{avatar ? <Image src={avatar} alt="" fill sizes="32px" unoptimized /> : handle.slice(0,1).toUpperCase()}</span>;
  const tabs = source === "COMMENT" ? ["post", "comments", "dm"] as const : ["dm"] as const;
  const bubble = (message: string, buttons: string[] = [], outbound = false) => <div className={outbound ? styles.outbound : styles.message}><p dir="auto">{message}</p>{buttons.map((label, index) => <span key={index} dir="auto" className={styles.button}>{label}</span>)}</div>;
  return <section className={styles.preview} aria-label={tr("Instagram live preview")}>
    <header className={styles.heading}><span><Smartphone size={16}/>{tr("Live preview")}</span><div>{tabs.map(tab => <button type="button" key={tab} aria-label={tr(tab === "comments" ? "Comments" : tab === "post" ? "Post" : "DM")} aria-pressed={mode === tab} onClick={() => onModeChange(tab)}>{tab === "post" ? <Grid2X2 size={16}/> : tab === "comments" ? <MessageCircle size={16}/> : <Send size={16}/>}</button>)}</div></header>
    <div className={styles.card}><AnimatePresence mode="wait" initial={false}><motion.div className={styles.screen} key={mode} initial={reduced ? false : {opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduced ? 0 : .15}}>
      <div className={styles.profile}>{mode === "dm" && <ChevronLeft size={18}/>} {avatarNode}<div><strong><bdi>{handle}</bdi></strong><small>{tr(mode === "dm" ? "Active now" : "Original audio")}</small></div>{mode === "dm" ? <><Phone size={17}/><Video size={19}/></> : <MoreHorizontal size={20}/>}</div>
      {mode === "post" || mode === "comments" ? <>
        <div className={styles.media}>{data.post?.media ? <Image src={data.post.media} alt={data.post.caption || tr("Selected Instagram post")} fill sizes="(max-width: 1023px) 360px, 400px" className={styles.postImage} unoptimized /> : <div className={styles.placeholder}>{tr(data.post?.postid === "ANY" ? "Any post or Reel" : "You haven’t picked a post")}</div>}</div>
        <div className={styles.postFooter}><div className={styles.postIcons}><Heart/><MessageCircle/><Send/><Bookmark/></div><p><strong>{handle}</strong> <bdi>{data.post?.caption || tr("Your Instagram caption and automation trigger preview will appear here.")}</bdi></p></div>
        {mode === "comments" && <div className={styles.comments}><h4>{tr("Comments")}</h4><div className={styles.comment}><span className={styles.sampleAvatar}>U</span><div><strong>username</strong><p dir="auto">{data.triggerMode === "ANY_COMMENT" ? tr("This looks amazing!") : data.keywords[0] || tr("your keyword")}</p><small>2h · {tr("Reply")}</small></div><Heart size={13}/></div>{(data.publicReplyEnabled || data.aiReplyEnabled) && <div className={`${styles.comment} ${styles.reply}`}>{avatarNode}<div><strong>{handle}</strong><p dir="auto">{data.aiReplyEnabled ? tr("Thanks for your comment! Happy to help 😊") : [data.publicReply,data.publicReply2,data.publicReply3].find(x=>x.trim())}</p>{data.aiReplyEnabled && <small>{tr("AI reply preview")}</small>}</div></div>}<div className={styles.emojis}>❤️ 🙌 🔥 👏 😢 😍 😮 😂</div><div className={styles.input}>{tr("Add a comment…")}</div></div>}
      </> : <><div className={styles.messages}>
        {interaction && <p className={styles.interaction}>{tr(interaction)}</p>}
        {!data.sendPrivateDm ? <p className={styles.interaction}>{tr("DM is turned off")}</p> : <>
          {data.openingDmEnabled && <>{bubble(data.openingDmText,[data.openingDmButtonText])}{bubble(data.openingDmButtonText,[],true)}</>}
          {data.followGateRequired && <>{bubble(data.followRequestDmText,[tr("Follow"),data.followRequestButtonText])}{bubble(data.followRequestButtonText,[],true)}</>}
          {data.emailCaptureEnabled && <>{bubble(emailRequestMessage(data.emailCapturePrompt || ""))}{bubble("creator@example.com",[],true)}</>}
          {aiDmReply && <p className={styles.interaction}>{tr("AI response enabled")}</p>}
          {data.productCard && data.productImageUrl && <div className={styles.productImage}><Image src={data.productImageUrl} alt={tr("Product image")} fill sizes="280px" unoptimized /></div>}
          {bubble(data.dmMessage || tr("Enter your message here"), aiDmReply ? [] : data.linkButtons.map(b=>b.label || tr("Get the Link")))}
          {data.productCard && data.productSubtitle && <p className={styles.interaction}>{data.productSubtitle}</p>}
          {data.followUpEnabled && <><p className={styles.interaction}>{data.followUpDelayMinutes} {tr("minutes without a reply")}</p>{bubble(data.followUpMessage || "",data.linkButtons.map(b=>b.label))}</>}
        </>}
      </div><div className={styles.composer}>{tr("Message…")}<Send size={18}/></div></>}
    </motion.div></AnimatePresence></div>
    <p className={styles.caption}>{tr(mode === "dm" ? "This is a preview of your automated conversation." : "This is the post people comment on to trigger your automation.")}</p>
  </section>;
}
