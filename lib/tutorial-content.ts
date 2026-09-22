import type { BlogPost, BlogSection } from "./blog";

export const TUTORIAL_LABELS = {
  enlarge: "Enlarge screenshot",
  original: "Open full-size image",
  zoom: "Zoom in",
  fit: "Fit to screen",
  hint: "Tap any screenshot to enlarge it. Screens show an example account; your activity and available plan details may differ.",
  guides: "Learn AP3K with real screenshots",
  read: "Read the illustrated guide",
  category: "Illustrated tutorials",
  pan: "Zoom in, then scroll across the image to read the details.",
};

export const TUTORIAL_SCREENSHOTS = {
  "instagram-welcome": { width: 1270, height: 1164, title: "Welcome and first connection", caption: "The welcome screen offers Let's connect your Instagram and an option to explore first." },
  "instagram-connect": { width: 1864, height: 788, title: "Start the Instagram connection", caption: "Before a profile is connected, the connection page shows the Connect Instagram button." },
  "instagram-permissions": { width: 1024, height: 1070, title: "Review Instagram permissions", caption: "Instagram's authorization screen lists profile and media, comments, and messages access, followed by Allow and Cancel." },
  "instagram-ready": { width: 2048, height: 980, title: "Confirm the granted permissions", caption: "After authorization, AP3K shows Instagram connected and a separate Granted status for Profile & media, Comments, and DMs." },
  "instagram-account": { width: 2048, height: 980, title: "Instagram account health and controls", caption: "Your Instagram combines connection readiness, Reconnect Instagram, Refresh profile, performance, and connection settings." },
  dashboard: { width: 2048, height: 980, title: "Home dashboard", caption: "Home shows the connected account, date filters, performance totals, and active automations." },
  "automation-types": { width: 2048, height: 980, title: "Choose an automation type", caption: "Choose Comment automation, Story automation, or DM automation according to where the interaction starts." },
  automations: { width: 2048, height: 980, title: "Manage automations", caption: "The automation list shows each flow's channel, trigger, actions, runs, leads, and Live or Paused status." },
  contacts: { width: 2048, height: 980, title: "Contacts and conversation sources", caption: "Search contacts by Instagram username. Open chat is available when a conversation exists; Lead captured is a different state." },
  "ai-overview": { width: 2048, height: 980, title: "AI Overview and readiness", caption: "Overview separates business knowledge, voice and behavior, and the AI Replies and AI Comments master switches." },
  "ai-knowledge": { width: 2048, height: 980, title: "AI Knowledge notes", caption: "Add a Topic and Facts AI may use. Saved notes appear in the panel beside the form." },
  "ai-behavior": { width: 2048, height: 980, title: "AI voice, tone, and guardrails", caption: "Behavior contains the AI role, brand voice, tone, guardrails, and comment-protection settings." },
  "ai-playground": { width: 2048, height: 980, title: "Test in AI Playground", caption: "Playground asks for at least one knowledge note before a meaningful test. Tests count toward the monthly AI limit." },
  inbox: { width: 2048, height: 980, title: "Instagram Inbox conversations", caption: "Inbox has conversation search, a chat list, the selected thread, and a manual reply composer." },
  billing: { width: 2048, height: 1284, title: "Billing and monthly usage", caption: "Billing separates automated actions, AI replies, and active automations. The screenshot shows an example Business subscription." },
  referrals: { width: 2048, height: 1244, title: "Referral link and reward progress", caption: "Refer & earn shows your personal invite link, qualification steps, reward totals, and referral activity." },
  settings: { width: 2048, height: 1163, title: "Appearance, email, and account settings", caption: "Settings groups theme, sign-in management, optional email preferences, and permanent account deletion." },
} as const;
export type TutorialScreenshotId = keyof typeof TUTORIAL_SCREENSHOTS;
export function tutorialImageSrc(id: TutorialScreenshotId) { return `/images/tutorials/${id}.png`; }

