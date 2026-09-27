"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import FlowPreview from "@/components/automations/flow-preview";
import FlowBuilder from "@/components/automations/flow-builder";
import EditorPreview from "@/components/automations/editor-preview";
import AiConversationBuilder from "@/components/automations/ai-conversation-builder";
import { TEMPLATES, templateFlow, templatePreset } from "@/lib/automation-flow/templates";
const samplePost = {postid:"review-post",media:"/media/ap3k-templates.jpg",mediaType:"IMAGE" as const,caption:"Your next idea starts with a conversation. Comment LINK for the guide."};
export default function Review(){
 const query=useSearchParams(); const {setTheme}=useTheme();const [id,setId]=useState(query.get("template")||"followers");
 useEffect(()=>setTheme(query.get("theme")||"light"),[query,setTheme]);
 const preset=templatePreset(id);const flow=templateFlow(id);
 const triggers=[{id:"primary",...preset,post:preset.source === "COMMENT" ? preset.postScope === "all" ? {...samplePost,postid:"ANY",media:""} : samplePost : null}];
 const opening=preset.opening||"Thanks for your interest! Tap below to continue.";const openingButton=preset.openingButton||"Continue";
 if(query.get("builder"))return <FlowBuilder slug="review" integrationId="" templateId={id} posts={[samplePost]} refreshPosts={()=>{}} username="yourbrand" automation={{listener:{flowDraft:{flow,triggers,name:TEMPLATES.find(t=>t.id===id)?.name,opening,openingButton,publicReply:"Check your DMs!",openingEnabled:!!preset.opening}}}}/>;
 if(query.get("ai"))return <AiConversationBuilder slug="review" integrationId="" accountName="yourbrand"/>;
 return <main className="min-h-screen bg-[#f0eef8] p-4 text-slate-900 dark:bg-[#1d1b2e] dark:text-slate-100"><label className="mx-auto mb-5 block max-w-[300px] text-sm">Template<select aria-label="Review template" className="my-2 w-full rounded-xl bg-white p-3 dark:bg-slate-900" value={id} onChange={e=>setId(e.target.value)}>{TEMPLATES.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><FlowPreview key={id} flow={flow} triggers={triggers} opening={opening} openingButton={openingButton} publicReply="Check your DMs!" username="yourbrand"/>{query.get("quick")&&<div className="mx-auto mt-10 h-[620px] max-w-[300px]"><EditorPreview data={{post:samplePost,keywords:["LINK"],sendPrivateDm:true,dmMessage:"Here is your guide.",linkButtons:[{label:"Get the link",url:""}]}} mode="dm" onModeChange={()=>{}} username="yourbrand" source="DM"/></div>}</main>;
}
