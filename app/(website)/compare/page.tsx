import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import WebsiteNav from "@/components/global/website-nav";
import WebsiteFooter from "@/components/global/website-footer";
import { COMPARISONS, comparisonPath } from "@/lib/comparisons";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
import s from "@/components/website/comparison.module.css";
export function generateMetadata() {
  return localizedMetadata(
    {
      title: "Compare Instagram Automation Tools | AP3K",
      description:
        "Compare AP3K with ManyChat, CreatorFlow, LinkDM and other creator tools. Understand features, usage limits and which workflow fits your business.",
    },
    "/compare",
    "en",
  );
}

const comparisonListSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Instagram automation tool comparisons",
  url: "https://ap3k.com/compare",
  description:
    "Independent decision criteria and first-party AP3K comparisons for Instagram automation tools.",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: COMPARISONS.map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `AP3K vs ${page.name}`,
      url: `https://ap3k.com${comparisonPath(page)}`,
    })),
  },
};

export default function CompareIndex() {
  return (
    <div className={s.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(comparisonListSchema).replace(/</g, "\\u003c"),
        }}
      />
      <WebsiteNav />
      <main className={s.main} lang="en" translate="no">
        <Breadcrumbs items={[{ name: "Compare", path: "/compare" }]} />
        <header className={s.indexHero}>
          <span className={s.eyebrow}>FIND YOUR FIT</span>
          <h1>
            Your workflow.
            <br />
            <span>The right tool.</span>
          </h1>
          <p>
            Compare AP3K with Instagram automation tools, creator storefronts
            and broader business platforms. Start with the job you need done,
            then compare the actual experience.
          </p>
          <div className={s.actions}>
            <Link href="/sign-up" className={s.primary}>
              Try AP3K Free <ArrowRight size={18} />
            </Link>
            <Link
              href="/tutorials/instagram-comment-to-dm"
              className={s.secondary}
            >
              <Play size={17} /> Watch AP3K in action
            </Link>
          </div>
        </header>
        <section>
          <h2>Compare the workflow before the feature list</h2>
          <p>
            Start with one real Instagram campaign. Write down the trigger, the
            public reply, the private message, the destination link and the
            result you need to measure. A platform with hundreds of features is
            still the wrong choice when it makes that core journey difficult to
            build, test or understand.
          </p>
          <p>
            AP3K focuses on Instagram comment, Story and DM workflows for
            professional accounts. Some alternatives support more channels,
            deeper branching, larger teams or broader CRM functions. Those can
            be valid reasons to choose them. Compare the complete job rather
            than counting features you will not use.
          </p>
        </section>
        <section>
          <h2>Check these five points in every Instagram automation tool</h2>
          <ol>
            <li><strong>Connection method:</strong> use supported Instagram authorization and never share your Instagram password with an automation service.</li>
            <li><strong>Trigger coverage:</strong> confirm the exact comment, Story or incoming-message event your campaign requires.</li>
            <li><strong>Usage model:</strong> compare contacts, successful actions, messages, AI allowances and connected-account limits separately.</li>
            <li><strong>Testing and recovery:</strong> verify that you can test a fresh interaction, inspect failures, pause a campaign and reconnect an expired authorization.</li>
            <li><strong>Measurement:</strong> distinguish delivered messages from clicks, qualified leads, bookings and purchases.</li>
          </ol>
        </section>
        <section>
          <h2>Use the free plan as a product test</h2>
          <p>
            Build one small campaign against a real post. Test it from another
            Instagram account, confirm the public reply and DM arrive, open the
            destination on a phone and review the recorded activity. Then price
            the paid plan using your expected monthly volume. AP3K Free includes
            one connected Instagram account, up to five active automations and
            500 automated actions per month; current allowances for every plan
            are listed on the <Link href="/pricing">pricing page</Link>.
          </p>
          <p>
            Vendor plans and Meta capabilities change. Each comparison states
            what AP3K supports and links to relevant first-party information
            where available. Verify a competitor’s current price and eligibility
            directly before purchasing or migrating.
          </p>
        </section>
        <h2>All comparisons</h2>
        <div className={s.relatedGrid}>
          {COMPARISONS.map((page) => (
            <Link
              className={s.relatedCard}
              href={comparisonPath(page)}
              key={page.slug}
            >
              <strong>
                AP3K vs {page.name}
                <ArrowRight size={17} aria-hidden="true" />
              </strong>
              <span>{page.focus}</span>
            </Link>
          ))}
        </div>
        <section className={s.finalCta}>
          <h2>See how AP3K fits.</h2>
          <p>
            Start free with one account and 500 automated actions per month.
          </p>
          <div className={s.actions}>
            <Link href="/sign-up" className={s.primary}>
              Join for free <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
