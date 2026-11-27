/** Curated AP3K uploads. Keep the setup walkthrough separate from short demos. */
export const PRODUCT_VIDEOS = {
  overview: {
    id: "-Cbp5n78vfU",
    title: "AP3K Instagram automation — quick demo",
    description: "A short introduction to AP3K. Use the full setup walkthrough for step-by-step instructions.",
    duration: "About 1 minute",
  },
  tutorial: {
    id: "e09JHohNC_s",
    title: "Create an Instagram comment-to-DM automation",
    description: "Choose a post, set keywords, add a public reply and DM, then review and publish.",
    duration: "2 minutes 45 seconds",
  },
} as const;

// Intentional placements, not a video attached indiscriminately to every post.
export const QUICK_DEMO_POSTS = new Set([
  "ap3k-workspace-visual-guide",
  "connect-instagram-to-ap3k",
]);