export const INSTAGRAM_CONNECTION_SECTIONS: BlogSection[] = [
  { heading: "1. Start from the welcome screen", screenshot: "instagram-welcome", paragraphs: ["Use an Instagram Business or Creator account that you are authorized to manage. On the AP3K welcome screen, choose Let's connect your Instagram. I'll explore first lets you look around, but automations still need a connected Instagram account before they can run."] },
  { heading: "2. Open Connect Instagram", screenshot: "instagram-connect", paragraphs: ["On the connection page, choose Connect Instagram to open the official Instagram authorization flow. The three boxes beneath it summarize the next stages: connect, create an automation, then test and launch. They are a checklist, not a confirmation that a flow is already active."] },
  { heading: "3. Choose the account and review access", screenshot: "instagram-permissions", paragraphs: ["Read the username on Instagram's permission screen before continuing. AP3K-IG is the app name shown in this example. Profile and media access is marked required. Leave comment access enabled for comment triggers and replies, and message access enabled for DMs, then choose Allow to continue or Cancel to stop.", "The screenshots use different example profiles: the authorization screen shows ceptice, while the connected-account screens show boudofi. In your own setup, confirm that the same intended username appears before and after authorization."] },
  { heading: "4. Check connection and permission readiness", screenshot: "instagram-ready", paragraphs: ["After Instagram returns you to AP3K, look for Instagram connected and check the username. Under Instagram capabilities, review Profile & media, Comments, and DMs separately. All permissions ready means the displayed capabilities were granted; it does not publish an automation for you.", "If an expected capability is missing, use Reconnect Instagram, review the account and access choices, and return to check again. Once ready, create an automation and test it with a fresh interaction from another Instagram account."] },
  { heading: "5. Manage the connected Instagram account", screenshot: "instagram-account", paragraphs: ["Your Instagram shows the connected profile and readiness badges. Refresh profile updates profile information; Reconnect Instagram renews the authorization. Choose a reporting period in Performance to read followers, posts, comments, leads, DMs, and reply rate. These example totals are not a promise of results.", "Expand Connection settings for Manage connection or Remove Instagram account. Removal permanently deletes that profile's automations, contacts, inbox, analytics, and AI knowledge; your other connected accounts stay unchanged. Use reconnect to repair access, and remove an account only when you intend to delete its AP3K data."] },
];

const base = {
  publishedAt: "2026-09-20", updatedAt: "2026-09-20", category: TUTORIAL_LABELS.category,
  readingTime: "8 min read", visual: "workflow" as const,
  contentLocale: "en" as const,
  visualAlt: "AP3K workflow connecting Instagram interactions with replies and direct messages",
  visualCaption: "Follow the real AP3K workspace screens alongside the instructions in this guide.",
};

