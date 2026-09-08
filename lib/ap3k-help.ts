export type HelpArticle = {
  slug: string;
  category: "Getting started" | "Instagram" | "Automations" | "AP3K AI" | "Inbox" | "Billing" | "Account & privacy";
  title: string;
  summary: string;
  steps: string[];
};

export const AP3K_HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "connect-instagram",
    category: "Getting started",
    title: "Connect Instagram",
    summary: "Connect one Instagram Business or Creator account through Meta's official authorization flow.",
    steps: ["Open Instagram Account from the workspace menu.", "Choose Connect Instagram and approve the requested Meta permissions.", "Return to AP3K and confirm that Comments and Actions both show Ready.", "Personal Instagram accounts must first be changed to a professional Business or Creator account."],
  },
  {
    slug: "reconnect-instagram",
    category: "Instagram",
    title: "Reconnect or replace an Instagram account",
    summary: "Reconnect when permissions expire or when you intentionally want to replace the workspace account.",
    steps: ["Open Instagram Account and select Reconnect Instagram.", "Sign in to the intended Meta account and approve every required permission.", "AP3K supports one connected Instagram account per workspace.", "Disconnecting or replacing an account can stop active automations until the new connection is ready."],
  },
  {
    slug: "create-automation",
    category: "Automations",
    title: "Create a comment automation",
    summary: "Choose a post or Reel, define the trigger, then enable only the actions you need.",
    steps: ["Select Create automation.", "Choose the Instagram post or Reel and a keyword or Any Comment trigger.", "In Actions, enable a public reply, AI reply, or DM separately.", "Opening DM is optional. A final DM can be sent directly, and can include up to three labeled links.", "Review the Post, Comments, and DM preview, then publish."],
  },
  {
    slug: "opening-final-dm",
    category: "Automations",
    title: "Opening DM, follow request, and final DM",
    summary: "Each private-message step is optional and remains off until you enable it.",
    steps: ["Opening DM starts the private conversation with a button; leave it off to send the final DM directly.", "Follow request can ask a person to follow before AP3K sends the final link.", "Final DM contains the message and up to three button labels and destination URLs.", "Use the phone preview to check the complete flow before publishing."],
  },
  {
    slug: "automation-troubleshooting",
    category: "Automations",
    title: "Why an automation did not reply",
    summary: "Check the trigger, activation state, Instagram connection, and usage before changing a live flow.",
    steps: ["Confirm the automation is Live and attached to the post or Reel you tested.", "For a keyword trigger, use a comment containing the saved keyword; Any Comment accepts every eligible comment.", "Open Instagram Account and verify that Comments and Actions show Ready.", "Check Billing for remaining automated-reply and AI-reply usage.", "Avoid repeatedly testing with an old comment; create a new eligible comment after publishing changes."],
  },
  {
    slug: "ai-setup",
    category: "AP3K AI",
    title: "Set up AP3K AI",
    summary: "AP3K AI is available on Pro and Business and can be enabled independently for comments and DMs.",
    steps: ["Open AP3K AI and add focused, accurate knowledge notes.", "Set the role, brand voice, tone, guardrails, and comment-protection choices.", "Test answers in Playground, then explicitly save useful business facts to Knowledge.", "Enable AI Replies or AI Comments at workspace level and separately in each automation.", "AI replies count toward the plan's monthly AI allowance."],
  },
  {
    slug: "ai-safety",
    category: "AP3K AI",
    title: "AI safety and comment protection",
    summary: "Control how AI treats abuse, criticism, unanswerable questions, and solicitation.",
    steps: ["AP3K treats Instagram content as untrusted and never as system instructions.", "Choose Skip reply or Delete for supported problem categories.", "Unanswerable questions are skipped rather than guessed.", "Keep product, price, availability, refund, and policy information current in Knowledge.", "Review AI behavior before enabling it on a live automation."],
  },
  {
    slug: "ai-knowledge",
    category: "AP3K AI",
    title: "Teach AI about your business",
    summary: "Knowledge gives AI approved facts; Behavior controls how those facts are communicated.",
    steps: ["Create short knowledge notes for products, services, prices, locations, hours, shipping, refunds, and common questions.", "Keep each note focused and remove outdated facts.", "Use Playground to test realistic customer questions across multiple turns.", "A playground chat is remembered, but it does not change live Knowledge unless you select Save as business knowledge.", "Never save passwords, API keys, payment-card data, or private customer information."],
  },
  {
    slug: "inbox",
    category: "Inbox",
    title: "Use the Instagram Inbox",
    summary: "Read conversations, search contacts, and send a manual reply from the connected account.",
    steps: ["Open Inbox and choose a conversation.", "Search by Instagram username when needed.", "Use Refresh if a new message has not appeared yet.", "Manual replies require a healthy Instagram connection and are subject to Meta messaging rules."],
  },
  {
    slug: "contacts-leads",
    category: "Inbox",
    title: "Contacts and leads",
    summary: "Contacts records the Instagram people who interact with your connected automations.",
    steps: ["Open Contacts to search people captured by AP3K.", "A lead is counted when an eligible automation captures the interaction defined by the flow.", "Open an Inbox conversation to review message context and reply manually.", "Use automation analytics to compare comments, public replies, DMs, and leads."],
  },
  {
    slug: "plans-usage",
    category: "Billing",
    title: "Plans, usage, and AI limits",
    summary: "Free is $0; Pro and Business add monthly reply capacity and AP3K AI.",
    steps: ["Free includes a 14-day, 50-reply launch allowance.", "Pro includes 5,000 automated replies and 500 AI replies per month.", "Business includes 20,000 automated replies and 2,000 AI replies per month.", "One successful public comment reply or DM counts as one automated reply.", "Open Billing to see current usage; paid subscribers use Manage billing for plan, payment, invoices, or cancellation."],
  },
  {
    slug: "billing-troubleshooting",
    category: "Billing",
    title: "Billing and subscription help",
    summary: "Checkout and subscription changes are handled securely by Stripe.",
    steps: ["Choose a plan and billing interval on Billing.", "Complete payment in Stripe Checkout.", "Use Manage billing for payment methods, invoices, plan changes, and cancellation.", "If access does not update after payment, refresh Billing and contact support with the invoice email—never send card details."],
  },
  {
    slug: "refer-earn",
    category: "Billing",
    title: "Refer friends and earn AP3K credit",
    summary: "Share the tracked referral link shown in Refer & earn and follow qualification progress there.",
    steps: ["Copy your personal link from Refer & earn.", "Your friend must create a new AP3K account through that link, connect Instagram, and complete an eligible paid invoice.", "Eligible Founding 10 rewards add a $9 AP3K credit to a future Stripe invoice.", "Self-referrals, duplicates, refunds, disputes, fraud, and accounts without a connected Instagram profile do not qualify."],
  },
  {
    slug: "privacy-delete",
    category: "Account & privacy",
    title: "Privacy, disconnection, and account deletion",
    summary: "Control the Instagram connection and permanently remove AP3K data from Settings.",
    steps: ["Use Instagram Account to reconnect or remove the connected profile.", "Use Settings to manage sign-in and permanent account deletion.", "Permanent deletion removes campaigns, Instagram connection, leads, activity, billing profile link, and the AP3K account.", "AP3K never needs your Instagram password, card details, one-time code, or raw API key in support chat."],
  },
];

export function ap3kSupportKnowledge() {
  return AP3K_HELP_ARTICLES.map((article) => [article.category, article.title, article.summary, ...article.steps].join("\n")).join("\n\n---\n\n");
}
