import { Facebook, Linkedin } from 'lucide-react';
import styles from './blog-editorial.module.css';

export function ArticleShare({ slug, title }: { slug: string; title: string }) {
  const url = encodeURIComponent(`https://ap3k.com/blog/${slug}`);
  return <section className={styles.shareTools} aria-label="Share this article">
    <p>SHARE THIS ARTICLE</p>
    <div>
      <a href={`https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(title)}`} aria-label="Share on X (Twitter)" target="_blank" rel="noopener noreferrer">𝕏</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} aria-label="Share on Facebook" target="_blank" rel="noopener noreferrer"><Facebook size={20} /></a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} aria-label="Share on LinkedIn" target="_blank" rel="noopener noreferrer"><Linkedin size={20} /></a>
    </div>
  </section>;
}
