"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Clock3, Grid2X2, Loader2, Mail, MessageCircle, MoreVertical, Plus, RefreshCw, Target, Text, UserRoundCheck, X } from "lucide-react";
import type { WizardData } from "@/hooks/use-wizard";
import { useUi } from "@/components/i18n/use-ui";
import { FOLLOW_UP_DELAYS } from "@/lib/automation-engagement-settings";
import MessageResponseEditor from "./message-response-editor";
import ProductCardEditor from "./product-card-editor";
import EditorLayout, { EditorGroup, EditorRow, EditorSwitch, editorStyles as s } from "./editor-layout";
import EditorPreview, { type EditorPreviewMode } from "./editor-preview";

export type EditorPost = { id: string; caption?: string; media_url?: string; thumbnail_url?: string; media_type: string; timestamp?: string };
export type CommentEditorProps = {
  slug: string; data: WizardData; update: (value: Partial<WizardData>) => void; onSave: (active: boolean) => void;
  saving: boolean; error: string | null; editingActive: boolean; posts: EditorPost[]; postsLoading: boolean; postsFetching: boolean;
  refreshPosts: () => void; username?: string | null; avatar?: string | null; connected: boolean; accountLoading: boolean; accountError: boolean;
  retryAccount: () => void; postsError?: string | null; followUpsReady: boolean; aiAvailable: boolean; paid: boolean; commentOnly: boolean;
};

