import type { BlogPost } from './blog';
import { getEditorialArchive } from './blog-archive';
import { getBlogPage, blogPagePath } from './blog-pagination';
import { filterBlogPosts } from './blog-search';
import { localizedLocalesForPath, localizePublicPath, type Locale } from './i18n/config';
import { translateUi } from './i18n/translate';

/** A translated heading does not make an English article a localized article. */
export function blogPostsForLocale(posts: BlogPost[], locale: Locale) {
  return posts.filter(post => (!post.contentLocale || post.contentLocale === locale) &&
    localizedLocalesForPath(`/blog/${post.slug}`).includes(locale));
}

export function getLocalizedBlogArchive(posts: BlogPost[], locale: Locale, query = '') {
  const archive = getEditorialArchive(blogPostsForLocale(posts, locale));
  if (!query) return archive;
  // Search the words visitors actually see, including accents and local terms.
  const matches = new Set(filterBlogPosts(archive.posts.map(post => ({
    ...post,
    title: translateUi(post.title, locale),
    description: translateUi(post.description, locale),
    category: translateUi(post.category, locale),
    keywords: post.keywords.map(word => translateUi(word, locale)),
  })), query).map(post => post.slug));
  return { featured: [], posts: archive.posts.filter(post => matches.has(post.slug)) };
}

/** Never advertise a language alternate whose archive page does not exist. */
export function blogArchiveAlternates(posts: BlogPost[], page: number): Partial<Record<Locale | 'x-default', string>> {
  const path = blogPagePath(page);
  const locales = localizedLocalesForPath('/blog').filter(locale =>
    getBlogPage(String(page), getEditorialArchive(blogPostsForLocale(posts, locale)).posts.length));
  return {
    ...Object.fromEntries(locales.map(locale => [locale, `https://ap3k.com${localizePublicPath(path, locale)}`])),
    ...(locales.includes('en') ? { 'x-default': `https://ap3k.com${path}` } : {}),
  };
}
