"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Clock3, Grid2X2, Loader2, Mail, MessageCircle, MoreVertical, Plus, RefreshCw, Target, Text, UserRoundCheck, X } from "lucide-react";
import type { WizardData } from "@/hooks/use-wizard";
import { useUi } from "@/components/i18n/use-ui";
import { FOLLOW_UP_DELAYS } from "@/lib/automation-engagement-settings";
import { PublicReplyComposer, MessageCopyComposer } from "./copy-composer";
import { DEFAULT_COMMENT_PROMPT, DEFAULT_COMMENT_ONLY_PROMPT, PUBLIC_REPLY_LIMITS } from "@/lib/automation-copy";
import { EditorSelect } from "./editor-select";
import MessageResponseEditor from "./message-response-editor";
import ProductCardEditor from "./product-card-editor";
import EditorLayout, { EditorGroup, EditorRow, EditorSwitch, editorStyles as s } from "./editor-layout";
import EditorPreview, { type EditorPreviewMode } from "./editor-preview";

export type EditorPost = { id: string; caption?: string; media_url?: string; thumbnail_url?: string; media_type: string; timestamp?: string };
export type CommentEditorProps = {
  integrationId?: string; slug: string; data: WizardData; update: (value: Partial<WizardData>) => void; onSave: (active: boolean) => void;
  saving: boolean; error: string | null; editingActive: boolean; posts: EditorPost[]; postsLoading: boolean; postsFetching: boolean;
  refreshPosts: () => void; username?: string | null; avatar?: string | null; connected: boolean; accountLoading: boolean; accountError: boolean;
  retryAccount: () => void; postsError?: string | null; followUpsReady: boolean; aiAvailable: boolean; paid: boolean; commentOnly: boolean;
};

