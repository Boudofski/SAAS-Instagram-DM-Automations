'use client';
import {useState} from 'react';
import {useTheme} from 'next-themes';
import {useSearchParams} from 'next/navigation';
import FlowBuilder from '@/components/automations/flow-builder';
import AutomationTypePicker from '@/components/automations/automation-type-picker';
import Analytics from '@/components/automations/automation-analytics';
export default function Review(){const search=useSearchParams();const {setTheme}=useTheme();const mode=search.get('view')??'flow';return <><div className="fixed bottom-2 right-3 z-[100] flex gap-2 rounded-full border bg-white p-2 text-xs text-black shadow"><button onClick={()=>setTheme('light')}>Light</button><button onClick={()=>setTheme('dark')}>Dark</button></div>{mode==='chooser'?<AutomationTypePicker slug="preview"/>:mode==='analytics'?<Analytics slug="preview" data={{automation:{id:'preview',name:'Link delivery DM',active:true,createdAt:'2026-09-27T00:00:00Z',source:'COMMENT',followGateRequired:true,postThumbnail:null,responseCount:0},totals:{hits:0,uniqueHitRecipients:0,clicks:0,eligibleNonFollowers:0,newFollowers:0,clickRate:0,followRate:0},daily:Array.from({length:7},(_,i)=>({date:`2026-09-${21+i}`,hits:0,clicks:0})),countries:[],recent:{hits:[],clicks:[],follows:[]},trackingStartedAt:null}}/>:<FlowBuilder slug="preview" integrationId="" templateId={search.get('template')??'ask-to-follow'} plan="PRO" refreshPosts={()=>{}}/>}</>;}
