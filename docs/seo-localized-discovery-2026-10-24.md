# French, Spanish and German search discovery — 24 October 2026

## Evidence before release

Google Search Console URL Inspection reports historical index state, not a live test. The following 18 canonical URLs were inspected through the connected AP3K property.

| Page | French | Spanish | German |
| --- | --- | --- | --- |
| Homepage | Crawled, currently not indexed | Crawled, currently not indexed | Indexed |
| Blog archive | Indexed | Indexed | Crawled, currently not indexed |
| Instagram automation guide | Discovered, currently not indexed | Discovered, currently not indexed | Indexed |
| Pricing | Discovered, currently not indexed | Discovered, currently not indexed | Discovered, currently not indexed |
| Send a link after a comment | Indexed | Indexed | Indexed |
| Comment automation troubleshooting | Indexed | Indexed | Indexed |

The French and Spanish homepage inspection records were last crawled on 19 October, before the previous release. The German guide was crawled on 23 October and indexed. No sampled fetched page reported a robots or noindex block. Three additional prefixed variants of the English-only `instagram-comment-to-dm-automation` article were unknown to Google; these are intentionally redirected to English and are not candidate translated pages.

This is not evidence of a site-wide language penalty. Nor does it establish why Google omitted an individual eligible URL.

## Root cause addressed

The localized blog archive mixed 16 translated articles with hundreds of English-only articles and produced 40 archive pages per language. Translating the heading and navigation did not translate those articles. This also made local-language search operate on English source titles.

The archive now filters the published collection by actual language availability before applying search, featured selection, pagination, topic directories and structured-data lists. French, Spanish, German and Portuguese each have 16 translated articles across two pages. English retains the full article collection. An explicitly labeled English-archive link keeps other material reachable without presenting it as translated content.

Canonical and hreflang generation now advertises only archive pages that exist in each language. The sitemap decreases from 893 to 741 URLs by removing 152 surplus localized pagination URLs. No article URL was deleted. Out-of-range archive pages return not found; they are not redirected to an unrelated page.

The homepage now links directly to localized link-delivery, lead-generation and troubleshooting articles, the complete automation guide and the local blog. Related-article recommendations stay within the available language collection. Article publication dates are unchanged; only the materially changed homepages and archives receive the release's last-modified date.

## Translation and technical checks

Regression coverage verifies that every available article is discoverable, hidden/noindex articles stay excluded, translated title searches work, pagination and sitemap agree, and localized homepage guide destinations exist. Translation-key coverage checks titles, descriptions, introductions, section headings, paragraphs, bullets and step copy longer than 30 characters for all 16 articles in French, Spanish, German and Portuguese. This detects missing translations; it is not a claim of independent native-speaker proofreading of every sentence.

`scripts/audit-localized-seo.py` provides a bounded, read-only production check of every French, Spanish and German sitemap URL, including HTTP status, redirects, canonical, HTML language, robots directives, H1 and alternate-language destinations. Its output distinguishes live eligibility from actual Google indexing.

## Indexing expectations

Google decides whether and when to index eligible pages. The existing sitemap is already known to Search Console. IndexNow notifications are discovery notifications for participating search engines, not Google indexing requests. Do not use Google's restricted Indexing API for ordinary SaaS/blog pages, submit fake dates, or make authentication, search-result and duplicate URLs indexable merely to increase indexed counts.

After recrawling, compare the French and Spanish homepage status, German archive status, localized pricing coverage and non-branded query performance against this baseline. Prioritize useful translations of proven acquisition content over mass-producing more URL variants.

Official reference: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
