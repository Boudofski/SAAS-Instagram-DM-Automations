# AP3K engineering handoff

Verified facts only. Each section says when it was checked. Update this file instead of relying on chat history. No secrets or customer personal data belong here.

## State checked 2026-11-16

| Item | Verified value |
| --- | --- |
| `main` head | `cef84b1` (#280), deployed to Production (GitHub deployment `7796892148`, Vercel `Dk1QMmkGKrZMKoNvCswBf7d4P72r`, status success) |
| Production health | `GET https://ap3k.com/api/health` → `{"ok":true,"database":"ready"}` |
| Neon | Project `crimson-glade-62465087` has one branch only: `br-square-base-aq844tky` (production, protected). No preview branches. |
| Migrations | Latest applied: `20261115010000_comment_recipient_claim`. None rolled back. |
| CI | Red on `main` since 2026-11-08. Lint passes; 4 tests fail (see Open issues); type check was skipped as a result. |
| @boudofi | Integration CONNECTED, 58 active automations, sends observed 2026-11-16. No automation has `followGateRequired` set. |

## Architecture (send paths)

Every outbound Instagram call goes through `lib/fetch.ts` (`sendDm`, `sendPrivateMessage`, `sendCommentReply`, `sendMediaComment`) or `lib/instagram-dm.ts` (`sendInstagramDirectResponse`, `sendInstagramCommentPrivateReply`). Graph version defaults to `v25.0` (`META_GRAPH_VERSION`).

| Path | Entry | Duplicate guard | Quota guard |
| --- | --- | --- | --- |
| Comment public reply + private DM | `lib/meta-webhook-handler.ts` (comment change) | `claimImmediateComment` receipt, `CommentRecipientClaim` (owner + post + person), thread replies ignored via `parent_id` | `canSendStaticReply(units = public + DM)` |
| Delayed comment steps | `AutomationDeliveryJob` → `processAutomationDeliveries` (QStash wake + `/api/cron/automation-follow-ups`) | unique `(automationId, eventKey)`; PENDING→PROCESSING claim | re-checked at send |
| DM keyword / story / share | handler `messaging` branch | `isDuplicate` by message mid, `claimImmediateStory` | `canSendStaticReply` |
| Button callbacks (follow check, opening continue) | handler configured-DM path | `hasDeliveredFinalPayload` + **`claimFinalPayload` receipt** (added in `fix/final-payload-claim`) | `canSendStaticReply` |
| Visual flow steps | `lib/automation-flow/runtime.ts` | advisory lock per integration + recipient (`lib/automation-tracking.ts`) | `canSendStaticReply` |
| Engagement follow-ups / capture | `lib/automation-engagement.ts` | `AutomationEngagementJob` unique journey key | `canSendStaticReply` |
| Conversation starters | `lib/conversation-starters-runtime.ts` | `ConversationStarterReceipt` | `canSendStaticReply` |
| Manual inbox reply | `actions/inbox/index.ts` | n/a (human action) | not quota-counted |
| Admin private-reply preflight | `lib/private-reply-preflight.ts` | admin-only | n/a |

Usage = SENT `MessageLog` (COMMENT_REPLY + DM, counted separately) + `DeletedReplyUsage` + SENT `ConversationStarterReceipt` + legacy event fallback, from `max(month enforcement start, usageResetAt)`. Plan limits: `lib/plan-limits.ts` (Free 500, Pro 5,000, Business 20,000/month); owner overrides live on `Subscription` and never touch Stripe.

## Invariants

- One initial public reply + DM per person per post per owner (`CommentRecipientClaim`). Never key comment dedupe per campaign only.
- A button callback releases its final payload once per journey (`final:<person>:<flow>` receipt).
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

1. **Static quota is check-then-send, not reserved.** `canSendStaticReply` counts SENT logs, and the log is written after the Graph call. Concurrent webhooks for one account at its limit can each pass. No production overshoot found (2026-11-16: the only Free account near the limit is at exactly 500). Fix design: a per-user advisory-locked reservation row, as `reserveAiReplyQuota` does for AI, consumed on SENT and released on definite failure. All send paths in the table must use it.
2. **CI test `lib/article-metrics.test.ts`** fails because a revised SEO article in `lib/content/seo-revisions.ts` has 356 words (threshold 500). This is a content gap: expand the article with real material. Do not lower the threshold or pad it.
3. **Legacy callbacks without a flow ID** (`AP3K_FOLLOW_CHECK:<automationId>`) still rely on the read-only history check.
4. **DM keyword automations reply to every matching message**, including bursts (three replies within one second seen 2026-11-16). That is the current design, not a dedupe bug. Decide whether a short per-person cooldown is wanted.
5. **Local verification limits in agent sessions**: package installs may be blocked, so CI is the test gate. CI runs only on PRs to `main` and pushes to `main`.
