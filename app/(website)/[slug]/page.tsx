import { localizedMetadata } from "@/lib/i18n/page-metadata";
import CommercialLandingPage from "@/components/website/commercial-landing-page";
import { COMMERCIAL_PAGES, getCommercialPage } from "@/lib/commercial-pages";
import { getServerLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const SITE_URL = "https://ap3k.com";
type Props = { params: { slug: string } };

export function generateStaticParams() {
  return COMMERCIAL_PAGES.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = getCommercialPage(params.slug);
  if (!page) return {};
  const pathname = `/${page.slug}`;
  const isEnglish = getServerLocale() === "en";
  const seoTitle = isEnglish && page.slug === "instagram-comment-to-dm"
    ? "Instagram Comment-to-DM Automation | AP3K"
    : `${page.title} | AP3K`;
  const seoDescription = isEnglish && page.slug === "instagram-comment-to-dm"
    ? "Automate Instagram comment-to-DM campaigns with keyword triggers, public replies and instant link delivery. Start free with AP3K."
    : page.description;
  return localizedMetadata({
    title: seoTitle,
    description: seoDescription,
    keywords: page.slug === "instagram-comment-to-dm"
      ? ["Instagram comment to DM automation", "comment to DM Instagram", "Instagram auto DM from comments", "Instagram comment automation", "AP3K"]
      : [page.eyebrow, "Instagram automation", "AP3K"],
    alternates: { canonical: pathname },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `${SITE_URL}${pathname}`,
      siteName: "AP3K",
      type: "website",
      images: [{ url: `${SITE_URL}${page.media}`, width: 1156, height: 2056, alt: page.mediaAlt }],
    },
    twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [`${SITE_URL}${page.media}`] },
  }, pathname);
}

export default function CommercialPageRoute({ params }: Props) {
  const page = getCommercialPage(params.slug);
  if (!page) notFound();
  return <CommercialLandingPage page={page} />;
}
