"use client";
import {useState} from "react";
import CommentEditor from "@/components/automations/comment-editor";
import type {WizardData} from "@/hooks/use-wizard";
import {DEFAULT_AI_PROTECTION_RULES} from "@/lib/ai-reply-config";
import {createCommentEditorPayload} from "@/lib/comment-editor-payload";
import {normalizeCampaignPayload,validateNormalizedCampaignPayload} from "@/lib/campaign-save";
const initial:WizardData={post:null,campaignName:"Post automation",triggerMode:"SPECIFIC_KEYWORD",keywords:[],matchingMode:"CONTAINS",sendPrivateDm:true,dmMessage:"Here is the guide you asked for!",messageFormat:"LINK",linkButtons:[{label:"Get the guide",url:"https://ap3k.com/help"}],followGateRequired:false,openingDmEnabled:false,openingDmText:"Tap below and I’ll send it over!",openingDmButtonText:"Send me the link",followRequestDmText:"Follow us to receive your guide.",followRequestButtonText:"Following",publicReply:"Sent! Check your DMs.",publicReply2:"Your guide is on its way!",publicReply3:"Check your inbox!",publicReplyEnabled:true,aiReplyEnabled:false,aiReplyTone:"FRIENDLY",aiReplyInstructions:"",aiProtectionRules:DEFAULT_AI_PROTECTION_RULES,active:false,emailCapturePrompt:"Where should we send your guide?",followUpMessage:"Did you get a chance to read it?",followUpDelayMinutes:30};
export default function Review(){const[data,setData]=useState(initial);const[error,setError]=useState<string|null>(null);return <CommentEditor slug="preview" data={data} update={v=>setData(d=>({...d,...v}))} onSave={active=>setError(!data.post ? "Select a post first." : validateNormalizedCampaignPayload(normalizeCampaignPayload(createCommentEditorPayload({...data,post:data.post},active))) || "Preview only — nothing was saved or published.")} saving={false} error={error} editingActive={false} posts={[
{id:"sample-1",caption:"A guide for your next creative project",media_type:"IMAGE",media_url:"/media/hero/creator-fashion.webp"},
{id:"sample-2",caption:"Everyday inspiration",media_type:"IMAGE",media_url:"/media/hero/creator-style.webp"},
{id:"sample-3",caption:"A new perspective",media_type:"IMAGE",media_url:"/media/hero/creator-portraits.webp"},
{id:"sample-4",caption:"AP3K automation",media_type:"IMAGE",media_url:"/media/ap3k-product-01.jpg"}
]} postsLoading={false} postsFetching={false} refreshPosts={()=>{}} username="preview_account" connected accountLoading={false} accountError={false} retryAccount={()=>{}} followUpsReady aiAvailable={false} aiWorkspaceReady={false} paid={false} commentOnly={false}/>;}
