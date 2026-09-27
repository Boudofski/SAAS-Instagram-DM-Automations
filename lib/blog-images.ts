import type { BlogPost } from "./blog";
import { TUTORIAL_SCREENSHOTS, tutorialImageSrc } from "./tutorial-content";
export type ArticleImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit?: string;
  source?: string;
};
const photo = (
  id: string,
  alt: string,
  credit: string,
  source: string,
): ArticleImage => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1440&h=810&q=80`,
  alt,
  width: 1440,
  height: 810,
  credit,
  source,
});
// Original photo pages explicitly offer the free Unsplash License.
export const ARTICLE_PHOTOS = {
  messages: photo(
    "photo-1746014602184-d60f0ebba68b",
    "A person checking their phone beside a coffee cup",
    "Swello",
    "https://unsplash.com/photos/Utnsb59SJds",
  ),
  creator: photo(
    "photo-1764664035176-8e92ff4f128e",
    "Camera, microphone and monitor in a content creator’s recording setup",
    "Detail .co",
    "https://unsplash.com/photos/HENZpJ-KWg0",
  ),
  social: photo(
    "photo-1603145733146-ae562a55031e",
    "A smartphone displaying social media apps beside a glass of coffee",
    "Nathan Dumlao",
    "https://unsplash.com/photos/kLmt1mpGJVg",
  ),
  analytics: photo(
    "photo-1595374827334-4be516468272",
    "Laptop displaying an analytics dashboard beside coffee and a plant",
    "Blake Wisz",
    "https://unsplash.com/photos/SK5jOjXxGRA",
  ),
  planning: photo(
    "photo-1506784242126-2a0b0b89c56a",
    "An open planner and pen for organizing a content schedule",
    "Estée Janssens",
    "https://unsplash.com/photos/mO3s5xdo68Y",
  ),
  commerce: photo(
    "photo-1585221330389-24fb30535ec7",
    "Product packaging boxes arranged on a table",
    "Packhelp",
    "https://unsplash.com/photos/V3YnFyZSG5Q",
  ),
};
export function getArticleImage(
  post: Pick<BlogPost, "slug" | "title" | "visual" | "cover">,
): ArticleImage {
  if (post.cover) {
    const image = TUTORIAL_SCREENSHOTS[post.cover];
    return {
      src: tutorialImageSrc(post.cover),
      alt: image.caption,
      width: image.width,
      height: image.height,
    };
  }
  const topic = `${post.slug} ${post.title}`.toLowerCase();
  if (
    /shop|ecommerce|e-commerce|product|sale|affiliate|offer|checkout|discount/.test(
      topic,
    )
  )
    return ARTICLE_PHOTOS.commerce;
  if (/schedul|calendar|plan|checklist|campaign|launch|template/.test(topic))
    return ARTICLE_PHOTOS.planning;
  if (
    /analytic|metric|track|compar|alternative|tool|pricing|cost|roi|test|conversion/.test(
      topic,
    )
  )
    return ARTICLE_PHOTOS.analytics;
  if (/reel|creator|coach|content|story|stories|video/.test(topic))
    return ARTICLE_PHOTOS.creator;
  if (
    /connect|safe|permission|account|api|troubleshoot|error|limit|rule/.test(
      topic,
    )
  )
    return ARTICLE_PHOTOS.social;
  return post.visual === "analytics"
    ? ARTICLE_PHOTOS.analytics
    : ARTICLE_PHOTOS.messages;
}
export const articleImageUrl = (image: ArticleImage) =>
  image.src.startsWith("https://") ? image.src : `https://ap3k.com${image.src}`;
