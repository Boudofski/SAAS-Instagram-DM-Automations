# Optional Google Indexing API utility

Installed separately from AP3K's production application: `google-indexing-script@0.4.0`.
Source: https://github.com/goenning/google-indexing-script

## Applicability

Do not run this against AP3K's domain, sitemap, articles, product pages, documentation or ordinary tutorial videos. Google limits this API to genuine JobPosting pages and livestream pages with BroadcastEvent embedded in VideoObject. AP3K's current public content is not eligible. Adding those types to unrelated content would be misleading. No publishing job, credential setup or automatic submission is enabled.

Official requirements: https://developers.google.com/search/apis/indexing-api/v3/quickstart

Installation: `npm ci --prefix tools/google-indexing --ignore-scripts`
Offline CLI check: `tools/google-indexing/node_modules/.bin/gis --help`

If AP3K later publishes genuinely eligible pages, review the source and current Google requirements, provision a narrowly scoped service account, and submit only verified eligible URLs. Never commit credentials or put private keys in command arguments.

## Current AP3K indexing workflow

For articles and landing pages, use the existing Search Console sitemap submission, internal links, canonical URLs, translated hreflang and URL Inspection. URL Inspection reports index status; it does not guarantee indexing. No general-purpose bulk request-indexing API is provided by this package.

The application uses Next.js generateMetadata for titles, descriptions, canonicals and language alternates, and next-seo for article JSON-LD serialization and breadcrumb structured data. These serve different purposes and must not produce duplicate article entities or duplicate metadata.
