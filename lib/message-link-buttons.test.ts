import { expect, it } from "vitest";
import { withMessageLinkButtons as links } from "./message-link-buttons";
it("makes URLs in Arabic, English and Markdown messages native link buttons",()=>{
  expect(links({message:"تفضل 👇 https://ap3k.com،"}).linkButtons).toEqual([{label:"ap3k.com",url:"https://ap3k.com/"}]);
  expect(links({message:"[Guide](https://example.com/guide)."}).linkButtons?.[0].url).toBe("https://example.com/guide");
  expect(links({message:"Visit www.example.com"}).responseFormat).toBe("LINK");
});
it("deduplicates, limits buttons and preserves query strings and balanced parentheses",()=>{
  const result=links({message:"https://example.com/a_(b)?x=1&y=2 https://example.com/a_(b)?x=1&y=2 https://two.com https://three.com https://four.com"});
  expect(result.linkButtons).toHaveLength(3);
  expect(result.linkButtons?.[0].url).toBe("https://example.com/a_(b)?x=1&y=2");
});
it("preserves gates, explicit buttons, media, and messages without links",()=>{
  for(const extra of [{postbackButton:{}},{followGatePrompt:{}},{ctaUrl:"https://chosen.com"},{linkButtons:[{label:"Chosen",url:"https://chosen.com"}]},{responseFormat:"PRODUCT_CARD"},{responseFormat:"MEDIA"}]) {
    const input={message:"https://example.com",...extra};expect(links(input)).toBe(input);
  }
  const input={message:"Hello"};expect(links(input)).toBe(input);
});
