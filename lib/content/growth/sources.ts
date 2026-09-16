// Primary sources checked on 2026-09-16. Keep claims beside their evidence.
type Source = { name: string; url: string };
export const GROWTH_SOURCES: Record<string, Record<number, Source[]>> = {
  "manage-instagram-dms-and-comments-faster": {
    3: [{ name: "Instagram", url: "https://about.instagram.com/blog/announcements/instagram-ranking-explained" }],
  },
  "compare-instagram-dm-automation-tools": {
    0: [
      { name: "Manychat", url: "https://manychat.com/" },
      { name: "Chatfuel", url: "https://chatfuel.com/instagram" },
      { name: "InstaChamp", url: "https://app.mobilemonkey.com/instachamp" },
    ],
    2: [{ name: "Manychat", url: "https://manychat.com/pricing" }],
  },
  "is-instagram-dm-automation-safe": {
    1: [
      { name: "Meta · Instagram API", url: "https://developers.facebook.com/documentation/instagram-platform/private-replies" },
      { name: "Meta · Messaging", url: "https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy" },
    ],
    2: [{ name: "Instagram", url: "https://about.instagram.com/blog/announcements/instagram-ranking-explained" }],
  },
};
