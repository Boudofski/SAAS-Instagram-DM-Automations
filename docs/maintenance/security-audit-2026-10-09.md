# AP3K security review — 2026-10-09

Baseline: main `b302e3958b2bc6e929164e719dfb214eb68fbc56` (PR #227).
Scope: focused source, dependency and build-artifact review. This is not a certification or a guarantee that the project has no other vulnerabilities.

## Changes

- Isolate internal user, integration and automation database modules with `server-only`. Keep authenticated application actions as the public interface. The previous production build registered 38 internal query helpers; the new build registers none. Add source regression tests and a post-build manifest gate to prevent recurrence. Existing trusted billing/webhook callers retain direct server access.
- Minimize the automation editor response: omit the joined owner object, including Instagram credentials and internal connection diagnostics. Preserve all editor fields and server-side media refresh behavior.
- Enforce the support assistant's 25 daily attempts using an atomic, persistent per-owner UTC-day counter. Chat deletion cannot reset it; simultaneous requests cannot share the last available slot. Existing messages seed the initial counter. Use the existing daily rate-limit table with an isolated hashed namespace and two-day retention, avoiding the webhook counter's shorter cleanup interval. Block suspended support users and fail closed if reservation fails. Provider failures consume attempts, limiting repeated expensive retries.
- Enforce suspended-account denial in the AI workspace and shared AI usage reservation, including paid users and missing accounts.
- Update Vitest/coverage to 4.1.11, resolving its mock-server traversal advisory and bringing Vite to 8.3.4. Override PostCSS selector parser to patched 7.1.6. Preserve Next 15.5.27 and Tailwind 3 to avoid a framework/design migration during this security release.

## Verification

- Baseline compiled manifest exposed the internal query modules; the new manifest gate failed on that baseline and passes on the patched build.
- Regression suite covers the server boundaries, editor response, support actions and suspended AI reservations. CI runs the complete suite for the final commit.
- Lint and TypeScript checks passed; existing non-fatal UI lint warnings remain.
- Final production build passed, including the manifest boundary gate.
- Tests cover concurrent support attempts, history clearing, owner/day isolation, storage failure, suspended/unauthenticated users, provider-call prevention at the cap, and editor data minimization.
- No intrusive exploit requests, credential rotation, charge creation, account deletion or Instagram sends were used for verification.

## Boundaries examined

Reviewed authentication and ownership in account/integration/automation actions, selected-account cookie resolution, contacts/inbox queries, owner-admin guards, checkout verification, Stripe signature handling, Meta signature/OAuth state handling, scheduler authentication, upload ownership and size validation, media delivery, outbound Flow webhook URL/DNS/IP/redirect restrictions, AI allowance paths, and selected HTML/script sinks. Existing regression coverage exercises tenant isolation, signed webhooks, billing entitlements, scheduler auth and outbound webhook protections.

Tracked-file credential-pattern scan found only documented local/example database URLs and synthetic test fixtures. This is a narrow pattern scan, not a complete historical secret scan. Application media URLs are intentionally publicly retrievable by unpredictable ID so Meta can fetch attachments.

## Remaining risks and limits

- `npm audit` drops from 13 affected package nodes (8 high, 5 moderate) to 7 high nodes, all caused by **one** underlying advisory: `GHSA-vfj7-8cjw-p6xm` in `braces <=3.0.3`. Upstream lists no patched version. `npm audit --omit=dev` still reports five nodes because Tailwind's peer dependency graph classifies them as production dependencies. None of 130 generated server-route dependency traces includes `braces`; no application code imports it or accepts user-supplied build glob patterns. Keep build/dev tooling inaccessible to untrusted users and re-evaluate the upstream patch or a planned Tailwind upgrade. Do not use `npm audit fix --force`, which proposes unrelated breaking changes/downgrades.
- This review did not establish whether historical exploitation occurred. Production access-log forensics, historical Git secret scanning, database/service IAM, backups/restores, account MFA and third-party platform configuration need separate operational review. Do not claim that credentials have never been exposed or that all infrastructure is secure.
- The Security Scan plugin's required runtime/reference resources were unavailable; this review used manual source and dependency inspection instead.
- Public endpoint abuse across many independently created accounts, volumetric DDoS protection and a full external penetration test remain outside this focused release.

References: https://nextjs.org/docs/app/guides/data-security and https://github.com/advisories/GHSA-vfj7-8cjw-p6xm.

## Follow-up review after PR #228

Baseline: `a6f484efba32abdd368e77ea8cb2b8db1cc03cb3`.

Two additional confirmed authorization/abuse-control defects:

- **Suspended Inbox access:** Inbox actions authenticated the Clerk session and scoped resources to its owner, but never loaded the AP3K suspension status. An existing session could still read conversations/contacts, export contacts on a paid plan, and send manual replies. Select and check the status in the shared Inbox profile resolver before any of those operations. Existing selected-account ownership, connection, token, plan-lock and 24-hour reply-window checks remain in effect. Regression testing demonstrated a successful mocked send for a suspended profile before the fix, then denial before reads, session takeover and sending after it.
- **Premature removal of referral invitation limits:** Referral invitations have a global, per-recipient calendar-month counter in the shared `MarketingRateLimit` table, but marketing cleanup removed every counter idle for two days. Preserve current UTC-month windows during cleanup, while retaining the two-day grace period for recently used older windows. Check this month's durable invitation history across all partners within the existing serializable reservation transaction, so surviving invite records still block repeat mail if previous cleanup erased a counter. Keep the atomic counter for concurrent reservations and cases where partner invitation history is later deleted. Failed attempts remain counted, as before. Existing deleted counters whose invitation history was also deleted cannot be reconstructed by this patch.

Added regression coverage for suspended Inbox reads/exports/sends, valid manual replies, foreign conversations, the 24-hour window, disconnected/reconnect-required/plan-locked/expired integrations, cleanup across year/leap-month boundaries, prior invitations after counter loss, and eligible referral invitations. All external sends in these tests are mocked. The complete suite passes **1,957 tests in 254 files**. Lint and TypeScript checks pass with the existing non-fatal lint warnings.

This pass also revisited owner-admin identity verification, CSV formula escaping, selected-account ownership, legacy automation mutations, referral transaction guards, and billing portal ownership. No additional exploit was established in those inspected paths. This remains a focused review, with the infrastructure, historical exposure and dependency limitations above still applicable. No real account was suspended and no Instagram reply or invitation email was sent for testing. No database migration is required; hashed rate-limit rows can now remain until their month ends instead of being purged after two idle days.
