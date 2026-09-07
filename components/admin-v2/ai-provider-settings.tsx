"use client";

import { saveAiProviderAction, testAiProviderAction } from "@/actions/admin/ai-provider";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import { Bot, CheckCircle2, KeyRound, Loader2, PlugZap } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  config: {
    enabled: boolean;
    providerName: string;
    baseUrl: string;
    model: string;
    apiKeyHint: string | null;
    lastTestStatus: string | null;
    lastTestError: string | null;
    lastTestedAt: string | null;
  };
  encryptionReady: boolean;
};

export function AiProviderSettings({ config, encryptionReady }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(config.enabled);
  const [providerName, setProviderName] = useState(config.providerName);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [model, setModel] = useState(config.model);
  const [apiKey, setApiKey] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(Boolean(config.apiKeyHint));
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    startSave(async () => {
      const form = new FormData();
      form.set("enabled", String(enabled));
      form.set("providerName", providerName);
      form.set("baseUrl", baseUrl);
      form.set("model", model);
      form.set("apiKey", apiKey);
      const result = await saveAiProviderAction(form);
      setNotice({ tone: result.status === 200 ? "success" : "error", text: result.data });
      if (result.status === 200) {
        if (apiKey) setHasSavedKey(true);
        setApiKey("");
        router.refresh();
      }
    });
  };

  const test = () => {
    setNotice(null);
    startTest(async () => {
      const result = await testAiProviderAction();
      setNotice({ tone: result.status === 200 ? "success" : "error", text: result.data });
      router.refresh();
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-[#0c111d] to-[#0c111d] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300"><Bot className="h-5 w-5" /></span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">AI comment replies</p>
            <h2 className="mt-1 text-base font-black text-white">OpenAI-compatible provider</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">One protected provider powers AI replies. Campaign-level tone, instructions, and safety rules stay with each automation.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config.lastTestStatus === "CONNECTED" ? <V2Badge tone="green">Verified</V2Badge> : config.lastTestStatus === "FAILED" ? <V2Badge tone="red">Test failed</V2Badge> : <V2Badge tone="slate">Not tested</V2Badge>}
          <button type="button" aria-pressed={enabled} onClick={() => setEnabled((value) => !value)} className={`relative h-7 w-12 rounded-full border transition ${enabled ? "border-emerald-400/30 bg-emerald-500/25" : "border-white/10 bg-white/[0.05]"}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      <form onSubmit={save} className="p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Provider name" value={providerName} onChange={setProviderName} placeholder="AgentRouter" />
          <Field label="Model ID" value={model} onChange={setModel} placeholder="Provider model identifier" />
          <div className="lg:col-span-2"><Field label="Base URL" value={baseUrl} onChange={setBaseUrl} placeholder="https://co.agentrouter.org/v1" inputMode="url" /></div>
          <label className="block lg:col-span-2">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"><KeyRound className="h-3.5 w-3.5" /> API key</span>
            <input type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={config.apiKeyHint ? `Stored securely · ends in ${config.apiKeyHint}` : "Paste a provider API key"} className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-black/15 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10" />
            <span className="mt-1.5 block text-[11px] text-slate-500">Leave blank to keep the existing key. The key is encrypted before it reaches the database.</span>
          </label>
        </div>

        {!encryptionReady && <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-xs leading-5 text-amber-200">Set <span className="font-mono">AI_CONFIG_ENCRYPTION_KEY</span> in the server environment before saving an API key.</p>}
        {config.lastTestError && config.lastTestStatus === "FAILED" ? <p className="mt-4 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-xs text-red-200">{config.lastTestError}</p> : null}
        {notice ? <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-xs ${notice.tone === "success" ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-200" : "border-red-500/20 bg-red-500/[0.07] text-red-200"}`}>{notice.text}</p> : null}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={test} disabled={testing || saving || !hasSavedKey} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-4 text-xs font-black text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-35">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} Test saved connection</button>
          <button type="submit" disabled={saving || testing || !encryptionReady} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-xs font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-35">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save provider</button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; inputMode?: "url" }) {
  return <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-black/15 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10" /></label>;
}
