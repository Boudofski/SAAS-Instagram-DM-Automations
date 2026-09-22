export type SeoResource = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  sections: { title: string; intro?: string; items: string[] }[];
};

export const SEO_RESOURCES: SeoResource[] = [
  {
    slug: "instagram-comment-to-dm-templates",
    eyebrow: "Free template library",
    title: "Instagram Comment-to-DM Templates",
    description: "Copy clear Instagram captions, public replies, DMs, and link-button labels for comment-to-DM campaigns.",
    sections: [
      {
        title: "Caption calls to action",
        intro: "Replace the bracketed text before publishing. Promise one specific result and use the same keyword in AP3K.",
        items: [
          "Comment GUIDE and I’ll send you the complete [topic] checklist by DM.",
          "Want the exact [resource]? Comment LINK and I’ll send it directly.",
          "Comment PRICE for the current plans and what each option includes.",
          "Need help choosing? Comment HELP and I’ll send the short decision guide.",
          "Comment BOOK and I’ll send the available appointment page.",
          "Comment MENU and I’ll send today’s menu with prices.",
        ],
      },
      {
        title: "Public reply templates",
        items: [
          "Sent — check your DMs.",
          "It’s on the way. Check your message requests too.",
          "Done. I sent the guide privately.",
          "Thanks — the link is in your DMs.",
          "Sent. Tell me if the link gives you any trouble.",
          "You’ve got it. Open your Instagram inbox.",
        ],
      },
      {
        title: "Final DM templates",
        items: [
          "Here’s the [resource] from the post. Tap the button below to open it.",
          "Thanks for commenting [keyword]. This link opens the exact [product or guide] you requested.",
          "Here are the current [plans or prices]. Review the options, then reply here if you have a question.",
          "Here’s the booking page. Choose any available time that works for you.",
          "Here’s today’s menu. Availability may change, so confirm your order through the contact option on the page.",
          "Here’s the checklist. Save it somewhere easy to find before you start.",
        ],
      },
      {
        title: "Button labels",
        items: ["Get the guide", "View pricing", "Book a time", "Open the menu", "View product", "Download checklist"],
      },
    ],
  },
  {
    slug: "instagram-comment-automation-checklist",
    eyebrow: "Launch checklist",
    title: "Instagram Comment Automation Checklist",
    description: "A practical pre-launch and weekly review checklist for Instagram comment-to-DM automations.",
    sections: [
      {
        title: "Before you build",
        items: [
          "Define the exact resource, answer, or next step the commenter will receive.",
          "Confirm the destination works on a phone and uses HTTPS.",
          "Choose one short keyword that is easy to spell and hard to trigger accidentally.",
          "Write a caption that states both the keyword and what the person will receive.",
        ],
      },
      {
        title: "Inside AP3K",
        items: [
          "Confirm the correct Instagram Business or Creator account is selected.",
          "Choose the intended post, Reel, or account-wide scope.",
          "Match the configured keyword to the caption exactly.",
          "Enable only the public reply and DM actions the campaign actually needs.",
          "Check every message, link, button label, and optional follow request.",
        ],
      },
      {
        title: "Real launch test",
        items: [
          "Comment from a second Instagram account after the automation is active.",
          "Confirm the public reply appears only when enabled.",
          "Check the inbox and message requests for the DM.",
          "Open every link inside Instagram’s in-app browser.",
          "Leave an unrelated comment and confirm a keyword campaign ignores it.",
        ],
      },
      {
        title: "Weekly review",
        items: [
          "Check Instagram connection health and any failed actions.",
          "Compare comments, trigger matches, sent actions, destination visits, and final outcomes separately.",
          "Repair stale links, outdated prices, unavailable products, and expired booking pages.",
          "Improve campaigns with weak outcomes before creating more overlapping automations.",
        ],
      },
    ],
  },
];

export function getSeoResource(slug: string) {
  return SEO_RESOURCES.find(resource => resource.slug === slug) ?? null;
}
