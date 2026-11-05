import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsonLdScript } from 'next-seo';
import { buildBlogStructuredData } from './blog-structured-data';
import { BLOG_POSTS } from './blog';
import { SUPPORTED_LOCALES, localizePublicPath } from './i18n/config';
const context = vi.hoisted(() => ({ locale: 'en' }));
vi.mock('./i18n/server', () => ({ getServerLocale: () => context.locale }));
import Breadcrumbs from '../components/seo/breadcrumbs';
const image = { url: 'https://ap3k.com/images/test.webp', width: 1200, height: 800 };
function schemas(html: string) {
  return Array.from(html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g), m => JSON.parse(m[1]));
}
describe('next-seo integration', () => {
  it('preserves editorial facts and uses the localized canonical as the article identity', () => {
    const post = BLOG_POSTS.find(p => !p.contentLocale)!;
    for (const locale of SUPPORTED_LOCALES) {
      const data = buildBlogStructuredData(post, locale, image);
      expect(data.url).toBe('https://ap3k.com'+localizePublicPath('/blog/'+post.slug, locale));
      expect(data['@id']).toBe(data.url+'#article');
      expect(data.mainEntityOfPage['@id']).toBe(data.url);
      expect(data.datePublished).toBe(post.publishedAt);
      expect(data.dateModified).toBe(post.updatedAt);
      expect(data.image.width).toBe(1200);
      expect(data.isAccessibleForFree).toBe(true);
      expect(data.isPartOf['@id']).toBe('https://ap3k.com'+localizePublicPath('/blog',locale));
    }
  });
  it('keeps English-only article identity English despite a saved foreign language', () => {
    const post = BLOG_POSTS.find(p => p.slug === 'instagram-dm-automation-2027-launch-checklist')!;
    const data = buildBlogStructuredData(post, 'ar', image);
    expect(data.inLanguage).toBe('en');
    expect(data.url).toBe('https://ap3k.com/blog/'+post.slug);
  });
  it('renders one parseable article and escapes script-breaking content', () => {
    const title = 'Example </script><script>alert(1)</script>';
    const data = buildBlogStructuredData({...BLOG_POSTS[0], title, contentLocale:'en'}, 'en', image);
    const html = renderToStaticMarkup(<JsonLdScript data={data} scriptKey="article" />);
    expect(schemas(html)).toHaveLength(1);
    expect(schemas(html)[0].headline).toBe(title);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).not.toContain('</script><script>');
  });
  it('renders a single localized breadcrumb schema matching visible navigation', () => {
    for (const locale of SUPPORTED_LOCALES) {
      context.locale=locale;
      const html=renderToStaticMarkup(<Breadcrumbs items={[{name:'Blog',path:'/blog'}]} />);
      const [schema]=schemas(html);
      expect(schemas(html)).toHaveLength(1);
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement.map((x: {position:number}) => x.position)).toEqual([1,2]);
      expect(schema.itemListElement[1].item).toBe('https://ap3k.com'+localizePublicPath('/blog',locale));
      expect(html).toContain('aria-current="page"');
    }
  });
});
