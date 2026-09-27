import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { BLOG_POSTS } from './blog';
import { articleImageUrl, getArticleImage } from './blog-images';
import { buildCoverPlan, renderCoverSvg } from './blog-cover-diagram';
import { tutorialImageSrc } from './tutorial-content';

describe('article-specific covers', () => {
  it('ships a distinct, decodable local 16:9 image for every non-tutorial article', async () => {
    const posts = BLOG_POSTS.filter(post => !post.cover);
    const images = posts.map(getArticleImage);
    expect(new Set(images.map(image => image.src)).size).toBe(posts.length);
    const hashes = await Promise.all(images.map(async image => {
      expect(image.src).toMatch(/^\/images\/blog\/covers\/[a-z0-9-]+\.webp$/);
      expect(articleImageUrl(image)).toBe(`https://ap3k.com${image.src}`);
      const bytes = await readFile(`public${image.src}`);
      const metadata = await sharp(bytes).metadata();
      expect([metadata.width, metadata.height, metadata.format]).toEqual([1200, 675, 'webp']);
      return createHash('sha256').update(bytes).digest('hex');
    }));
    expect(new Set(hashes).size).toBe(posts.length);
  });
  it('keeps real tutorial screenshots instead of manufacturing product screens', () => {
    for (const post of BLOG_POSTS.filter(post => post.cover)) {
      expect(getArticleImage(post).src).toBe(tutorialImageSrc(post.cover!));
    }
  });
  it('uses the actual time-zone and handoff lessons without claiming AP3K publishes posts', () => {
    const timezone = buildCoverPlan(BLOG_POSTS.find(post => post.slug === 'instagram-scheduling-time-zone-checklist')!);
    expect(timezone.kind).toBe('clocks');
    expect(timezone.items.map(item => item.label)).toEqual(['AUDIENCE TIME', 'PUBLISHING TIME', 'VERIFY']);
    const handoff = buildCoverPlan(BLOG_POSTS.find(post => post.slug === 'instagram-scheduler-launch-handoff')!);
    expect(handoff.note).toContain('Publishing tool → launch owner → AP3K reply campaign');
  });
  it('keeps three-column thumbnails concise without clipped paragraph excerpts', () => {
    for (const post of BLOG_POSTS.filter(post => !post.cover)) {
      const plan = buildCoverPlan(post);
      if (!['flow', 'decision', 'lifecycle'].includes(plan.kind)) continue;
      for (const step of plan.items) {
        expect(step.label, post.slug).not.toContain('…');
        expect(step.detail, post.slug).not.toContain('…');
        expect(step.detail.length, post.slug).toBeLessThanOrEqual(27);
      }
    }
  });
  it('gives new CMS posts a bounded, encoded cover URL and escapes diagram text', () => {
    const post = { slug: '__proto__', title: '<script> & "New topic"', visual: 'workflow' as const };
    const image = getArticleImage(post);
    expect(image.src).toContain('/api/blog-cover?title=%3Cscript%3E');
    const plan = buildCoverPlan(post);
    expect(renderCoverSvg({ ...plan, title: post.title })).not.toContain('<script>');
    expect(renderCoverSvg({ ...plan, title: post.title })).toContain('&lt;script&gt;');
    const long = getArticleImage({ ...post, title: 'x'.repeat(900) });
    expect(new URL(long.src, 'https://ap3k.com').searchParams.get('title')!.length).toBe(160);
  });
});
