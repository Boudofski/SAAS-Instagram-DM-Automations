"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Billing from "@/components/global/billing";
import Analytics from "@/components/automations/automation-analytics";
import Footer from "@/components/global/website-footer";
import type { AutomationAnalytics } from "@/lib/automation-analytics";
import { makeUsageMetric } from "@/lib/plan-limits";
const data: AutomationAnalytics = { automation: { id:"00000000-0000-0000-0000-000000000001", name:"October lighting checklist", active:false, createdAt:"2026-10-11", source:"COMMENT", followGateRequired:true, postThumbnail:null, responseCount:128, messageType:"Button Text" }, totals:{hits:156,uniqueHitRecipients:140,clicks:92,eligibleNonFollowers:80,newFollowers:24,clickRate:65.7,followRate:30},daily:Array.from({length:7},(_,i)=>({date:`2026-10-${String(i+5).padStart(2,"0")}`,hits:[10,15,12,28,35,20,36][i],clicks:[4,9,8,17,23,11,20][i]})),countries:[{country:"US",clicks:43},{country:"GB",clicks:22},{country:null,clicks:27}],recent:{hits:[],clicks:[],follows:[]},trackingStartedAt:"2026-10-05",links:[{destination:"https://example.com/lighting-checklist?utm_source=instagram&utm_medium=dm&utm_campaign=lighting_launch",clicks:78,recipients:140},{destination:"https://example.com/consultation",clicks:24,recipients:80}] };
export default function Review({frame,screen="billing",theme="light"}:{frame?:string;screen?:string;theme?:string}) {
  const [width,setWidth]=useState(390); const [selected,setSelected]=useState(screen); const [mode,setMode]=useState(theme); const {setTheme}=useTheme();
  useEffect(()=>{if(frame)setTheme(theme)},[frame,theme,setTheme]);
  if(!frame)return <main className="min-h-screen bg-slate-200 p-4 text-slate-950"><nav className="mb-4 flex flex-wrap gap-4">{[320,390,1280].map(w=><button key={w} onClick={()=>setWidth(w)}>{w}px</button>)}{["billing","analytics","footer","editor"].map(s=><button key={s} onClick={()=>setSelected(s)}>{s}</button>)}<button onClick={()=>setMode(mode==="light"?"dark":"light")}>Toggle theme ({mode})</button></nav><iframe title="Audit responsive preview" key={`${selected}:${mode}`} src={selected==="editor"?"/editor-review?frame=1":`/audit-review?frame=1&screen=${selected}&theme=${mode}`} style={{width,maxWidth:"100%",height:900,border:0}}/></main>;
  if(screen==="footer")return <Footer/>;
  if(screen==="analytics")return <Analytics data={data} slug="review"/>;
  return <div className="min-h-screen bg-slate-50 p-4 dark:bg-[#0b101b] sm:p-8"><Billing current="PRO" billingState="subscription" billing={{status:"active",interval:"month",renewsAt:"2026-11-11",cancelAtPeriodEnd:false,lookupKey:"ap3k_pro_month"}} usage={{plan:"PRO",planLabel:"Pro",periodLabel:"October 2026",periodStart:new Date("2026-10-01"),periodEnd:new Date("2026-11-01"),enforcementStart:new Date("2026-10-01"),staticReplies:makeUsageMetric(1280,5000),aiReplies:makeUsageMetric(120,500),activeCampaigns:makeUsageMetric(8,"unlimited"),connectedAccounts:makeUsageMetric(2,3)}}/></div>;
}
