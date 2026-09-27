import { notFound, permanentRedirect } from "next/navigation";
import { COMPARISONS, getComparison, comparisonPath } from "@/lib/comparisons";
import ComparisonPage from "@/components/website/comparison-page";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
export function generateStaticParams() { return COMPARISONS.map(page => ({ slug: page.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }) { const page = getComparison(params.slug); return page ? localizedMetadata({ title: `AP3K vs ${page.name}: Instagram Automation Compared`, description: page.description, openGraph: { images: ["https://ap3k.com/opengraph-image"] } }, comparisonPath(page), "en") : {}; }
export default function CompareRoute({ params }: { params: { slug: string } }) { const page = getComparison(params.slug); if (!page) notFound(); if (page.slug === "manychat") permanentRedirect("/manychat-alternative"); return <ComparisonPage page={page} />; }
