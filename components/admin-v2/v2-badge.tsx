import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "red" | "blue" | "slate" | "pink";

const TONE_CLASSES: Record<Tone, string> = {
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  red: "border-red-500/30 bg-red-500/10 text-red-300",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  slate: "border-white/10 bg-white/[0.04] text-slate-400",
  pink: "border-pink-500/30 bg-pink-500/10 text-pink-300",
};

export function V2Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide", TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  if (status === "CONNECTED" || status === "ACTIVE" || status === "SENT") return "green";
  if (status === "DISCONNECTED" || status === "SUSPENDED" || status === "FAILED") return "red";
  if (status === "SKIPPED") return "amber";
  return "slate";
}

export function eventTone(eventType: string): Tone {
  if (eventType === "PUBLIC_REPLY_SENT" || eventType === "KEYWORD_MATCHED" || eventType === "DM_SENT") return "green";
  if (eventType.includes("FAILED") || eventType.includes("LOOP_GUARD")) return "red";
  if (eventType.includes("SKIPPED") || eventType === "NO_MATCH") return "amber";
  if (eventType === "COMMENT_RECEIVED" || eventType === "WEBHOOK_RECEIVED") return "blue";
  return "slate";
}

export function accountHealth(account: {
  status: string;
  reconnectRequired: boolean;
  expiresAt: Date | null;
  oauthLastError: string | null;
}): { label: "Healthy" | "Needs attention" | "Broken"; tone: Tone } {
  const tokenExpired = Boolean(account.expiresAt && new Date(account.expiresAt).getTime() < Date.now());
  if (account.status === "DISCONNECTED" || tokenExpired) return { label: "Broken", tone: "red" };
  if (account.reconnectRequired || account.oauthLastError) return { label: "Needs attention", tone: "amber" };
  return { label: "Healthy", tone: "green" };
}
