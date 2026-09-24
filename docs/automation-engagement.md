# Comment automation engagement

The comment builder now places expandable public replies, follow requests, optional email capture, and a single follow-up below the final message. Existing automations default to the old behavior. The affiliate card and links remain unchanged.

## Delivery order

Comment → opening DM → user taps → optional verified follow → optional email request → final text/product card → optional reminder.

Enabling an engagement step enables Opening DM. Turning Opening DM off turns off its dependent steps. Email capture accepts a whole email address, SKIP (deliver without email), or STOP (cancel). Captured emails appear in the account-scoped Contacts page; this does not create a marketing subscription. Existing email addresses for the campaign skip repeat collection.

Follow-ups are one reminder after at least the configured delay, if there has been no new reply or other outbound inbox message. They reuse saved link buttons. They do not infer link clicks. Timing is approximate. Checks include active campaign, connected account, account suspension, plan lock, message allowance, and the original 24-hour inbound messaging window. Paused/expired jobs are cancelled. An ambiguous send is never automatically retried.

## Deployment

Production `scripts/vercel-build.mjs` applies `20260924050000_automation_engagement` before building. Do not activate these options with code that predates that migration.

`.github/workflows/automation-follow-ups.yml` calls the production queue every five minutes (offset from the start of the hour). It uses GitHub OIDC, not a stored app credential. The endpoint validates RS256 signature, issuer, exact audience, expiry, immutable repository/owner IDs, main branch, workflow path, and schedule/manual event. It also accepts the existing CRON_SECRET for an alternative scheduler. It does not accept pull-request identities or identities from forks. No checkout or third-party action runs in the job.

After deployment, confirm a successful scheduled or manual workflow run. The editor enables new follow-ups only after a recent scheduler heartbeat (20 minutes). GitHub schedules can be delayed, and GitHub can disable schedules after prolonged repository inactivity; monitor the workflow. If reminders require a strict timing SLA, use a dedicated scheduler calling the same endpoint with CRON_SECRET. Existing pending jobs still fail closed outside the Instagram window.

## Verification

Run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Tests cover email/skip behavior, account scope, claim races, closed messaging windows, scheduler trust, quota and human-takeover cancellation, and webhook payload separation.

The sample-only UI fixture can be built outside public/ with `node scripts/automation-ui-preview/build.mjs /tmp/ap3k-engagement-preview`. It has no server actions and sends no DMs. It is not an application route.

## Sources

- https://developers.facebook.com/documentation/business-messaging/instagram-messaging/features/private-replies
- https://developers.facebook.com/documentation/business-messaging/instagram-messaging/overview
- https://docs.github.com/en/actions/reference/security/oidc
- https://docs.github.com/en/actions/how-tos/troubleshoot-workflows
