"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import Billing from "@/components/global/billing";
import Ap3kAiConsole from "@/components/ai/ap3k-ai-console";
import { DEFAULT_AI_PROTECTION_RULES } from "@/lib/ai-reply-config";
const paths = ["/docs", "/blog", "/blog/instagram-comment-to-dm-automation", "/blog/ap3k-workspace-visual-guide", "/manychat-alternative", "/compare/linkdm", "/pricing", "/product-audit-review?screen=ai", "/product-audit-review?screen=billing", "/product-audit-review?screen=retry"];
export default function Review({ screen }: { screen?: string }) {
  const [width, setWidth] = useState(390);
  const [path, setPath] = useState(paths[0]);
  const { setTheme } = useTheme();
  if (screen) return <div className="min-h-screen bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-white">{screen === "ai" ? <Ap3kAiConsole slug="review" plan="PRO" initial={{ aiRepliesEnabled: false, aiCommentsEnabled: false, role: "Help customers using approved information", brandVoice: "Friendly", guardrails: "Ask for help when facts are missing.", defaultTone: "FRIENDLY", protectionRules: DEFAULT_AI_PROTECTION_RULES, knowledge: [] }} /> : <Billing current="BUSINESS" billingState="unavailable" billingReason={screen === "billing" ? "customer_missing" : undefined} />}</div>;
  return <main className="min-h-screen bg-slate-200 p-4 text-slate-950"><div className="mb-4 flex flex-wrap gap-4">{[320,390,768,1280].map(w=><button key={w} onClick={()=>setWidth(w)}>{w}px</button>)}<button onClick={()=>setTheme("light")}>Light</button><button onClick={()=>setTheme("dark")}>Dark</button><select aria-label="Review page" value={path} onChange={e=>setPath(e.target.value)}>{paths.map(p=><option key={p}>{p}</option>)}</select></div><iframe title="Product audit responsive review" src={path} style={{width,maxWidth:"100%",height:820,border:0}}/></main>;
}