export const ILLUSTRATED_POSTS: BlogPost[] = [
  {
    ...base, slug: "ap3k-workspace-visual-guide", cover: "dashboard",
    title: "Your AP3K Workspace: A Complete Visual Guide",
    description: "Explore the AP3K dashboard, automations, contacts, Inbox, billing, referrals, and settings with real screenshots and practical instructions.",
    keywords: ["AP3K tutorial", "AP3K dashboard", "Instagram automation"],
    intro: "Use this tour to find your way around AP3K after connecting Instagram. Start with Home, check your automations, then follow the conversation through Contacts and Inbox. The final sections explain your subscription and account controls.",
    sections: [
      { heading: "1. Read your Home dashboard", screenshot: "dashboard", paragraphs: ["Check the Instagram username at the top before reading the results. Use Last 24h, Last 7d, This month, or Last 30d to choose the reporting period. Followers, Posts, Comments, Leads, and Replies describe different parts of your activity; leads are not confirmed purchases."], bullets: ["Use the account selector in the sidebar when you manage more than one Instagram profile.", "Manage account opens the connection controls. View all opens the full automation list."] },
      { heading: "2. Find and manage an automation", screenshot: "automations", paragraphs: ["Open Automations from the sidebar. Search by automation name, keyword, or content, then use the sort menu to organize the list. Read the Trigger and Actions columns together: a keyword decides when a flow starts, while the actions describe what it sends."], bullets: ["Edit opens the configuration. Pause stops a live flow; Start resumes a paused flow.", "Runs and Leads are separate counters. Create Automation starts a new flow."] },
      { heading: "3. Find people in Contacts", screenshot: "contacts", paragraphs: ["Open Contacts and search by Instagram username. The Source column helps distinguish comment interactions from manual conversations. Choose Open chat when it is available to continue in Inbox. A Lead captured label records the interaction; it does not mean a manual conversation is available or a sale is complete."] },
      { heading: "4. Continue a conversation in Inbox", screenshot: "inbox", paragraphs: ["Search conversations, select a person in the chat list, and read the thread before replying. The selected conversation shows its source and previous messages. Write in the reply box and choose Send; Enter sends and Shift + Enter starts a new line. Use Refresh if recent activity is missing.", "Manual replies depend on the Instagram connection and messaging eligibility. A contact entry alone does not guarantee that you can send a message."] },
      { heading: "5. Check your plan and usage", screenshot: "billing", paragraphs: ["Open Billing to see your current plan, subscription status, renewal date, and usage. Automated actions and AI replies have separate allowances. One successful public reply or DM counts as one action; sending both uses two, and additional messages use additional actions. Playground tests count toward the AI allowance.", "Use the Monthly or Annual selector when comparing plans. Paid subscribers use Manage or cancel subscription to open the billing portal. Read the current details in your own workspace rather than treating the example screenshot's balance, price, or renewal date as your account information."] },
      { heading: "6. Track invitations in Refer & earn", screenshot: "referrals", paragraphs: ["Copy your own invite link from Refer & earn and share it with a friend. The three stages are a new signup through your link, connecting Instagram, and an eligible paid subscription. Follow the progress cards and referral activity to see which stage each invitation has reached.", "Read Eligibility and rules before expecting a reward. The illustrated Founding 10 offer gives qualifying credit toward a future invoice; copying a link or getting a signup alone does not earn that credit. Use your own link, not the one pictured here."] },
      { heading: "7. Set appearance, email, and account preferences", screenshot: "settings", paragraphs: ["In Settings, choose Light or Dark under Appearance. Manage sign-in settings opens your authentication controls. Under Email notifications, select the optional messages you want and choose Save email preferences. Essential security, connection, usage, support, and billing emails remain enabled.", "The Danger zone is for permanent account deletion, including automations, Instagram data, leads, and the sign-in account. To pause an automation, use Pause in Automations instead of deleting your account."] },
    ],
  },
  {
    ...base, slug: "create-ap3k-automation-visual-guide", cover: "automation-types",
    title: "Create an AP3K Automation: Comments, Stories, and DMs",
    description: "Choose the right AP3K automation type, configure a comment or message trigger, review your replies, and check the live flow with this visual guide.",
    keywords: ["AP3K tutorial", "Instagram comment automation", "Instagram DM automation"],
    intro: "An automation starts with an interaction, checks your trigger, and runs the actions you enabled. Begin with one clear goal: deliver a requested link, acknowledge a comment, or answer an incoming message. Connect the intended professional Instagram account before building the flow.",
    sections: [
      { heading: "1. Choose where the conversation starts", screenshot: "automation-types", paragraphs: ["Open Automations, choose Create Automation, then select Build this flow on the appropriate card. These are three different starting points, not three stages of the same automation."], bullets: ["Comment automation: a comment on a post or Reel can trigger a public reply, a DM, or both.", "Story automation: choose the supported story interaction, such as a mention, emoji reaction, or text reply.", "DM automation: respond to a new incoming message containing a keyword, or to any eligible message."] },
      { heading: "2. Set the trigger and write the response", paragraphs: ["For a comment flow, name the automation, choose its post scope, and select Specific keyword or Any comment. If your caption asks people to comment GUIDE, configure that keyword. Turn on Reply to comment, Send a DM, or both, then replace sample messages with your own copy.", "For a story or DM flow, choose the relevant interaction or message rule in its builder, then write the response and any link buttons. Story and DM flows respond privately; they are not public comment replies."], bullets: ["Opening DM is optional in a comment flow. Leave it off when you want to send the final DM directly.", "If you enable a follow request or another optional step, test that complete path before publishing.", "Check every button label and destination URL. The final DM supports up to three labeled links."] },
      { heading: "3. Preview, publish, and test", paragraphs: ["Use the builder's phone preview to read the experience as a customer. Check the selected account, trigger, enabled actions, messages, and links, then publish. Test with a fresh, eligible interaction from another Instagram account after activation. For a comment flow, verify the public reply and DM separately.", "If a reply is missing, confirm the flow is Live, the interaction matches the saved rule, the Instagram connection is ready, and your usage allowance is available. Correct one issue and test with a new interaction."] },
      { heading: "4. Review the live automation", screenshot: "automations", paragraphs: ["Return to Automations and find the new flow. Confirm the channel, trigger, enabled actions, and Live status. Watch Runs and Leads as interactions arrive. Use Edit to change the setup or Pause to stop it. Check Inbox for the resulting conversation and Home for the wider account totals."] },
    ],
  },
  {
    ...base, slug: "set-up-ap3k-ai-visual-guide", cover: "ai-overview", visual: "workflow",
    title: "Set Up AP3K AI: Knowledge, Behavior, and Playground",
    description: "Set up AP3K AI with a four-screen tutorial: review readiness, add business knowledge, choose behavior, and test answers before enabling live replies.",
    keywords: ["AP3K tutorial", "AP3K AI", "Instagram AI replies"],
    intro: "Open AI Assistant in the sidebar to reach AP3K AI. The four tabs form a practical setup sequence: Overview, Knowledge, Behavior, and Playground. Prepare and test your answers before enabling AI in selected automations. AI features require a plan that includes them.",
    sections: [
      { heading: "1. Review readiness in Overview", screenshot: "ai-overview", paragraphs: ["Read Your AI readiness to see what remains to prepare. Open knowledge takes you to business facts; Open behavior takes you to voice and response rules. AI Replies controls DM replies and AI Comments controls comment replies at workspace level.", "These are master switches. Each automation must also opt into AI, so switching on a skill does not automatically convert every saved flow. Use Save changes after editing the configuration."] },
      { heading: "2. Add reliable business knowledge", screenshot: "ai-knowledge", paragraphs: ["In Knowledge, give each note a clear Topic and fill in Facts AI may use. Choose Add knowledge, check that the note appears under Saved knowledge, and save your changes. Keep separate notes for services, prices, delivery, policies, and frequently asked questions so updates stay simple.", "Use exact, current facts and say what the assistant should do when information is unknown. The empty state in the screenshot means no knowledge has been added yet. Do not add passwords, payment details, or private customer information."] },
      { heading: "3. Choose voice and response boundaries", screenshot: "ai-behavior", paragraphs: ["In Behavior, describe the AI role and your brand voice. Choose Fun, Friendly, or Professional as the default tone. In Guardrails & escalation, explain when to avoid guessing and when to offer human help. Keep these instructions consistent with your saved business facts.", "Review Comment protection deliberately. Skip reply and Delete are different actions: deleting affects the Instagram comment. The screenshot shows a Delete selection for insults and hate speech as an example, not a required setting. Choose what suits your moderation policy, then save."] },
      { heading: "4. Test in Playground before going live", screenshot: "ai-playground", paragraphs: ["Add at least one knowledge note, save the setup, then ask a realistic customer question in Playground. Try a follow-up and a question your notes do not answer. Check accuracy, tone, and whether the assistant respects your boundaries. Update Knowledge or Behavior and test again if needed.", "Playground conversations are saved, but they do not become live business knowledge automatically. Save useful facts explicitly as knowledge. Tests use your monthly AI allowance. When the results are ready, enable the appropriate master switch and AI option in the intended automation, save, and test the live flow."] },
    ],
  },
];

