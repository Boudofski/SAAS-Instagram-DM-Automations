# QStash automation scheduler

QStash can wake AP3K's existing follow-up, delayed-message, and flow queues without Vercel Pro. This integration adds a signed POST handler; the existing authenticated GET handler and GitHub fallback remain available during cutover. Nothing is scheduled merely by deploying the code.

## Configuration

1. In the intended Upstash account, select QStash's Free plan and one region. Copy that region's current and next signing keys directly into Vercel Production as sensitive `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` variables. Do not expose them in chat, commits, screenshots, or logs. AP3K does not need the QStash publishing token.
2. Deploy the integration with those variables. The POST handler rejects preview deployments, unsigned requests, wrong keys, expired tokens, a different issuer/destination, or a changed request body.
3. Create one schedule, checking for an existing AP3K schedule first:
   - Name/ID: `ap3k-automation-follow-ups`
   - Destination: `https://ap3k.com/api/cron/automation-follow-ups`
   - Method: POST
   - Body: empty
   - Cron: `*/5 * * * *` (UTC)
   - Retries: 1
   - Timeout: 60 seconds
   - No custom Authorization header and no contact data in the request.

At five-minute intervals this creates 288 initial requests/day, up to 576 attempts/day if every request retries once. Keep other QStash traffic within the account's shared 1,000/day free allowance. Normal Vercel function and Neon database usage still applies.

## Verify before retiring the old schedule

Confirm a signed request succeeds, then observe at least two automatic executions approximately five minutes apart. Responses must be HTTP 200 with `ok: true`; inspect `flowFailed` and worker logs as well. Confirm a fresh `AutomationSchedulerHeartbeat` and that the editor no longer reports an unavailable scheduler. Any actual DM delivery test must use controlled test accounts.

Workers retain database claims, messaging-window enforcement, plan/account checks, and cancellation when a conversation moves on. QStash can redeliver a request, so those claims remain essential. Five minutes is a polling interval, not a strict delivery guarantee. Ambiguous provider failures are not automatically replayed.

After cadence is verified, remove the `schedule` event from `.github/workflows/automation-follow-ups.yml` while keeping `workflow_dispatch` as manual recovery. Until then, leave the fallback enabled.

## Rollback

Pause the QStash schedule; retain the GitHub fallback. If rolling back to code without POST support, pause QStash first to avoid repeated 405 errors. When rotating signing keys, update both production values and deploy before retiring the old key.

Official references: https://upstash.com/docs/qstash/howto/signature, https://upstash.com/docs/qstash/features/security, https://upstash.com/docs/qstash/features/schedules, and https://upstash.com/pricing/qstash.
