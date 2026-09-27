import Link from "next/link";
import WebsiteNav from "@/components/global/website-nav";
import WebsiteFooter from "@/components/global/website-footer";
import { COMPARISONS, comparisonPath } from "@/lib/comparisons";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
import s from "@/components/website/public-pages.module.css";
export function generateMetadata() { return localizedMetadata({ title: "Compare Instagram Automation Tools | AP3K", description: "Compare AP3K with ManyChat, CreatorFlow, LinkDM and other creator tools. Understand features, usage limits and which workflow fits your business." }, "/compare", "en"); }
export default function CompareIndex() { return <div className={s.page}><WebsiteNav /><main className={s.article} lang="en" translate="no"><span className={s.badge}>COMPARE</span><h1>Find the right tool for your Instagram workflow.</h1><p>Side-by-side guides to Instagram automation and creator platforms. Compare what each tool is built for, how usage works and what to test before you commit.</p><h2>All comparisons</h2><div className={s.related}>{COMPARISONS.map(page => <Link href={comparisonPath(page)} key={page.slug}>AP3K vs {page.name} →<p>{page.focus}</p></Link>)}</div><section className={s.cta}><h2>See how AP3K fits.</h2><p>Start free with one account and 500 automated actions per month.</p><Link href="/sign-up" className={s.button}>Join for free</Link></section></main><WebsiteFooter /></div>; }
