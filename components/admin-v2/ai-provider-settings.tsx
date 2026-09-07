"use client";

import {
  activateAiProviderAction,
  disableAiProviderAction,
  saveAiProviderAction,
  testAiProviderAction,
} from "@/actions/admin/ai-provider";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import { AI_PROVIDERS, type AiProviderId } from "@/lib/ai-providers";
import {
  Bot,
  Check,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Pause,
  PlugZap,
  Route,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, useTransition } from "react";

type ProviderConfig = {
  id: AiProviderId;
  enabled: boolean;
  providerName: string;
  baseUrl: string;
  model: string;
  apiKeyHint: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  lastTestedAt: string | null;
};

type Props = {
  configs: ProviderConfig[];
  encryptionReady: boolean;
};

type Notice = { tone: "success" | "error"; text: string } | null;

const PROVIDER_ICONS = {
  google: Sparkles,
  groq: Zap,
  openrouter: Route,
} satisfies Record<AiProviderId, typeof Sparkles>;

export function AiProviderSettings({ configs, encryptionReady }: Props) {
  const initialProvider = configs.find((config) => config.enabled)?.id
    ?? configs.find((config) => config.apiKeyHint)?.id
    ?? "google";
  const [selectedId, setSelectedId] = useState<AiProviderId>(initialProvider);
  const [localConfigs, setLocalConfigs] = useState(configs);
  const [models, setModels] = useState<Record<AiProviderId, string>>(() => Object.fromEntries(
    AI_PROVIDERS.map((provider) => [
      provider.id,
      configs.find((config) => config.id === provider.id)?.model || provider.defaultModel,
    ]),
  ) as Record<AiProviderId, string>);
  const [apiKeys, setApiKeys] = useState<Record<AiProviderId, string>>({ google: "", groq: "", openrouter: "" });
  const [dirtyProviders, setDirtyProviders] = useState<Set<AiProviderId>>(() => new Set());
  const [notice, setNotice] = useState<Notice>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const definition = AI_PROVIDERS.find((provider) => provider.id === selectedId)!;
  const config = localConfigs.find((provider) => provider.id === selectedId)!;
  const activeConfig = localConfigs.find((provider) => provider.enabled);
  const isDirty = dirtyProviders.has(selectedId);
  const hasSavedKey = Boolean(config.apiKeyHint);
  const isVerified = config.lastTestStatus === "CONNECTED" && !isDirty;

  const markDirty = (providerId: AiProviderId) => {
    setDirtyProviders((current) => new Set(current).add(providerId));
    setNotice(null);
  };

  const updateConfig = (providerId: AiProviderId, update: Partial<ProviderConfig>) => {
    setLocalConfigs((current) => current.map((item) => item.id === providerId ? { ...item, ...update } : item));
  };

  const runAction = (
    name: string,
    action: () => Promise<{ status: 200 | 400; data: string }>,
    onSuccess: () => void,
    onError?: (message: string) => void,
  ) => {
    setNotice(null);
    setPendingAction(name);
    startTransition(async () => {
      const result = await action();
      setNotice({ tone: result.status === 200 ? "success" : "error", text: result.data });
      if (result.status === 200) onSuccess();
      else onError?.(result.data);
      setPendingAction(null);
    });
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const providerId = selectedId;
    const key = apiKeys[providerId];
    const form = new FormData();
    form.set("providerId", providerId);
    form.set("model", models[providerId]);
    form.set("apiKey", key);

    setNotice(null);
    setPendingAction("save");
    startTransition(async () => {
      const result = await saveAiProviderAction(form);
      setNotice({ tone: result.status === 200 ? "success" : "error", text: result.data });
      if (result.status === 200) {
        setApiKeys((current) => ({ ...current, [providerId]: "" }));
        setDirtyProviders((current) => {
          const next = new Set(current);
          next.delete(providerId);
          return next;
        });
        updateConfig(providerId, {
          ...(result.testRequired ? {
            enabled: false,
            lastTestStatus: null,
            lastTestError: null,
            lastTestedAt: null,
          } : {}),
          model: models[providerId],
          apiKeyHint: result.apiKeyHint,
        });
      }
      setPendingAction(null);
    });
  };

  const test = () => {
    const providerId = selectedId;
    runAction(
      "test",
      () => testAiProviderAction(providerId),
      () => {
        updateConfig(providerId, {
          enabled: false,
          lastTestStatus: "CONNECTED",
          lastTestError: null,
          lastTestedAt: new Date().toISOString(),
        });
      },
      (message) => updateConfig(providerId, { enabled: false, lastTestStatus: "FAILED", lastTestError: message }),
    );
  };

  const activate = () => {
    const providerId = selectedId;
    runAction("activate", () => activateAiProviderAction(providerId), () => {
      setLocalConfigs((current) => current.map((item) => ({ ...item, enabled: item.id === providerId })));
    });
  };

  const pause = () => {
    const providerId = selectedId;
    runAction("pause", () => disableAiProviderAction(providerId), () => {
      updateConfig(providerId, { enabled: false });
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-[#0c111d] to-[#0c111d] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300"><Bot className="h-5 w-5" /></span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">AP3K AI routing</p>
            <h2 className="mt-1 text-base font-black text-white">Choose one provider. Keep two ready as backups.</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Each API key is encrypted separately. Saving a changed key or model pauses that provider until it passes a fresh test.</p>
          </div>
        </div>
        {activeConfig ? <V2Badge tone="green">Active · {activeConfig.providerName}</V2Badge> : <V2Badge tone="amber">AI generation paused</V2Badge>}
      </div>

      <div className="grid gap-2 border-b border-white/[0.07] p-3 sm:grid-cols-3 sm:p-4">
        {AI_PROVIDERS.map((provider) => {
          const item = localConfigs.find((candidate) => candidate.id === provider.id)!;
          const Icon = PROVIDER_ICONS[provider.id];
          const selected = provider.id === selectedId;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => { setSelectedId(provider.id); setNotice(null); }}
              className={`group flex min-h-[84px] items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-violet-400/45 bg-violet-400/10 shadow-[0_0_0_1px_rgba(167,139,250,0.08)]" : "border-white/[0.07] bg-black/10 hover:border-white/15 hover:bg-white/[0.03]"}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${selected ? "bg-violet-400/15 text-violet-200" : "bg-white/[0.05] text-slate-400"}`}><Icon className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-black text-white">{provider.name}</span>
                  {item.enabled ? <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.65)]" /> : null}
                </span>
                <span className="mt-1 block text-[11px] text-slate-500">{item.apiKeyHint ? `Key ••••${item.apiKeyHint}` : "Not configured"}</span>
                <span className={`mt-1 block text-[10px] font-bold ${item.lastTestStatus === "CONNECTED" ? "text-emerald-300" : item.lastTestStatus === "FAILED" ? "text-red-300" : "text-slate-600"}`}>{item.lastTestStatus === "CONNECTED" ? "Connection verified" : item.lastTestStatus === "FAILED" ? "Test failed" : "Test required"}</span>
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={save} className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-white">{definition.name}</h3>
              {config.enabled ? <V2Badge tone="green">Active</V2Badge> : isVerified ? <V2Badge tone="blue">Ready</V2Badge> : hasSavedKey ? <V2Badge tone="amber">Needs test</V2Badge> : <V2Badge tone="slate">Setup needed</V2Badge>}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-400">{definition.description}</p>
          </div>
          <div className="flex gap-2 text-[11px] font-bold">
            <a href={definition.apiKeyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-2 text-violet-300 transition hover:bg-white/[0.04]">Get API key <ExternalLink className="h-3 w-3" /></a>
            <a href={definition.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-2 text-slate-400 transition hover:bg-white/[0.04]">Official docs <ExternalLink className="h-3 w-3" /></a>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-4 py-3 text-xs leading-5 text-emerald-100/85">{definition.freeTierNote}</p>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Model ID</span>
            <input
              list={`models-${definition.id}`}
              value={models[selectedId]}
              onChange={(event) => {
                setModels((current) => ({ ...current, [selectedId]: event.target.value }));
                markDirty(selectedId);
              }}
              className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-black/15 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10"
            />
            <datalist id={`models-${definition.id}`}>{definition.models.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}</datalist>
            <span className="mt-1.5 block text-[11px] leading-4 text-slate-500">Choose a preset or paste another model ID supported by this provider.</span>
          </label>

          <label className="block">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"><KeyRound className="h-3.5 w-3.5" /> API key</span>
            <input
              type="password"
              autoComplete="new-password"
              value={apiKeys[selectedId]}
              onChange={(event) => {
                setApiKeys((current) => ({ ...current, [selectedId]: event.target.value }));
                markDirty(selectedId);
              }}
              placeholder={config.apiKeyHint ? `Stored securely · ends in ${config.apiKeyHint}` : definition.keyPlaceholder}
              className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-black/15 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10"
            />
            <span className="mt-1.5 block text-[11px] leading-4 text-slate-500">Leave blank to keep the stored key. A new key is encrypted before database storage.</span>
          </label>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-black/10">
          <div className="grid gap-px bg-white/[0.07] sm:grid-cols-3">
            <Step number="1" title="Save" detail="Store the key and model" done={hasSavedKey && !isDirty} />
            <Step number="2" title="Test" detail="Verify a real AP3K reply" done={isVerified} />
            <Step number="3" title="Activate" detail="Route all AI traffic here" done={config.enabled} />
          </div>
        </div>

        {!encryptionReady ? <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-xs leading-5 text-amber-200">Set <span className="font-mono">AI_CONFIG_ENCRYPTION_KEY</span> in the server environment before saving API keys.</p> : null}
        {config.lastTestError && config.lastTestStatus === "FAILED" ? <p className="mt-4 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-xs leading-5 text-red-200">{config.lastTestError}</p> : null}
        {notice ? <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-5 ${notice.tone === "success" ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-200" : "border-red-500/20 bg-red-500/[0.07] text-red-200"}`}>{notice.text}</p> : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
          {config.enabled ? <button type="button" onClick={pause} disabled={isPending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-4 text-xs font-black text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-35">{pendingAction === "pause" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />} Pause AI</button> : null}
          <button type="button" onClick={test} disabled={isPending || isDirty || !hasSavedKey} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-4 text-xs font-black text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-35">{pendingAction === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} Test saved connection</button>
          <button type="submit" disabled={isPending || !encryptionReady || !isDirty} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 text-xs font-black text-violet-200 transition hover:bg-violet-500/15 disabled:opacity-35">{pendingAction === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Save configuration</button>
          {!config.enabled ? <button type="button" onClick={activate} disabled={isPending || !isVerified} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-xs font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-35">{pendingAction === "activate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Make active provider</button> : null}
        </div>
      </form>
    </section>
  );
}

function Step({ number, title, detail, done }: { number: string; title: string; detail: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 bg-[#0c111d] p-3.5">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-black ${done ? "bg-emerald-500/15 text-emerald-300" : "bg-white/[0.06] text-slate-500"}`}>{done ? <Check className="h-3.5 w-3.5" /> : number}</span>
      <span><span className="block text-xs font-black text-white">{title}</span><span className="mt-0.5 block text-[10px] text-slate-500">{detail}</span></span>
    </div>
  );
}