// Attach the same reviewed screenshots to the matching knowledge-base topics.
export const HELP_TUTORIALS: Record<string, { screenshots: TutorialScreenshotId[]; guide: string }> = {
  "connect-instagram": { screenshots: ["instagram-welcome", "instagram-connect", "instagram-permissions"], guide: "connect-instagram-to-ap3k" },
  "reconnect-instagram": { screenshots: ["instagram-ready", "instagram-account"], guide: "connect-instagram-to-ap3k" },
  "workspace-tour": { screenshots: ["dashboard"], guide: "ap3k-workspace-visual-guide" },
  "automation-types": { screenshots: ["automation-types"], guide: "create-ap3k-automation-visual-guide" },
  "create-automation": { screenshots: ["automations"], guide: "create-ap3k-automation-visual-guide" },
  "ai-setup": { screenshots: ["ai-overview"], guide: "set-up-ap3k-ai-visual-guide" },
  "ai-knowledge": { screenshots: ["ai-knowledge", "ai-playground"], guide: "set-up-ap3k-ai-visual-guide" },
  "ai-safety": { screenshots: ["ai-behavior"], guide: "set-up-ap3k-ai-visual-guide" },
  "contacts-leads": { screenshots: ["contacts"], guide: "ap3k-workspace-visual-guide" },
  inbox: { screenshots: ["inbox"], guide: "ap3k-workspace-visual-guide" },
  "plans-usage": { screenshots: ["billing"], guide: "ap3k-workspace-visual-guide" },
  "refer-earn": { screenshots: ["referrals"], guide: "ap3k-workspace-visual-guide" },
  "privacy-delete": { screenshots: ["settings"], guide: "ap3k-workspace-visual-guide" },
};