export default function CommentEditor(p: CommentEditorProps) {
  const tr = useUi(); const { data, update } = p;
  const [openTrigger, setOpenTrigger] = useState<string | null>("post");
  const [openMessage, setOpenMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorPreviewMode>("post");
  const [keyword, setKeyword] = useState("");
  const [postQuery, setPostQuery] = useState("");
  const toggleTrigger = (key: string) => { setOpenTrigger(v=>v === key ? null : key); setMode(key === "post" ? "post" : "comments"); };
  const toggleMessage = (key: string) => { setOpenMessage(v=>v === key ? null : key); setMode("dm"); };
  const add = (key: string, values: Partial<WizardData>) => { update({sendPrivateDm:true, ...values}); setOpenMessage(key); setMode("dm"); };
  const addKeyword = () => { const value = keyword.trim(); if (value && !data.keywords.some(w=>w.toLowerCase() === value.toLowerCase())) update({keywords:[...data.keywords,value]}); setKeyword(""); };
  const selectedAny = data.post?.postid === "ANY";
  const publicOn = data.publicReplyEnabled || data.aiReplyEnabled;
  const format = data.productCard ? "PRODUCT_CARD" : data.messageFormat === "TEXT" ? "TEXT" : "LINK";
  const posts = [...p.posts].sort((a,b)=>new Date(b.timestamp || 0).getTime()-new Date(a.timestamp || 0).getTime()).filter(post=>!postQuery || `${post.caption || ""} ${post.id}`.toLowerCase().includes(postQuery.toLowerCase()));
  const field = (label: string, key: "openingDmText" | "followRequestDmText" | "emailCapturePrompt" | "followUpMessage", rows = 4) => <label className={s.field}>{tr(label)}<textarea value={data[key] || ""} onFocus={()=>setMode("dm")} maxLength={640} rows={rows} dir="auto" onChange={e=>update({[key]:e.target.value})}/></label>;
  const buttonField = (label: string,key:"openingDmButtonText"|"followRequestButtonText") => <label className={s.field}>{tr(label)}<input value={data[key]} maxLength={20} dir="auto" onChange={e=>update({[key]:e.target.value})}/></label>;

  return <EditorLayout slug={p.slug} name={data.campaignName} onNameChange={campaignName=>update({campaignName})} active={p.editingActive} saving={p.saving} onSave={p.onSave} error={p.error} accountName={p.username || undefined}
    preview={<EditorPreview data={{...data,linkButtons:format === "TEXT" ? [] : data.linkButtons}} mode={mode} onModeChange={setMode} username={p.username} avatar={p.avatar}/> }>
    <EditorGroup title="Setup Triggers and Public Reply">
      <EditorRow title="Post" summary={tr(selectedAny ? "Any post" : data.post ? "Selected post" : "Select post")} icon={<Grid2X2/>} open={openTrigger === "post"} onOpen={()=>toggleTrigger("post")}
        controls={<select aria-label={tr("Post scope")} value={selectedAny ? "ANY" : "SPECIFIC"} onChange={e=>{update({post:e.target.value === "ANY" ? {postid:"ANY",caption:tr("Any post - triggers on all Instagram posts"),media:"",mediaType:"IMAGE"} : null});setOpenTrigger("post");setMode("post");}}><option value="SPECIFIC">{tr("a specific post or reel")}</option><option value="ANY">{tr("Any post")}</option></select>}>
        {p.accountLoading || p.postsLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin" aria-label={tr("Loading posts")}/></div> : p.accountError ? <div role="alert"><p>{tr("Your account could not be loaded. Please try again.")}</p><button type="button" onClick={p.retryAccount} className={s.publish}>{tr("Try again")}</button></div> : !p.connected ? <p>{tr("Connect Instagram first")} <Link className="text-violet-500 underline" href={`/dashboard/${p.slug}/integrations`}>{tr("Connect Instagram")}</Link></p> : selectedAny ? <p className={s.hint}>{tr("Listen on every post and Reel.")}</p> : <>
          <div className={s.postActions}><input aria-label={tr("Search posts")} placeholder={tr("Search posts")} className="min-w-0 rounded-lg bg-transparent px-2 py-1 text-xs" value={postQuery} onChange={e=>setPostQuery(e.target.value)}/><button type="button" disabled={p.postsFetching} onClick={p.refreshPosts}><RefreshCw size={14} className={p.postsFetching ? "animate-spin" : ""}/>{tr("Refresh")}</button></div>
          <div className={s.postStrip} role="group" aria-label={tr("Choose a specific post or Reel")}>{posts.map(post=>{
            const media = post.media_type === "VIDEO" ? post.thumbnail_url || post.media_url : post.media_url || post.thumbnail_url;
            return <button type="button" key={post.id} aria-label={`${tr("Select post")} ${post.caption || post.id}`} aria-pressed={data.post?.postid === post.id} onClick={()=>{update({post:{postid:post.id,caption:post.caption,media:media || "",mediaType:post.media_type === "VIDEO" ? "VIDEO" : post.media_type === "CAROUSEL_ALBUM" ? "CAROUSEL_ALBUM" : "IMAGE"}});setMode("post");}} className={`${s.postTile} ${data.post?.postid === post.id ? s.postSelected : ""}`}>{media ? <Image src={media} alt={post.caption || tr("Instagram post")} fill sizes="(min-width:1600px) 200px,155px" unoptimized /> : <Grid2X2 className="m-auto"/>}<span>{data.post?.postid === post.id ? <Check size={22}/> : <MoreVertical size={21}/>}</span></button>;
          })}</div>{!posts.length && <p className={s.hint}>{tr(p.posts.length ? "No posts match your search." : "No media loaded yet. Click Refresh posts, reconnect Instagram, or use Any post.")}</p>}
        </>}{p.postsError && <p role="alert" className={s.error}>{p.postsError}</p>}
      </EditorRow>
      <EditorRow title="Trigger" summary={data.triggerMode === "ANY_COMMENT" ? tr("Any comment") : `${data.keywords.length} ${tr("keywords")}`} icon={<Target/>} open={openTrigger === "trigger"} onOpen={()=>toggleTrigger("trigger")}
        controls={<select aria-label={tr("Trigger type")} value={data.triggerMode} onChange={e=>{update({triggerMode:e.target.value as WizardData["triggerMode"]});setOpenTrigger("trigger");setMode("comments");}}><option value="SPECIFIC_KEYWORD">{tr("a specific word (s)")}</option><option value="ANY_COMMENT">{tr("Any comment")}</option></select>}>
        {data.triggerMode === "SPECIFIC_KEYWORD" ? <><div className={s.chips}>{data.keywords.map(word=><span key={word}><bdi>{word}</bdi><button type="button" aria-label={`${tr("Remove keyword")} ${word}`} onClick={()=>update({keywords:data.keywords.filter(w=>w!==word)})}><X size={13}/></button></span>)}<input aria-label={tr("Add keyword")} placeholder={tr("Add keyword")} value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>{if(e.key === "Enter"){e.preventDefault();addKeyword();}}}/><button type="button" aria-label={tr("Add keyword")} onClick={addKeyword}><Plus size={16}/></button></div><p className={`${s.hint} mt-2`}>{tr("Press Enter to add keyword")}</p></> : <p className={s.hint}>{tr("Reply to any eligible comment on the selected posts.")}</p>}
      </EditorRow>
      <EditorRow title="Public comment reply" icon={<MessageCircle/>} open={openTrigger === "reply"} onOpen={()=>toggleTrigger("reply")} controls={<><select aria-label={tr("Public reply type")} value={data.aiReplyEnabled ? "AI" : "SAVED"} onChange={e=>{update({aiReplyEnabled:e.target.value === "AI",publicReplyEnabled:e.target.value === "SAVED"});setOpenTrigger("reply");setMode("comments");}}><option value="SAVED">{tr("Saved replies")}</option><option value="AI" disabled={!p.aiAvailable && !data.aiReplyEnabled}>{tr("AI")} · {tr("Pro")}</option></select><EditorSwitch label="Public comment reply" checked={publicOn} onChange={enabled=>{update({publicReplyEnabled:enabled,aiReplyEnabled:false});setOpenTrigger(enabled ? "reply" : null);setMode("comments");}}/></>}>
        {publicOn ? data.aiReplyEnabled ? <><label className={s.field}>{tr("Automation focus")}<textarea rows={4} maxLength={1600} value={data.aiReplyInstructions} onChange={e=>update({aiReplyInstructions:e.target.value})}/></label><p className={s.hint}>{tr("Uses AP3K AI settings")}</p></> : <>{(["publicReply","publicReply2","publicReply3"] as const).map((key,index)=><label className={s.field} key={key}>{tr("Reply")} {index+1}<textarea rows={2} maxLength={1000} value={data[key]} dir="auto" onChange={e=>update({[key]:e.target.value})}/></label>)}<p className={s.hint}>{tr("AP3K chooses one of your replies for each matching comment.")}</p></> : <p className={s.hint}>{tr("Enable Public comment reply to add a response.")}</p>}
        {!p.aiAvailable && <p className={`${s.hint} mt-3`}><Link href={`/dashboard/${p.slug}/${p.paid ? "ai" : "billing"}`} className="text-violet-500 underline">{tr(p.paid ? "Enable AI Comments in AP3K AI first" : "Upgrade to Pro")}</Link></p>}
      </EditorRow>
    </EditorGroup>
    <EditorGroup title="Setup Direct Message" action={<EditorSwitch label="Send a DM" checked={data.sendPrivateDm} disabled={p.commentOnly} onChange={sendPrivateDm=>{update({sendPrivateDm,...(!sendPrivateDm ? {followGateRequired:false,emailCaptureEnabled:false,followUpEnabled:false} : {})});setMode("dm");}}/>}>
      {p.commentOnly ? <p className={s.hint}>{tr("DMs are disabled for this review mode. This mode tests comment replies and lead tracking.")}</p> : <>
        {data.sendPrivateDm && data.openingDmEnabled && <EditorRow title="Opener message" summary={tr("text with button")} icon={<Mail/>} open={openMessage === "opening"} onOpen={()=>toggleMessage("opening")} onRemove={()=>update({openingDmEnabled:false,followGateRequired:false,emailCaptureEnabled:false,followUpEnabled:false})}>{field("Opening message","openingDmText")}{buttonField("Continue quick reply","openingDmButtonText")}</EditorRow>}
        {data.sendPrivateDm && data.followGateRequired && <EditorRow title="Ask to follow" icon={<UserRoundCheck/>} open={openMessage === "follow"} onOpen={()=>toggleMessage("follow")} onRemove={()=>update({followGateRequired:false})}>{field("Follow request DM","followRequestDmText")}{buttonField("Verification button","followRequestButtonText")}<p className={s.hint}>{tr("Opening DM is enabled automatically. People who already follow skip this step.")}</p></EditorRow>}
        {data.sendPrivateDm && data.emailCaptureEnabled && <EditorRow title="Collect info" summary={tr("Email")} icon={<Mail/>} open={openMessage === "email"} onOpen={()=>toggleMessage("email")} onRemove={()=>update({emailCaptureEnabled:false})}>{field("Email request","emailCapturePrompt")}<p className={s.hint}>{tr("Saved to Contacts. AP3K adds instructions to reply SKIP or STOP. Sharing an email does not subscribe someone to marketing emails.")}</p></EditorRow>}
        <EditorRow title="Message" summary={!data.sendPrivateDm ? tr("Off") : undefined} icon={<Text/>} open={openMessage === "message"} onOpen={()=>toggleMessage("message")} controls={<select aria-label={tr("Message format")} value={format} onChange={e=>{update({productCard:e.target.value === "PRODUCT_CARD",messageFormat:e.target.value === "TEXT" ? "TEXT" : "LINK",sendPrivateDm:true});setOpenMessage("message");setMode("dm");}}><option value="TEXT">{tr("plain text")}</option><option value="LINK">{tr("text with button")}</option><option value="PRODUCT_CARD">{tr("image with button")}</option></select>}>
          {!data.sendPrivateDm ? <button type="button" className={s.publish} onClick={()=>update({sendPrivateDm:true})}>{tr("Enable Send a DM")}</button> : format === "PRODUCT_CARD" ? <ProductCardEditor title={data.dmMessage} subtitle={data.productSubtitle || ""} imageUrl={data.productImageUrl || ""} linkButtons={data.linkButtons} onChange={v=>update({...(v.title !== undefined ? {dmMessage:v.title} : {}),...(v.subtitle !== undefined ? {productSubtitle:v.subtitle} : {}),...(v.imageUrl !== undefined ? {productImageUrl:v.imageUrl} : {}),...(v.linkButtons ? {linkButtons:v.linkButtons} : {})})}/> : format === "TEXT" ? <label className={s.field}>{tr("DM message text")}<textarea rows={5} maxLength={1000} dir="auto" value={data.dmMessage} onChange={e=>update({dmMessage:e.target.value})}/><small className={s.hint}>{data.dmMessage.length}/1000</small></label> : <MessageResponseEditor message={data.dmMessage} linkButtons={data.linkButtons} onChange={v=>update({...(v.message !== undefined ? {dmMessage:v.message} : {}),...(v.linkButtons ? {linkButtons:v.linkButtons} : {})})}/>}
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