export default function CommentEditor(p: CommentEditorProps) {
  const tr = useUi(); const { data, update } = p;
  const [openTrigger, setOpenTrigger] = useState<string | null>("post");
  const [openMessage, setOpenMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorPreviewMode>("post");
  const [commentPreview, setCommentPreview] = useState("");
  const [messagePreview, setMessagePreview] = useState<string | null>(null);
  const [dmSettings, setDmSettings] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [postQuery, setPostQuery] = useState("");
  const toggleTrigger = (key: string) => { setOpenTrigger(v=>v === key ? null : key); setMode(key === "post" ? "post" : "comments"); };
  const toggleMessage = (key: string) => { setOpenMessage(v=>v === key ? null : key); setMode("dm"); };
  const add = (key: string, values: Partial<WizardData>) => { update({sendPrivateDm:true, ...values}); setOpenMessage(key); setMode("dm"); };
  const addKeyword = () => { const value = keyword.trim(); if (value && !data.keywords.some(w=>w.toLowerCase() === value.toLowerCase())) update({keywords:[...data.keywords,value]}); setKeyword(""); };
  const selectedAny = data.post?.postid === "ANY";
  const replies = data.commentReplies ?? [data.publicReply,data.publicReply2,data.publicReply3].filter(Boolean);
  const context = { integrationId:p.integrationId || "", available:p.aiAvailable, caption:data.post?.caption, sendDm:data.sendPrivateDm, openingDm:data.openingDmEnabled, hasButtons:data.messageFormat !== "TEXT" };
  const publicOn = data.publicReplyEnabled || data.aiReplyEnabled;
  const format = data.productCard ? "PRODUCT_CARD" : data.messageFormat === "TEXT" ? "TEXT" : "LINK";
  const posts = [...p.posts].sort((a,b)=>new Date(b.timestamp || 0).getTime()-new Date(a.timestamp || 0).getTime()).filter(post=>!postQuery || `${post.caption || ""} ${post.id}`.toLowerCase().includes(postQuery.toLowerCase()));
  const field = (label: string, key: "openingDmText" | "followRequestDmText" | "emailCapturePrompt" | "followUpMessage", rows = 4) => <label className={s.field}>{tr(label)}<textarea value={data[key] || ""} onFocus={()=>setMode("dm")} maxLength={640} rows={rows} dir="auto" onChange={e=>update({[key]:e.target.value})}/></label>;
  const buttonField = (label: string,key:"openingDmButtonText"|"followRequestButtonText") => <label className={s.field}>{tr(label)}<input value={data[key]} maxLength={20} dir="auto" onChange={e=>update({[key]:e.target.value})}/></label>;

  return <EditorLayout slug={p.slug} name={data.campaignName} onNameChange={campaignName=>update({campaignName})} active={p.editingActive} saving={p.saving} onSave={p.onSave} error={p.error} accountName={p.username || undefined}
    preview={<EditorPreview commentPreview={commentPreview} data={{...data,dmMessage:messagePreview ?? data.dmMessage,linkButtons:format === "TEXT" ? [] : data.linkButtons}} mode={mode} onModeChange={setMode} username={p.username} avatar={p.avatar}/> }>
    <EditorGroup title="Setup Triggers and Public Reply">
      <EditorRow title="Post" summary={tr(selectedAny ? "Any post" : data.post ? "1 post selected" : "Select post")} icon={<Grid2X2/>} open={openTrigger === "post"} onOpen={()=>toggleTrigger("post")}
        controls={<EditorSelect label="Post scope" value={selectedAny ? "ANY" : "SPECIFIC"} onChange={value=>{update({post:value === "ANY" ? {postid:"ANY",caption:tr("Any post - triggers on all Instagram posts"),media:"",mediaType:"IMAGE"} : null});setOpenTrigger("post");setMode("post");}} options={[{value:"SPECIFIC",label:"a specific post or reel"},{value:"ANY",label:"Any post"}]}/>}>
        {p.accountLoading || p.postsLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin" aria-label={tr("Loading posts")}/></div> : p.accountError ? <div role="alert"><p>{tr("Your account could not be loaded. Please try again.")}</p><button type="button" onClick={p.retryAccount} className={s.publish}>{tr("Try again")}</button></div> : !p.connected ? <p>{tr("Connect Instagram first")} <Link className="text-violet-500 underline" href={`/dashboard/${p.slug}/integrations`}>{tr("Connect Instagram")}</Link></p> : selectedAny ? <p className={s.hint}>{tr("Listen on every post and Reel.")}</p> : <>
          <div className={s.postActions}><input aria-label={tr("Search posts")} placeholder={tr("Search posts")} className="min-w-0 rounded-lg bg-transparent px-2 py-1 text-xs" value={postQuery} onChange={e=>setPostQuery(e.target.value)}/><button type="button" disabled={p.postsFetching} onClick={p.refreshPosts}><RefreshCw size={14} className={p.postsFetching ? "animate-spin" : ""}/>{tr("Refresh")}</button></div>
          <div className={s.postStrip} role="group" aria-label={tr("Choose a specific post or Reel")}>{posts.map(post=>{
            const media = post.media_type === "VIDEO" ? post.thumbnail_url || post.media_url : post.media_url || post.thumbnail_url;
            return <button type="button" key={post.id} aria-label={`${tr("Select post")} ${post.caption || post.id}`} aria-pressed={data.post?.postid === post.id} onClick={()=>{update({post:{postid:post.id,caption:post.caption,media:media || "",mediaType:post.media_type === "VIDEO" ? "VIDEO" : post.media_type === "CAROUSEL_ALBUM" ? "CAROUSEL_ALBUM" : "IMAGE"}});setMode("post");}} className={`${s.postTile} ${data.post?.postid === post.id ? s.postSelected : ""}`}>{media ? <Image src={media} alt={post.caption || tr("Instagram post")} fill sizes="(min-width:1600px) 200px,155px" unoptimized /> : <Grid2X2 className="m-auto"/>}<span>{data.post?.postid === post.id ? <Check size={22}/> : <MoreVertical size={21}/>}</span></button>;
          })}</div>{!posts.length && <p className={s.hint}>{tr(p.posts.length ? "No posts match your search." : "No media loaded yet. Click Refresh posts, reconnect Instagram, or use Any post.")}</p>}
        </>}{p.postsError && <p role="alert" className={s.error}>{p.postsError}</p>}
      </EditorRow>
      <EditorRow title="Trigger" summary={data.triggerMode === "ANY_COMMENT" ? tr("Any comment") : `${data.keywords.length} ${tr("keywords")}`} icon={<Target/>} open={openTrigger === "trigger"} onOpen={()=>toggleTrigger("trigger")}
        controls={<EditorSelect label="Trigger type" value={data.triggerMode} onChange={value=>{update({triggerMode:value as WizardData["triggerMode"]});setOpenTrigger("trigger");setMode("comments");}} options={[{value:"SPECIFIC_KEYWORD",label:"a specific word (s)"},{value:"ANY_COMMENT",label:"Any comment"}]}/>}>
        {data.triggerMode === "SPECIFIC_KEYWORD" ? <><div className={s.chips}>{data.keywords.map(word=><span key={word}><bdi>{word}</bdi><button type="button" aria-label={`${tr("Remove keyword")} ${word}`} onClick={()=>update({keywords:data.keywords.filter(w=>w!==word)})}><X size={13}/></button></span>)}<input aria-label={tr("Add keyword")} placeholder={tr("Add keyword")} value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>{if(e.key === "Enter"){e.preventDefault();addKeyword();}}}/><button type="button" aria-label={tr("Add keyword")} onClick={addKeyword}><Plus size={16}/></button></div><p className={`${s.hint} mt-2`}>{tr("Press Enter to add keyword")}</p><div className={s.settingLine}><strong>{tr("Keyword matching")}</strong><EditorSelect label="Keyword matching" value={data.matchingMode} onChange={value=>update({matchingMode:value as "EXACT"|"CONTAINS"})} options={[{value:"CONTAINS",label:"Contains keyword"},{value:"EXACT",label:"Exact match"}]}/></div></> : <p className={s.hint}>{tr("Reply to any eligible comment on the selected posts.")}</p>}
      </EditorRow>
      <EditorRow title="Public comment reply" summary={publicOn ? data.aiReplyEnabled ? tr("AI auto reply") : `${replies.length} ${tr("replies")}` : undefined} icon={<MessageCircle/>} open={openTrigger === "reply"} onOpen={()=>toggleTrigger("reply")} controls={<><EditorSelect label="Public reply type" value={data.aiReplyEnabled ? "AI" : "SAVED"} onChange={value=>{update({aiReplyEnabled:value === "AI",publicReplyEnabled:value === "SAVED",...(value === "AI" && !data.aiReplyInstructions.trim() ? {aiReplyInstructions:tr(data.sendPrivateDm ? DEFAULT_COMMENT_PROMPT : DEFAULT_COMMENT_ONLY_PROMPT)} : {})});setCommentPreview("");setOpenTrigger("reply");setMode("comments");}} options={[{value:"SAVED",label:"Manual"},{value:"AI",label:"AI",disabled:!p.aiAvailable && !data.aiReplyEnabled}]}/><EditorSwitch label="Public comment reply" checked={publicOn} onChange={enabled=>{update({publicReplyEnabled:enabled,aiReplyEnabled:false});setOpenTrigger(enabled ? "reply" : null);setMode("comments");}}/></>}>
        {publicOn ? <><PublicReplyComposer replies={replies} onRepliesChange={next=>{update({commentReplies:next,publicReply:next[0] || "",publicReply2:next[1] || "",publicReply3:next[2] || ""});setCommentPreview(next[0] || "");}} ai={data.aiReplyEnabled} prompt={data.aiReplyInstructions} onPromptChange={aiReplyInstructions=>update({aiReplyInstructions})} context={context} onPreview={setCommentPreview}/>
        <div className={s.settingLine}><div><strong>{tr("Reply limit")}</strong><p className={s.hint}>{tr("Maximum public replies per post in a rolling 7 days. DMs continue when the limit is reached.")}</p></div><EditorSelect label="Reply limit" value={String(data.publicReplyLimit || 0)} onChange={value=>update({publicReplyLimit:Number(value)})} options={PUBLIC_REPLY_LIMITS.map(value=>({value:String(value),label:value ? tr("Limited to {count}/post").replace("{count}",String(value)) : tr("Unlimited")}))}/></div></> : <p className={s.hint}>{tr("Enable Public comment reply to add a response.")}</p>}
        {!p.paid && <p className={`${s.hint} mt-3`}><Link href={`/dashboard/${p.slug}/billing`} className={s.textAction}>{tr("Upgrade to Pro for AI generation")}</Link></p>}
      </EditorRow>
    </EditorGroup>
    <EditorGroup title="Setup Direct Message" action={<div className={s.settingsMenu}><button type="button" aria-label={tr("Message settings")} aria-expanded={dmSettings} onClick={()=>setDmSettings(!dmSettings)}><MoreVertical size={19}/></button>{dmSettings && <div className={s.settingsPanel}><div><strong>{tr("Disable direct message")}</strong><p className={s.hint}>{tr("When disabled, only the public comment reply works.")}</p></div><EditorSwitch label="Disable direct message" checked={!data.sendPrivateDm} disabled={p.commentOnly} onChange={disabled=>{update({sendPrivateDm:!disabled,...(disabled ? {followGateRequired:false,emailCaptureEnabled:false,followUpEnabled:false} : {})});setMode("dm");}}/></div>}</div>}>
      {p.commentOnly ? <p className={s.hint}>{tr("DMs are disabled for this review mode. This mode tests comment replies and lead tracking.")}</p> : <>
        {data.sendPrivateDm && data.openingDmEnabled && <EditorRow title="Opener message" summary={tr("text with button")} icon={<Mail/>} open={openMessage === "opening"} onOpen={()=>toggleMessage("opening")} onRemove={()=>update({openingDmEnabled:false,followGateRequired:false,emailCaptureEnabled:false,followUpEnabled:false})}>{field("Opening message","openingDmText")}{buttonField("Continue quick reply","openingDmButtonText")}</EditorRow>}
        {data.sendPrivateDm && data.followGateRequired && <EditorRow title="Ask to follow" icon={<UserRoundCheck/>} open={openMessage === "follow"} onOpen={()=>toggleMessage("follow")} onRemove={()=>update({followGateRequired:false})}>{field("Follow request DM","followRequestDmText")}{buttonField("Verification button","followRequestButtonText")}<p className={s.hint}>{tr("Opening DM is enabled automatically. People who already follow skip this step.")}</p></EditorRow>}
        {data.sendPrivateDm && data.emailCaptureEnabled && <EditorRow title="Collect info" summary={tr("Email")} icon={<Mail/>} open={openMessage === "email"} onOpen={()=>toggleMessage("email")} onRemove={()=>update({emailCaptureEnabled:false})}>{field("Email request","emailCapturePrompt")}<p className={s.hint}>{tr("Saved to Contacts. AP3K adds instructions to reply SKIP or STOP. Sharing an email does not subscribe someone to marketing emails.")}</p></EditorRow>}
        <EditorRow title="Message" summary={!data.sendPrivateDm ? tr("Off") : undefined} icon={<Text/>} open={openMessage === "message"} onOpen={()=>toggleMessage("message")} controls={<EditorSelect label="Message format" value={format} onChange={value=>{update({productCard:value === "PRODUCT_CARD",messageFormat:value === "TEXT" ? "TEXT" : "LINK",sendPrivateDm:true});setOpenMessage("message");setMessagePreview(null);setMode("dm");}} options={[{value:"TEXT",label:"plain text"},{value:"LINK",label:"text with button"},{value:"PRODUCT_CARD",label:"image with button"}]}/>}>
          {!data.sendPrivateDm ? <button type="button" className={s.publish} onClick={()=>update({sendPrivateDm:true})}>{tr("Enable Send a DM")}</button> : format === "PRODUCT_CARD" ? <ProductCardEditor title={data.dmMessage} subtitle={data.productSubtitle || ""} imageUrl={data.productImageUrl || ""} linkButtons={data.linkButtons} onChange={v=>update({...(v.title !== undefined ? {dmMessage:v.title} : {}),...(v.subtitle !== undefined ? {productSubtitle:v.subtitle} : {}),...(v.imageUrl !== undefined ? {productImageUrl:v.imageUrl} : {}),...(v.linkButtons ? {linkButtons:v.linkButtons} : {})})}/> : <><MessageCopyComposer message={data.dmMessage} onMessageChange={dmMessage=>{update({dmMessage});setMessagePreview(null);}} variations={data.messageVariations || []} onVariationsChange={messageVariations=>update({messageVariations})} context={{...context,hasButtons:format === "LINK"}} onPreview={setMessagePreview}/>{format === "LINK" && <MessageResponseEditor hideMessage message={data.dmMessage} linkButtons={data.linkButtons} onChange={v=>update({...(v.linkButtons ? {linkButtons:v.linkButtons} : {})})}/>}</>}

        </EditorRow>
        {data.sendPrivateDm && data.followUpEnabled && <EditorRow title="Follow up message" icon={<Clock3/>} open={openMessage === "followup"} onOpen={()=>toggleMessage("followup")} onRemove={()=>update({followUpEnabled:false})}>{field("Follow-up message","followUpMessage")}<label className={s.field}>{tr("Minimum wait before sending")}<select value={data.followUpDelayMinutes} onChange={e=>update({followUpDelayMinutes:Number(e.target.value)})}>{FOLLOW_UP_DELAYS.map(m=><option key={m} value={m}>{m} {tr("minutes")}</option>)}</select></label><p className={s.hint}>{tr("Includes your link buttons. Timing is approximate. Cancels when they reply or someone takes over the conversation. Sends only within Instagram’s 24-hour messaging window.")}</p></EditorRow>}
        <div className={s.addons}>
          {!data.openingDmEnabled && <button type="button" onClick={()=>add("opening",{openingDmEnabled:true})}><Mail/>{tr("Opener message")}</button>}
          {!data.emailCaptureEnabled && <button type="button" onClick={()=>add("email",{emailCaptureEnabled:true,openingDmEnabled:true})}><Mail/>{tr("Collect info")}</button>}
          {!data.followGateRequired && <button type="button" onClick={()=>add("follow",{followGateRequired:true,openingDmEnabled:true})}><UserRoundCheck/>{tr("Ask to follow")}</button>}
          {!data.followUpEnabled && <button type="button" disabled={!p.followUpsReady} title={!p.followUpsReady ? tr("Scheduled reminders are temporarily unavailable.") : undefined} onClick={()=>add("followup",{followUpEnabled:true,openingDmEnabled:true})}><MessageCircle/>{tr("Follow up message")}</button>}
        </div>{!p.followUpsReady && <p className={`${s.hint} mt-3`}>{tr("Scheduled reminders are temporarily unavailable.")}</p>}
      </>}
    </EditorGroup>
  </EditorLayout>;
}
