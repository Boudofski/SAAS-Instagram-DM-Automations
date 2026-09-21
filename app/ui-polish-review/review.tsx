"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ThemeToggle from "@/components/global/theme-toggle";
import LanguageSwitcher from "@/components/global/language-switcher";
import Items from "@/components/global/sidebar/items";
import Notification from "@/components/global/navbar/notification";
import AutomationTable from "@/components/dashboard/automation-table";
import ContactsClient from "@/components/dashboard/contacts-client";
import Ap3kAiConsole from "@/components/ai/ap3k-ai-console";
import { DEFAULT_AI_PROTECTION_RULES } from "@/lib/ai-reply-config";
import MessageResponseEditor from "@/components/automations/message-response-editor";
import DeliveryRules from "@/components/automations/delivery-rules";
import MessageAutomationPreview from "@/components/automations/message-automation-preview";
import MobilePreviewDialog from "@/components/automations/mobile-preview-dialog";
import AutomationWizardToolbar from "@/components/automations/automation-wizard-toolbar";
import PricingExperience from "@/components/global/pricing-experience";
import { useSearchParams } from "next/navigation";
import { DEFAULT_FOLLOW_REQUEST_DM_TEXT, DEFAULT_FOLLOW_REQUEST_BUTTON_TEXT } from "@/lib/comment-dm-flow";
import { DEFAULT_LINK_BUTTON_LABEL } from "@/lib/link-buttons";
export default function Review() {
 const view = useSearchParams().get("view") || "controls";
 const [preview, setPreview] = useState(false);
 const [step,setStep]=useState(1);
 const [draft,setDraft]=useState({message:"",linkButtons:[{label:DEFAULT_LINK_BUTTON_LABEL,url:""}],followGateRequired:false,followRequestDmText:DEFAULT_FOLLOW_REQUEST_DM_TEXT,followRequestButtonText:DEFAULT_FOLLOW_REQUEST_BUTTON_TEXT});
 const phone=<MessageAutomationPreview source="DM" step={step} trigger="MENTION" triggerMode="ANY_MESSAGE" keywords={[]} {...draft}/>;
 return <div className="ap3k-page ap3k-app-shell p-4">
 <header className="flex flex-wrap items-center gap-3 mb-4"><h1 className="flex-1 text-sm font-bold">Presentation QA · empty state fixtures · no customer data</h1><ThemeToggle compact/><LanguageSwitcher compact/><Notification slug="review"/></header>
 {view==="controls" && <div className="mx-auto max-w-3xl space-y-5">
 <div className="ap3k-card rounded-2xl p-4 flex flex-wrap gap-3">{(["default","secondary","outline","ghost","destructive","link"] as const).map(variant=><Button key={variant} variant={variant}>{variant}</Button>)}<Button disabled>Disabled</Button><Button aria-busy>Loading…</Button></div>
 <section className="ap3k-card rounded-2xl p-4 space-y-4"><label className="block">Input<Input placeholder="Type here"/></label><label className="block">Message<Textarea/></label><label className="block">Invalid input<Input aria-invalid defaultValue="Invalid"/></label><div className="flex gap-6 items-center"><Switch aria-label="Enable"/><Checkbox aria-label="Agree"/></div><Select><SelectTrigger aria-label="Selection"><SelectValue placeholder="Choose"/></SelectTrigger><SelectContent><SelectItem value="one">One</SelectItem><SelectItem value="two">Two</SelectItem></SelectContent></Select>
 <Dialog><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Dialog review</DialogTitle><DialogDescription>Keyboard focus, Escape, scrolling and responsive bounds.</DialogDescription></DialogHeader><Input aria-label="Dialog input"/><Button>Action</Button></DialogContent></Dialog>
 <Tabs defaultValue="one"><TabsList><TabsTrigger value="one">One</TabsTrigger><TabsTrigger value="two">Longer translated selection</TabsTrigger></TabsList><TabsContent value="one">First panel</TabsContent><TabsContent value="two">Second panel</TabsContent></Tabs></section>
 <nav className="ap3k-panel p-3 flex flex-col max-w-xs"><Items page="automation" slug="review"/></nav></div>}
 {view==="automations" && <AutomationTable slug="review" automations={[]}/>}
 {view==="contacts" && <ContactsClient slug="review" contacts={[]}/>}
 {view==="ai" && <Ap3kAiConsole slug="review" plan="FREE" initial={{aiRepliesEnabled:false,aiCommentsEnabled:false,role:"",brandVoice:"",guardrails:"",defaultTone:"FRIENDLY",protectionRules:DEFAULT_AI_PROTECTION_RULES,knowledge:[]}}/>}
 {view==="billing" && <PricingExperience dashboardCompact currentPlan="FREE"/>}
 {view==="builder" && <div className="grid gap-4 xl:grid-cols-2"><section className="ap3k-panel overflow-hidden"><AutomationWizardToolbar backHref="/ui-polish-review?view=automations" currentStep={step} totalSteps={3} onOpenPreview={()=>setPreview(true)}/><div className="p-4 space-y-5"><MessageResponseEditor {...draft} onChange={next=>setDraft({...draft,...next})}/><DeliveryRules {...draft} onChange={next=>setDraft({...draft,...next})}/><Button onClick={()=>setStep(step%3+1)}>Continue</Button></div></section><aside className="hidden xl:flex h-[720px]">{phone}</aside></div>}
 {preview && <MobilePreviewDialog onClose={()=>setPreview(false)}>{phone}</MobilePreviewDialog>}
 </div>;
}
