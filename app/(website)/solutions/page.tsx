import Link from "next/link";
import WebsiteNav from "@/components/global/website-nav";
import WebsiteFooter from "@/components/global/website-footer";
import { SOLUTIONS } from "@/lib/solutions";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
import s from "@/components/website/public-pages.module.css";
export function generateMetadata() {
  return localizedMetadata(
    {
      title: "Instagram Automation Solutions | AP3K",
      description:
        "Grow your Instagram audience, deliver product links and keep conversations moving with AP3K automation workflows.",
    },
    "/solutions",
    "en",
  );
}
export default function SolutionsIndex() {
  return (
    <div className={s.page}>
      <WebsiteNav />
      <main className={s.article} lang="en" translate="no">
        <span className={s.badge}>SOLUTIONS</span>
        <h1>Build conversations around your goals.</h1>
        <p>
          Start with the outcome you want, then choose a useful Instagram
          interaction to automate.
        </p>
        {SOLUTIONS.map((page) => (
          <section key={page.slug}>
            <h2>
              <Link href={`/solutions/${page.slug}`}>{page.label} →</Link>
            </h2>
            <p>{page.description}</p>
          </section>
        ))}
        <section className={s.cta}>
          <Link href="/sign-up" className={s.button}>
            Join for free
          </Link>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
