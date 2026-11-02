import { normalizeLinkUrl, type LinkButton } from "./link-buttons";

/** Add native URL buttons for links pasted into an ordinary message.
 * Never change interactive gates or replace explicitly configured buttons/media.
 */
export function withMessageLinkButtons<T extends {
  message: string; responseFormat?: string | null; ctaUrl?: string | null;
  linkButtons?: LinkButton[]; postbackButton?: unknown; followGatePrompt?: unknown;
}>(params: T): T & { linkButtons?: LinkButton[]; responseFormat?: string | null } {
  if (params.postbackButton || params.followGatePrompt || params.ctaUrl || params.linkButtons?.length ||
      (params.responseFormat && !["TEXT", "LINK"].includes(params.responseFormat))) return params;
  const buttons: LinkButton[] = [];
  for (const match of params.message.matchAll(/(?:https?:\/\/|www\.)[^\s<>\u200e\u200f\u202a-\u202e\u2066-\u2069]+/gi)) {
    let raw = match[0].replace(/[.,!?;:،؛؟"'\]}]+$/u, "");
    // Keep balanced URL parentheses, drop prose/Markdown closing punctuation.
    while (raw.endsWith(")") && (raw.match(/\)/g)?.length ?? 0) > (raw.match(/\(/g)?.length ?? 0)) raw = raw.slice(0, -1);
    const url = normalizeLinkUrl(raw);
    if (!url || buttons.some(button => button.url === url)) continue;
    const parsed = new URL(url);
    if (!parsed.hostname.includes(".") || parsed.username || parsed.password) continue;
    buttons.push({ label: parsed.hostname.replace(/^www\./, "").slice(0, 20), url });
    if (buttons.length === 3) break;
  }
  return buttons.length ? { ...params, responseFormat: "LINK", linkButtons: buttons } : params;
}
