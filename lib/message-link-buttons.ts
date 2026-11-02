import { normalizeLinkButtons } from "./link-buttons";
import type { LinkButton } from "./link-buttons";

// Instagram renders URLs inside button-template text as noninteractive text.
// Link lists must remain normal messages, with complete HTTP(S) destinations.
export function withMessageLinkButtons<T extends {
  message: string; responseFormat?: string | null; ctaUrl?: string | null;
  ctaTitle?: string | null; linkButtons?: LinkButton[];
  postbackButton?: unknown; followGatePrompt?: unknown;
}>(params: T, preserveButtons = false): T {
  if (params.postbackButton || params.followGatePrompt ||
      (params.responseFormat && !["TEXT", "LINK"].includes(params.responseFormat))) return params;
  let found = false;
  const message = params.message.replace(/(^|[\s(:：])((?:https?:\/\/|www\.)[^\s<>]+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|ai|io|app|co|org|net|ma|fr|de|es|uk|dev|tech|google)(?:\/[^\s<>]*)?)(?=$|[\s.,،؛؟!:)])/gim, (whole, prefix: string, raw: string) => {
    // Do not turn email addresses or code identifiers into links.
    let end = "";
    while (/[.,!?;:،؛؟"'\]}]$/.test(raw) || (raw.endsWith(")") && (raw.match(/\)/g)?.length ?? 0) > (raw.match(/\(/g)?.length ?? 0))) { end = raw.slice(-1) + end; raw = raw.slice(0,-1); }
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (!url.hostname.includes(".") || url.username || url.password) return whole;
      found = true;
      return prefix + url.toString() + end;
    } catch { return whole; }
  });
  if (!found) return params;
  const buttons = normalizeLinkButtons(params.linkButtons, params.ctaTitle, params.ctaUrl);
  if (preserveButtons) return { ...params, message };
  const extra = buttons.filter(b => b.url && !message.includes(b.url) && !message.includes(b.url.replace(/\/$/,""))).map(b => `${b.label}: ${b.url}`);
  return { ...params, message: message + (extra.length ? `\n\n${extra.join("\n")}` : ""), responseFormat: "TEXT", linkButtons: [], ctaUrl: null };
}
