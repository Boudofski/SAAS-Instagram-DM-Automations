import Link from "next/link";
import WebsiteNav from "@/components/global/website-nav";
import WebsiteFooter from "@/components/global/website-footer";
import AP3KLogo from "@/components/global/ap3k-logo";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import {
  COMPARISONS,
  comparisonPath,
  type Comparison,
} from "@/lib/comparisons";
import s from "./public-pages.module.css";

export default function ComparisonPage({ page }: { page: Comparison }) {
  const path = comparisonPath(page);
  const faqs = [
    {
      question: `Is AP3K a ${page.name} alternative?`,
      answer: `For Instagram comment replies, link delivery and lead capture, AP3K is an option to evaluate. ${page.decision}`,
    },
    {
      question: "Can I test AP3K before paying?",
      answer:
        "Yes. Free includes one Instagram account, five active automations and 500 successful automated actions each month. No credit card is required. AI replies and custom canvas publishing are paid features.",
    },
    {
      question: "Can I move an existing campaign to AP3K?",
      answer:
        "Recreate the trigger, message and destination in AP3K, then test from another Instagram account. Turn off overlapping rules in your previous tool before activating the replacement. AP3K does not promise an automatic import of another platform’s flows or contacts.",
    },
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `AP3K vs ${page.name}: which fits your Instagram workflow?`,
    description: page.description,
    datePublished: "2026-09-27",
    dateModified: "2026-09-27",
    author: { "@type": "Organization", name: "AP3K", url: "https://ap3k.com" },
    mainEntityOfPage: `https://ap3k.com${path}`,
    image: "https://ap3k.com/opengraph-image",
  };
  return (
    <div className={s.page}>
      <WebsiteNav />
      <main className={s.article} lang="en" translate="no">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
        <Breadcrumbs
          items={[
            { name: "Compare", path: "/compare" },
            { name: page.name, path },
          ]}
        />
        <div className={s.byline}>
          <AP3KLogo markClassName="h-6 w-6" />
          <span>September 27, 2026 · AP3K editorial team</span>
        </div>
        <h1>
          {page.name} alternative: AP3K vs {page.name}
        </h1>
        <p>{page.description}</p>
        <div className={s.note}>
          <p>
            <strong>At a glance.</strong> {page.decision}
          </p>
        </div>
        <div className={s.stats}>
          {[
            ["$0", "Free plan"],
            ["$9", "Pro / month"],
            ["500", "Free actions / month"],
            ["10", "Accounts on Business"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <h2>What is {page.name}?</h2>
        <p>{page.overview}</p>
        <h2>Where AP3K fits</h2>
        <p>
          AP3K connects an Instagram Business or Creator account to a workspace
          for automations, contacts and conversations. You choose the
          interaction that starts a campaign, write its public reply or DM and
          add the link you want to deliver. Templates cover common campaigns;
          paid custom flows add branching conversations when a single message is
          not enough.
        </p>
        <p>
          The important unit is an automated action: one successfully sent
          public reply or DM. A campaign that sends both uses two actions.
          Failed and skipped sends do not count. This makes it possible to
          estimate usage from the actual messages in your campaign.
        </p>
        <h2>AP3K vs {page.name}: feature comparison</h2>
        <div
          className={s.tableWrap}
          tabIndex={0}
          role="region"
          aria-label={`${page.name} comparison table`}
        >
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">AP3K</th>
                <th scope="col">{page.name}</th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td>{row.ap3k}</td>
                  <td>{row.other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Campaign setup and day-to-day work</h2>
        <p>
          In AP3K, start with the Instagram trigger and the resource your
          audience asked for. Add a clear public reply if useful, then write the
          DM and destination. Message variations help you keep the same offer
          while changing the wording. Pro and Business include AI-assisted copy
          and replies within their plan limits.
        </p>
        <p>
          Test the entire conversation, including a person who has not messaged
          the account before. Review successful sends, skipped actions and
          failures in the workspace. Instagram permissions and messaging rules
          still apply regardless of which provider you choose.
        </p>
        <h2>Pricing: compare the same workload</h2>
        <p>
          AP3K Free includes 500 monthly actions, one Instagram account and five
          active automations. Pro is $9 monthly or $79 yearly, with 5,000
          monthly actions, 500 AI replies and three accounts. Business is $29
          monthly or $279 yearly, with 20,000 monthly actions, 2,000 AI replies
          and ten accounts. Paid plans include unlimited active automations;
          usage allowances still apply.
        </p>
        <p>
          Annual billing does not turn the monthly allowance into a yearly pool.
          Compare your expected message volume, required accounts and paid
          features with{" "}
          <a
            href={page.sources[0].href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {page.name}’s current offer
          </a>
          . Different products count contacts, messages and actions differently.
        </p>
        <h2>Which one should you choose?</h2>
        <div className={s.two}>
          <section>
            <h3>Choose AP3K when</h3>
            <ul>
              <li>Instagram replies and DMs are the main job.</li>
              <li>
                You want to keep your current website, checkout or booking
                links.
              </li>
              <li>
                You prefer plans with explicit account and monthly action
                limits.
              </li>
            </ul>
          </section>
          <section>
            <h3>Consider {page.name} when</h3>
            <p>{page.strength}</p>
          </section>
        </div>
        <h2>Frequently asked questions</h2>
        {faqs.map((faq) => (
          <section key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </section>
        ))}
        <h2>The verdict</h2>
        <p>{page.decision}</p>
        <p>
          Start with one real campaign and a normal month’s expected volume. A
          useful trial should answer whether the tool delivers the promised
          resource, gives you clear reporting and fits the way your team works.
        </p>
        <h2>Explore other comparisons</h2>
        <div className={s.related}>
          {COMPARISONS.filter((item) => item.slug !== page.slug).map((item) => (
            <Link href={comparisonPath(item)} key={item.slug}>
              AP3K vs {item.name} →
            </Link>
          ))}
        </div>
        <h2>Sources and methodology</h2>
        <p>
          This comparison is published by AP3K. Competitor descriptions were
          checked against the official pages below on September 27, 2026; they
          are not a claim of hands-on testing of every plan. Confirm current
          terms with the provider before subscribing.
        </p>
        <ul>
          {page.sources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
            </li>
          ))}
          <li>
            <Link href="/pricing">AP3K plans and allowances</Link>
          </li>
        </ul>
        <section className={s.cta}>
          <h2>Try your first campaign with AP3K.</h2>
          <p>500 automated actions each month. No credit card required.</p>
          <Link href="/sign-up" className={s.button}>
            Join for free
          </Link>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
