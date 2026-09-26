"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUi } from "@/components/i18n/use-ui";
import { editorStyles as s } from "./editor-layout";

export function EditorSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string; disabled?: boolean }[] }) {
  const tr = useUi();
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={tr(label)} className={s.selectTrigger}><SelectValue/></SelectTrigger><SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-[#1d1b2b] dark:text-white">{options.map(option=><SelectItem key={option.value} value={option.value} disabled={option.disabled}>{tr(option.label)}</SelectItem>)}</SelectContent></Select>;
}
