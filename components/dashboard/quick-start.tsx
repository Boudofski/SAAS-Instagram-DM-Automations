import Link from "next/link";
import { ArrowUpRight, MessageCircle, Sparkles, ShoppingBag } from "lucide-react";
import { UiText } from "@/components/i18n/localized-copy";
export default function QuickStart({ slug }: { slug: string }) {
  return <section aria-labelledby="quick-start-title" className="ap3k-content-enter"><div className="mb-3 flex items-center justify-between gap-3"><h2 id="quick-start-title" className="text-sm font-bold text-slate-700 dark:text-slate-200"><UiText>What would you like to automate?</UiText></h2><Link href={`/dashboard/${slug}/automation/new`} className="text-xs font-semibold text-violet-700 dark:text-violet-300"><UiText>View all</UiText></Link></div><div className="grid gap-3 sm:grid-cols-3">{[
    {type:"comment",title:"Comment automation",subtitle:"Turn comments into conversations",icon:MessageCircle},
    {type:"ai",title:"AI conversations",subtitle:"Answer questions and guide customers",icon:Sparkles},
    {type:"affiliate",title:"Product links",subtitle:"Share a photo and your offer",icon:ShoppingBag},
  ].map(({type,title,subtitle,icon:Icon})=><Link key={type} href={`/dashboard/${slug}/automation/new?type=${type}`} className="group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-[border-color,transform,box-shadow] duration-200 hover:border-violet-300 hover:shadow-md motion-safe:hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#111320]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold"><UiText>{title}</UiText></span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400"><UiText>{subtitle}</UiText></span></span><ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" /></Link>)}</div></section>;
}
