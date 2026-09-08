import CommercialLandingPage from "@/components/website/commercial-landing-page";
import { COMMERCIAL_PAGES, getCommercialPage } from "@/lib/commercial-pages";
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
  const languages = page.slug === "instagram-dm-automation"
    ? { "en-US": pathname, ar: "/ar/instagram-dm-automation", "x-default": pathname }
    : undefined;

  return {
    title: `${page.title} | AP3K`,
    description: page.description,
    keywords: [page.eyebrow, "Instagram automation", "AP3K"],
    alternates: { canonical: pathname, languages },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}${pathname}`,
      siteName: "AP3K",
      type: "website",
      images: [{ url: `${SITE_URL}${page.media}`, width: 1156, height: 2056, alt: page.mediaAlt }],
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [`${SITE_URL}${page.media}`] },
  };
}

export default function CommercialPageRoute({ params }: Props) {
  const page = getCommercialPage(params.slug);
  if (!page) notFound();
  return <CommercialLandingPage page={page} />;
}
