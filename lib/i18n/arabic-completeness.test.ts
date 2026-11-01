import { describe, expect, it } from "vitest";
import { HOME_FEATURES_COPY } from "./home-features";
import { translatePublicShell } from "./public-shell";
import { translateUi } from "./translate";

const SCREENSHOT_UI = [
  "Start free. Grow at your pace.",
  "Compare plans & features",
  "Frequently asked questions",
  "New automation",
  "Search",
  "Flow",
  "Basic",
  "All",
  "ENABLED",
  "MONTHLY USAGE",
  "Recent automations",
  "AUTOMATION",
  "Chat automation",
  "Post automation",
  "Replies to keywords sent in DMs",
  "Download CSV",
  "Filter",
  "Phone",
  "Email",
  "Created on",
  "Last interacted on",
  "Newest",
  "Showing your 100 most recent conversations.",
  "Reply to this Instagram conversation…",
  "Enter to send · Shift + Enter for a new line",
  "Create your first automation",
  "Create a new DM automation for your Instagram account",
  "Read docs",
  "Hey, AP3K",
  "How can we help you?",
  "how does this work?",
  "Pick a post and a keyword, that's it",
  "Anyone who comments gets your link in DM",
  "instantly?",
  "Or add a delay so it feels human",
  "won’t every DM look the same?",
  "AI writes variations, so each one reads fresh",
  "can I send a PDF?",
  "PDFs, images, even a voice note",
  "can I take payment in the DM?",
  "Yes, Stripe checkout right inside the chat",
  "my keywords keep missing people",
  "Switch to AI intent, it reads what they meant",
  "Works in any language your audience writes in",
  "what about story replies?",
  "Story replies and mentions, both covered",
  "can I ask them to follow first?",
  "Add an Ask to follow step before the link",
  "people DM me before commenting",
  "Conversation starter shows 4 one tap questions",
  "I want a proper multi step flow",
  "Flow builder does that, or let AI build it",
  "Describe the goal and it drafts the whole flow",
  "can I split test two offers?",
  "Drop a randomizer node and split the traffic",
  "worried about getting flagged",
  "Every send goes through a safety queue",
  "Paced to stay inside Meta limits",
  "ok setting one up now",
  "Takes about a minute 💫",
] as const;

describe("Arabic product completeness", () => {
  it("translates every interface label visible in the Arabic regression screenshots", () => {
    for (const source of SCREENSHOT_UI) {
      expect(translateUi(source, "ar"), source).not.toBe(source);
    }
  });

  it("uses the Arabic homepage feature catalog instead of the English fallback", () => {
    expect(HOME_FEATURES_COPY.ar.kicker).toMatch(/[\u0600-\u06ff]/);
    expect(HOME_FEATURES_COPY.ar.title).toMatch(/[\u0600-\u06ff]/);
    for (const card of [...HOME_FEATURES_COPY.ar.featured, ...HOME_FEATURES_COPY.ar.cards]) {
      expect(card.title).toMatch(/[\u0600-\u06ff]/);
      expect(card.description).toMatch(/[\u0600-\u06ff]/);
    }
  });

  it("translates the complete footer navigation used on Arabic public pages", () => {
    for (const source of [
      "Product", "Instagram automation", "Free Instagram automation",
      "Comment to DM", "Resources", "Documentation", "Solutions",
      "Grow followers", "Compare", "About AP3K", "Contact us",
    ]) expect(translatePublicShell(source, "ar"), source).not.toBe(source);
  });
});
