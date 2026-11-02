import { expect, it } from "vitest";
import { withMessageLinkButtons as links } from "./message-link-buttons";
it("normalizes bare domains in plain text without creating buttons",()=>{
 const result=links({message:"ChatGPT: chatgpt.com\nFlow: labs.google/flow",responseFormat:"TEXT"});
 expect(result.message).toBe("ChatGPT: https://chatgpt.com/\nFlow: https://labs.google/flow");
 expect(result.responseFormat).toBe("TEXT");
});
it("preserves explicit buttons and legacy CTAs without modifying the body",()=>{
 for (const config of [{ctaUrl:"https://example.com",ctaTitle:"Open"},{linkButtons:[{label:"شرح الأدوات هنا 🔗",url:"https://example.com"}]}]) {
  for (const message of ["Here is your guide", "Visit example.com", "Visit https://example.com"]) {
   const input={message,responseFormat:"LINK",...config};
   expect(links(input)).toBe(input);
  }
 }
});
it("preserves email addresses, existing gates and media",()=>{
 const input={message:"support@example.com"};expect(links(input)).toBe(input);
 for(const extra of [{postbackButton:{}},{followGatePrompt:{}},{responseFormat:"PRODUCT_CARD"},{responseFormat:"MEDIA"}]){const input={message:"https://example.com",...extra};expect(links(input)).toBe(input);}
});
it("keeps punctuation and query parameters intact",()=>{
 expect(links({message:"See https://example.com/a_(b)?x=1&y=2."}).message).toBe("See https://example.com/a_(b)?x=1&y=2.");
});
