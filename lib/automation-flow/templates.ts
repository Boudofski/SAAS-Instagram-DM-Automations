import type { Flow, FlowNode } from "./definition";
export type Template = {
  id: string;
  name: string;
  description: string;
  goal: "followers" | "engagement" | "traffic";
  trigger: "comment" | "dm" | "story" | "live";
  type: "comment" | "affiliate" | "story" | "dm" | "ai" | "flow";
  popular?: boolean;
  pro?: boolean;
  unavailable?: string;
  keyword: string;
  steps: string[];
};
export const TEMPLATES: Template[] = [
  {
    id: "comment-links",
    name: "Auto-DM links from comments",
    description:
      "Turn a comment on your post or Reel into a personal DM with your link.",
    goal: "traffic",
    trigger: "comment",
    type: "comment",
    popular: true,
    keyword: "LINK",
    steps: [
      "Choose a post or Reel",
      "Match a comment keyword",
      "Send an opening DM",
      "Deliver your link after they reply",
    ],
  },
  {
    id: "story-leads",
    name: "Generate leads with stories",
    description: "Start a conversation when someone replies to your story.",
    goal: "engagement",
    trigger: "story",
    type: "story",
    keyword: "",
    steps: [
      "Choose a story interaction",
      "Write your response",
      "Add your destination link",
    ],
  },
  {
    id: "all-dms",
    name: "Respond to all your DMs",
    description:
      "Welcome people to your inbox with a helpful message and next step.",
    goal: "engagement",
    trigger: "dm",
    type: "dm",
    keyword: "",
    steps: [
      "Someone sends a DM",
      "Send your saved response",
      "Offer a useful link",
    ],
  },
  {
    id: "followers",
    name: "Grow followers from comments",
    description: "Invite a follow before sharing your free resource.",
    goal: "followers",
    trigger: "comment",
    type: "comment",
    keyword: "GUIDE",
    steps: [
      "Match a comment",
      "Send an opening DM",
      "Ask for a follow",
      "Check the follow and send your link",
    ],
  },
  {
    id: "affiliate",
    name: "Send affiliate product links",
    description:
      "Show a product photo, title, and links to your affiliate collaborations.",
    goal: "traffic",
    trigger: "comment",
    type: "affiliate",
    keyword: "SHOP",
    steps: [
      "Match a comment",
      "Get a reply to the opening DM",
      "Send your product card",
    ],
  },
  {
    id: "ai",
    name: "Automate conversations with AI",
    description:
      "Answer questions, collect information, and recommend your offer.",
    goal: "engagement",
    trigger: "dm",
    type: "ai",
    pro: true,
    keyword: "",
    steps: [
      "Set a conversation goal",
      "Add business context",
      "Test a conversation",
      "Choose the DM trigger",
    ],
  },
  {
    id: "product",
    name: "Auto-reply to comment in DM",
    description: "Share a product card from a comment on your post or Reel.",
    goal: "traffic",
    trigger: "comment",
    type: "affiliate",
    keyword: "PRODUCT",
    steps: ["Choose a post", "Match the keyword", "Send the product and links"],
  },
  {
    id: "dm-links",
    name: "Auto-send links in DM",
    description: "Send the right link when someone messages a keyword.",
    goal: "traffic",
    trigger: "dm",
    type: "dm",
    keyword: "LINK",
    steps: ["Match a DM keyword", "Send a message with a link"],
  },
  {
    id: "follow-freebie",
    name: "Follow first, then freebie",
    description: "Verify a follow before delivering your freebie.",
    goal: "followers",
    trigger: "comment",
    type: "comment",
    keyword: "FREEBIE",
    steps: [
      "Receive a comment",
      "Start the DM conversation",
      "Check their follow",
      "Share the freebie",
    ],
  },
  {
    id: "email",
    name: "Grow your email list",
    description:
      "Collect an email in a DM and deliver a free resource. Includes a skip path.",
    goal: "engagement",
    trigger: "dm",
    type: "flow",
    pro: true,
    keyword: "EBOOK",
    steps: [
      "Match EBOOK in a DM",
      "Ask for an email",
      "Validate and save their reply",
      "Deliver the resource",
    ],
  },
  {
    id: "giveaway",
    name: "Run a giveaway",
    description:
      "Accept one entry per person and route them through a configurable random split.",
    goal: "engagement",
    trigger: "comment",
    type: "flow",
    pro: true,
    keyword: "WIN",
    steps: [
      "Receive a WIN comment",
      "Ask them to enter in the DM",
      "Record one entry per person",
      "Send the random outcome",
    ],
  },
  {
    id: "youtube",
    name: "Grow your YouTube",
    description:
      "Invite interested Instagram viewers to your video or channel.",
    goal: "traffic",
    trigger: "comment",
    type: "comment",
    keyword: "VIDEO",
    steps: [
      "Match a comment",
      "Start the conversation",
      "Send your YouTube link",
    ],
  },
  {
    id: "ai-questions",
    name: "Recognize questions in DM with AI",
    description: "Use your business context to answer incoming questions.",
    goal: "engagement",
    trigger: "dm",
    type: "ai",
    pro: true,
    keyword: "",
    steps: [
      "Add FAQ context",
      "Set response boundaries",
      "Test questions in preview",
    ],
  },
  {
    id: "collabs",
    name: "Get more collabs from Story replies",
    description:
      "Ask a brand what it needs and guide it to your collaboration offer.",
    goal: "engagement",
    trigger: "story",
    type: "flow",
    pro: true,
    keyword: "",
    steps: [
      "Receive a story reply",
      "Ask about the collaboration",
      "Share the matching offer",
    ],
  },
  {
    id: "coupons",
    name: "Give coupons in stories",
    description:
      "Send a discount link after someone interacts with your story.",
    goal: "traffic",
    trigger: "story",
    type: "story",
    keyword: "",
    steps: [
      "Choose the story interaction",
      "Write your coupon message",
      "Add your shop link",
    ],
  },
  {
    id: "whatsapp",
    name: "Go from Instagram to WhatsApp",
    description:
      "Invite someone to continue the conversation through your WhatsApp link.",
    goal: "traffic",
    trigger: "dm",
    type: "dm",
    keyword: "WHATSAPP",
    steps: [
      "Match a DM keyword",
      "Send your wa.me link",
      "They choose whether to open WhatsApp",
    ],
  },
  {
    id: "sell-reels",
    name: "Sell from Reel comments",
    description: "Turn product questions under a Reel into a product-card DM.",
    goal: "traffic",
    trigger: "comment",
    type: "affiliate",
    keyword: "SHOP",
    steps: [
      "Choose your Reel",
      "Match the shopping keyword",
      "Send the product card",
    ],
  },
  {
    id: "rsvp",
    name: "Turn comments into RSVPs",
    description:
      "Ask about attendance, collect an email, and send the registration link.",
    goal: "engagement",
    trigger: "comment",
    type: "flow",
    pro: true,
    keyword: "JOIN",
    steps: [
      "Match a JOIN comment",
      "Ask if they want to attend",
      "Collect their email",
      "Send the registration link",
    ],
  },
  {
    id: "quiz",
    name: "Qualify with a quiz",
    description:
      "Ask a question and route each answer to a different recommendation.",
    goal: "engagement",
    trigger: "dm",
    type: "flow",
    pro: true,
    keyword: "QUIZ",
    steps: [
      "Match a DM keyword",
      "Ask a multiple-choice question",
      "Save the answer",
      "Send the matching recommendation",
    ],
  },
  {
    id: "course",
    name: "DM your course like a closer",
    description: "Learn their experience level and share the course that fits.",
    goal: "traffic",
    trigger: "dm",
    type: "flow",
    pro: true,
    keyword: "COURSE",
    steps: [
      "Receive a COURSE DM",
      "Ask their experience level",
      "Recommend the right course",
    ],
  },
  {
    id: "story-faq",
    name: "Answer FAQs from story replies",
    description:
      "Offer a short menu of common questions with a different answer for each.",
    goal: "engagement",
    trigger: "story",
    type: "flow",
    pro: true,
    keyword: "",
    steps: [
      "Receive a story reply",
      "Show the FAQ options",
      "Send the selected answer",
    ],
  },
  ...[
    "Gamify Instagram live",
    "Send offers in DMs during Live",
    "Trigger DMs during IG Live",
  ].map((name, i): Template => ({
    id: `live-${i}`,
    name,
    description: "Start conversations from Instagram Live comments.",
    goal: "engagement",
    trigger: "live",
    type: "flow",
    pro: true,
    keyword: "LIVE",
    unavailable:
      "Instagram Live triggers are not connected to AP3K yet. This template cannot be activated.",
    steps: ["Live comment trigger", "Send the requested information"],
  })),
  {
    id: "sms",
    name: "Grow an SMS list",
    description: "Direct interested people to your SMS signup page.",
    goal: "engagement",
    trigger: "dm",
    type: "dm",
    keyword: "SMS",
    steps: [
      "Receive an SMS keyword",
      "Send your signup-page link",
      "Collect SMS consent on that page",
    ],
  },
];
export function templateById(id?: string) {
  return TEMPLATES.find((t) => t.id === id);
}
const message = (
  id: string,
  label: string,
  text: string,
  x: number,
  y: number,
  next: string | null = null,
): FlowNode => ({ id, kind: "message", label, text, links: [], x, y, next });
export function templateFlow(id?: string): Flow {
  if (id === "giveaway")
    return {
      version: 1,
      entry: "split",
      oncePerContact: true,
      nodes: [
        {
          id: "split",
          kind: "random",
          label: "Random outcome",
          percent: 5,
          yes: "winner",
          no: "thanks",
          x: 80,
          y: 120,
        },
        message(
          "winner",
          "Selected outcome",
          "Your entry was selected! Reply to this conversation so our team can confirm the details.",
          440,
          60,
        ),
        message(
          "thanks",
          "Thank you",
          "Thanks for entering! You were not selected this time. We appreciate your support.",
          440,
          330,
        ),
      ],
    };
  if (id === "email" || id === "rsvp") {
    const nodes: FlowNode[] = [
      {
        id: "email",
        kind: "email",
        label: "Collect email",
        text: "Where should we send your resource? Reply with your email address.",
        next: "delivery",
        skip: "delivery",
        x: 100,
        y: 120,
      },
      message(
        "delivery",
        "Deliver your link",
        "Thanks! Here is the resource you requested.",
        460,
        120,
      ),
    ];
    if (nodes[1].kind === "message")
      nodes[1].links = [
        { label: id === "rsvp" ? "Register" : "Get the resource", url: "" },
      ];
    if (id === "rsvp") {
      nodes.unshift({
        id: "rsvp",
        kind: "question",
        label: "Attendance",
        text: "Would you like to join our event?",
        field: "attendance",
        options: [
          { label: "Yes, please", next: "email" },
          { label: "Not now", next: "end" },
        ],
        x: 80,
        y: 100,
      });
      nodes[1].x = 440;
      nodes[2].x = 800;
      nodes.push({ id: "end", kind: "end", label: "Finish", x: 440, y: 400 });
    }
    return {
      version: 1,
      entry: id === "rsvp" ? "rsvp" : "email",
      oncePerContact: false,
      nodes,
    };
  }
  if (["quiz", "course", "collabs", "story-faq"].includes(id ?? ""))
    return {
      version: 1,
      entry: "question",
      oncePerContact: false,
      nodes: [
        {
          id: "question",
          kind: "question",
          label: "Learn what they need",
          text:
            id === "story-faq"
              ? "What would you like to know?"
              : "Which option best describes what you need?",
          field: "interest",
          options: [
            { label: "Getting started", next: "beginner" },
            { label: "Advanced help", next: "advanced" },
          ],
          x: 80,
          y: 140,
        },
        message(
          "beginner",
          "Getting started",
          "Here is a good place to start. What else would you like to know?",
          450,
          60,
        ),
        message(
          "advanced",
          "Advanced help",
          "We can help you take the next step. Reply here and our team will help.",
          450,
          360,
        ),
      ],
    };
  return {
    version: 1,
    entry: "welcome",
    oncePerContact: false,
    nodes: [
      message(
        "welcome",
        "Welcome message",
        "Hi! Thanks for reaching out. How can we help?",
        100,
        140,
      ),
    ],
  };
}
