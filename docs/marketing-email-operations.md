# Launch-kit email operations

## Deployment

The additive `20260929050000_marketing_launch_kit` migration is applied by the existing production build before promotion. It creates only `MarketingLead` and its separate `MarketingRateLimit` store; it does not modify customer records, plans, or Instagram automations. The Prisma client must be regenerated.

Readiness requires production `VERCEL_ENV`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, and `CRON_SECRET`. Existing variables are reused. `AP3K_MARKETING_ENABLED=false` pauses new requests and all marketing sends. Previews never send. No additional paid service is required.

## Flow

1. Public form requires valid email, creator/store segment, and an unchecked consent box. Same-origin validation, honeypot, hashed per-IP/hour and email/day database limits protect the route. Repeated submissions do not reveal subscription status.
2. Store the versioned request and hashed random confirmation token, expiring after 48 hours. Queue the confirmation with a stable business key. Only two address requests/day and six/IP/hour are accepted; active, unsubscribed, and suppressed records cannot be overwritten by the public form.
3. The email link opens a noindex confirmation page. GET does not confirm; POST confirms and queues the kit. This avoids email scanners subscribing people.
4. Daily `/api/cron/marketing` at 05:07 UTC advances confirmed subscribers to the test lesson after day two and launch invitation after day five, with at least 24 hours between accepted lessons. Each run considers 50 eligible leads and at most 15 queued messages; revise pagination before a larger launch. The first request/kit can send immediately.
5. Stop follow-up sales messages when a matching account exists, after the final lesson, or after unsubscribe/suppression. Never automatically enroll historical AP3K users or their Instagram contacts.

## Delivery guarantees and limits

`EmailDelivery` is the durable outbox. Each stage has a unique key; compare-and-swap claims prevent concurrent workers sending the same pending item. The saved payload and provider key are reused after uncertain failures, with at most three attempts and a 23-hour window. A daily worker usually reaches a previous day's ambiguous failure outside that window: it deliberately stops for review instead of risking a duplicate. No automatic manual resend bypass is exposed.

Marketing reserves at most 30 provider attempts per UTC day, including confirmations. This leaves headroom under the observed account's 100/day limit; other apps share the provider quota, so this is not a quota guarantee. Production account limits must be reviewed before increasing it.

Every email includes the company mailing address, unsubscribe link, and RFC 8058 one-click headers. Browser GET shows an unsubscribe button; mailbox POST unsubscribes without authentication. The token is purpose-specific HMAC using `CRON_SECRET`; rotating that secret invalidates old unsubscribe links, so coordinate rotation or retain a dedicated stable signing key before changing it. Support remains available for opt-out requests. A send already accepted by the provider cannot be recalled.

Verified bounce/complaint/suppression webhooks permanently mark the prospect and prevent later events undoing that suppression. Requests also consult existing email suppression records. Provider contacts are not a second consent source: this initial sequence is owned by AP3K's database.

## Owner review

`/admin/acquisition` shows requests, confirmations, exits, opt-outs, suppressions, acquisition pages, delivery statuses, and current activation state for the last-30-day signup cohort. `/admin/emails` shows individual delivery records. Review `marketing_retry_expired`, `marketing_rejected`, and stuck pending records before promoting the kit. Check provider delivery before any manual remediation.

Do not expose recipient/token/payload metadata in public logs. Confirmation and unsubscribe pages use no-store, noindex, no-referrer, restrictive CSP, and no analytics. Keep suppression data when honoring removal requests sufficiently to avoid re-enrollment; handle full deletion requests through the existing support/privacy process.

## Tests and release evidence

Focused tests cover consent, CSRF, input validation, rate-limit rejection, no scanner side effects, confirmation expiry, signed unsubscribe, customer exit, suppression, duplicate claims, provider retry identity, expiry limits, preview isolation, pacing, and safe campaign attribution. The additive migration was also applied to isolated PGlite/PostgreSQL, checking nullable opt-in state and unique email enforcement. Live confirmation/delivery and scheduled execution must be reported separately from unit-test results.
