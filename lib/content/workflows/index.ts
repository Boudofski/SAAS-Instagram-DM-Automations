import set1 from "./guides-1.json";
import set2 from "./guides-2.json";
import set3 from "./guides-3.json";
import set4 from "./guides-4.json";
import { articleMetrics } from "@/lib/article-metrics";
import type { BlogPost, BlogSection } from "@/lib/blog-catalog";

export const WORKFLOW_RELEASE = "2026-11-27";
export const WORKFLOW_GUIDES = [...set1, ...set2, ...set3, ...set4];

const categories: Record<string, string> = {
  Campaign: "Instagram Campaigns",
  Delivery: "Instagram DM Delivery",
  Operations: "Automation Operations",
  Measurement: "Campaign Measurement",
};

const withSetupVideo = new Set([
  "instagram-dm-set-up-qa-fixtures",
  "instagram-automation-multiple-offer-ownership",
]);

export const WORKFLOW_POSTS: BlogPost[] = WORKFLOW_GUIDES.map(guide => {
  const sections: BlogSection[] = guide.stages.map((stage, i) => ({
    heading: stage.heading,
    paragraphs: [stage.body],
    ...(i === 1 && withSetupVideo.has(guide.slug) ? { video: true } : {}),
  }));
  sections.push({
    heading: "What to watch for",
    paragraphs: [guide.caution],
    links: [{ label: "Open the companion worksheet", href: `/resources/${guide.resource}` }],
  });
  return {
    slug: guide.slug, title: guide.title, description: guide.description,
    intro: guide.intro, sections, contentLocale: "en",
    publishedAt: WORKFLOW_RELEASE, updatedAt: WORKFLOW_RELEASE,
    category: categories[guide.track] ?? "Instagram Automation",
    keywords: [],
    visual: "workflow",
    visualAlt: `${guide.title} — three practical steps`,
    visualCaption: "AP3K workflow illustration",
    related: WORKFLOW_GUIDES.filter(item => item.resource === guide.resource && item.slug !== guide.slug).map(item => item.slug),
    ...articleMetrics(guide.intro, sections),
  };
});
