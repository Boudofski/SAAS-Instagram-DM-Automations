# AP3K engineering handoff

Verified facts only. Each section says when it was checked. Update this file instead of relying on chat history. No secrets or customer personal data belong here.

## State checked 2026-11-16

| Item | Verified value |
| --- | --- |
| `main` head | `cef84b1` (#280), deployed to Production (GitHub deployment `7796892148`, Vercel `Dk1QMmkGKrZMKoNvCswBf7d4P72r`, status success) |
| Production health | `GET https://ap3k.com/api/health` → `{"ok":true,"database":"ready"}` |
| Neon | Project `crimson-glade-62465087` has one branch only: `br-square-base-aq844tky` (production, protected). No preview branches. |
| Migrations | Latest applied: `20261115010000_comment_recipient_claim`. None rolled back. |
| CI | Red on `main` from 2026-11-08 until PR #281, which is green: 298 files, 2,247 tests, lint and type check. |
| @boudofi | Integration CONNECTED, 58 active automations, sends observed 2026-11-16. No automation has `followGateRequired` set. |

## Architecture (send paths)

Every outbound Instagram call goes through `lib/fetch.ts` (`sendDm`, `sendPrivateMessage`, `sendCommentReply`, `sendMediaComment`) or `lib/instagram-dm.ts` (`sendInstagramDirectResponse`, `sendInstagramCommentPrivateReply`). Graph version defaults to `v25.0` (`META_GRAPH_VERSION`).

| Path | Entry | Duplicate guard | Quota guard |
| --- | --- | --- | --- |
| Comment public reply + private DM | `lib/meta-webhook-handler.ts` (comment change) | `claimImmediateComment` receipt, `CommentRecipientClaim` (owner + post + person), thread replies ignored via `parent_id` | `reserveStaticUsage(units = public + DM)` |
| Delayed comment steps | `AutomationDeliveryJob` → `processAutomationDeliveries` (QStash wake + `/api/cron/automation-follow-ups`) | unique `(automationId, eventKey)`; PENDING→PROCESSING claim | reserved per step at send time |
| DM keyword / story / share | handler `messaging` branch | `isDuplicate` by message mid, `claimImmediateStory` | `reserveStaticUsage` |
| Button callbacks (follow check, opening continue) | handler configured-DM path | `hasDeliveredFinalPayload` + `claimFinalPayload` receipt (released only after a provably undelivered send) | `reserveStaticUsage` (before the claim) |
| Visual flow steps | `lib/automation-flow/runtime.ts` | advisory lock per integration + recipient (`lib/automation-tracking.ts`) | `reserveStaticUsage` |
| Engagement follow-ups / capture | `lib/automation-engagement.ts` | `AutomationEngagementJob` unique journey key | `reserveStaticUsage` |
| Conversation starters | `lib/conversation-starters-runtime.ts` | `ConversationStarterReceipt` | `reserveStaticUsage` (before the receipt) |
| Manual inbox reply | `actions/inbox/index.ts` | n/a (human action) | not quota-counted |
| Admin private-reply preflight | `lib/private-reply-preflight.ts` | admin-only | n/a |

Every automated send reserves capacity first with `reserveStaticUsage` (`lib/usage-reservation.ts`): a per-account advisory lock, a read of usage inside the transaction (logged usage plus in-flight reservations), and a `UsageReservation` row. Each send settles its unit only after its outcome is logged. Reservations lapse after ten minutes. Comment journeys reserve the public reply and DM together. Configured DMs and conversation starters reserve before their one-time claims. In-flight units count only for send decisions; dashboards and usage emails show logged usage.

Usage = SENT `MessageLog` (COMMENT_REPLY + DM, counted separately) + `DeletedReplyUsage` + SENT `ConversationStarterReceipt` + legacy event fallback, from `max(month enforcement start, usageResetAt)`. Plan limits: `lib/plan-limits.ts` (Free 500, Pro 5,000, Business 20,000/month); owner overrides live on `Subscription` and never touch Stripe.

## Invariants

- One initial public reply + DM per person per post per owner (`CommentRecipientClaim`). Never key comment dedupe per campaign only.
- A button callback releases its final payload once per journey (`final:<person>:<flow>` receipt).
- No automated public reply or DM is sent without a usage reservation, and a unit is settled only after its outcome is logged.
- Receipts are never replayed after ambiguous failures (timeouts, 5xx).
- `scripts/qstash-schedule.mjs` runs only when `VERCEL_ENV=production`, never creates a duplicate destination and never unpauses a paused schedule.
- Migrations run only in production builds (`scripts/vercel-build.mjs`). Preview builds do not touch the database or create Neon branches.

## Operational commands (read-only first)

```sql
-- Duplicate final payloads (should be zero after the claim fix)
SELECT "automationId","recipientIgId","commentId",count(*) FROM "MessageLog"
WHERE status='SENT' AND "messageType"='DM' AND "errorMessage" IN ('final_dm_payload_sent','follow_gate_payload_sent')
  AND "commentId" IS NOT NULL AND "createdAt" > now()-interval '7 days'
GROUP BY 1,2,3 HAVING count(*)>1;

-- Free accounts at or over the monthly limit
-- (see the usage definition above; include DeletedReplyUsage)
```

GitHub Actions `automation-follow-ups` and `marketing-emails` are manual fallbacks only; QStash drives the schedule.

## Open issues (ranked)

1. **Legacy callbacks without a flow ID** (`AP3K_FOLLOW_CHECK:<automationId>`) still rely on the read-only history check.
2. **DM keyword automations reply to every matching message**, including bursts (three replies within one second seen 2026-11-16). That is the current design, not a dedupe bug. Owner decision: build a per-person cooldown as a separate, per-automation configurable feature; do not change the default behavior globally.
3. **Local verification limits in agent sessions**: package installs may be blocked, so CI is the test gate. CI runs only on PRs to `main` and pushes to `main`.
4. **Ambiguous retries**: `withRetry` wraps public comment replies, and direct-message sends have no axios timeout, so an ambiguous send can be retried or hang. Review this before changing the retry policy.
