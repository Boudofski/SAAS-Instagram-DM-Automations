import { notFound } from "next/navigation";
import { AiProviderSettings } from "@/components/admin-v2/ai-provider-settings";
import { AI_PROVIDERS } from "@/lib/ai-providers";
export const metadata = { robots: { index: false, follow: false } };
export default async function Review({ searchParams }: { searchParams: Promise<{ frame?: string; dark?: string }> }) {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  const query = await searchParams;
  if (!query.frame) return <main style={{ padding: 20, background: "#e2e8f0" }}><h1>Preview-only AI settings review</h1>{["320", "390", "1100"].flatMap(width => [false, true].map(dark => <section key={width + String(dark)}><h2>{width}px {dark ? "dark" : "light"}</h2><iframe title={`${width}px ${dark ? "dark" : "light"}`} src={`/ai-routing-review?frame=1&dark=${dark ? "1" : "0"}`} style={{ width: Number(width), height: 1450, border: "1px solid #94a3b8" }} /></section>))}</main>;
  return <main className={query.dark === "1" ? "dark" : ""}><div className="min-h-screen bg-white p-2 dark:bg-slate-950"><AiProviderSettings encryptionReady configs={AI_PROVIDERS.map(provider => ({ id: provider.id, enabled: provider.id === "groq", fallbackEnabled: true, benchmarkLatencyMs: provider.id === "groq" ? 420 : 1300, cooldownUntil: null, lastSuccessAt: null, lastFailureCode: null, providerName: provider.name, baseUrl: provider.baseUrl, model: provider.defaultModel, apiKeyHint: "demo", lastTestStatus: "CONNECTED", lastTestError: null, lastTestedAt: null }))} /></div></main>;
}
