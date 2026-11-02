import { expect, it } from "vitest";
import { withMessageLinkButtons as links } from "./message-link-buttons";
it("normalizes all bare domains and sends link lists outside button templates",()=>{
 const result=links({message:"ChatGPT: chatgpt.com\nClaude: claude.ai\nSeed: seed.bytedance.com/en/seedance\nFlow: labs.google/flow\nتفضل https://ap3k.com،",responseFormat:"LINK",linkButtons:[{label:"شرح الأدوات",url:"https://ceptice.com/guide"}]});
 expect(result.message).toContain("https://chatgpt.com/");expect(result.message).toContain("https://labs.google/flow");expect(result.message).toContain("https://seed.bytedance.com/en/seedance");expect(result.message).toContain("شرح الأدوات: https://ceptice.com/guide");expect(result.linkButtons).toEqual([]);expect(result.responseFormat).toBe("TEXT");
});
it("preserves email addresses, existing gates and media",()=>{
 const input={message:"support@example.com"};expect(links(input)).toBe(input);
 for(const extra of [{postbackButton:{}},{followGatePrompt:{}},{responseFormat:"PRODUCT_CARD"},{responseFormat:"MEDIA"}]){const input={message:"https://example.com",...extra};expect(links(input)).toBe(input);}
});
it("keeps punctuation and query parameters intact",()=>{
 expect(links({message:"See https://example.com/a_(b)?x=1&y=2."}).message).toBe("See https://example.com/a_(b)?x=1&y=2.");
});
