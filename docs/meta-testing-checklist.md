# AP3k — Meta Webhook Testing Checklist

## Required Vercel Environment Variables

| Variable | Purpose |
|----------|---------|
| `META_VERIFY_TOKEN` | Webhook verification token (matches what you set in Meta Developers) |
| `META_APP_ID` | Facebook App ID (from Meta Developers → App Settings → Basic) |
| `META_APP_SECRET` | Facebook App Secret (used to sign/verify webhook payloads) |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_HOST_URL` | Production URL e.g. `https://ap3k.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |

Optional (fallback secrets for signature verification):
| `INSTAGRAM_APP_SECRET` | Fallback if META_APP_SECRET is not set |
| `INSTAGRAM_CLIENT_SECRET` | Additional fallback |

---

## Step 1 — Verify Route Health

```
GET https://ap3k.com/api/webhooks/meta/health
```

Expected response:
```json
{
  "ok": true,
  "route": "/api/webhooks/meta",
  "webhookUrl": "https://ap3k.com/api/webhooks/meta",
  "hasMetaVerifyToken": true,
  "hasMetaAppSecret": true,
  "timestamp": "..."
}
```

If `hasMetaVerifyToken` or `hasMetaAppSecret` are `false`, check Vercel environment variables.

---

## Step 2 — Verify GET Challenge Endpoint

```
GET https://ap3k.com/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=<YOUR_META_VERIFY_TOKEN>&hub.challenge=123456
```

Expected response: plain text `123456` with HTTP 200.

If you get 403, the `META_VERIFY_TOKEN` in Vercel does not match.

---

## Step 3 — Run Admin Signed Self-Test

1. Go to `/admin` (or `/ap3k-admin`)
2. Click **Run webhook self-test**
3. Expected result: `ok: true`, `responseStatus: 200`

This proves the deployed route accepts correctly signed POST payloads.
If it fails, check `META_APP_SECRET` is set and the route is deployed.

---

## Step 4 — Meta Developers Configuration

### Webhook Setup
1. Go to Meta Developers → Your App → Instagram API → API setup with Facebook login
2. Open **Configure webhooks**
3. Set **Callback URL**: `https://ap3k.com/api/webhooks/meta`
4. Set **Verify Token**: value of `META_VERIFY_TOKEN` in Vercel
5. Click **Verify and Save** — this triggers a GET that should appear in admin as `PROCESSED`
6. Subscribe **comments** field
7. Subscribe **messages** field

> **Important**: Do NOT use the **User** object/product for Instagram comment automation.
> Use the **Instagram** or **Page** object (whichever Meta shows for your setup in the API configuration).

### App Mode
- If app is in **Development mode**, only accepted testers can trigger real webhooks.
- Add testers: Meta Developers → App Roles → Testers (Facebook user) AND Instagram Tester (Instagram account).
- Alternatively, submit for App Review to go Live.

---

## Step 5 — Meta Test Button

In Meta Developers → Webhooks → Send Test, click the test button for the `comments` field.

Expected: Admin shows a `META_TEST_EVENT` event (not `REAL_COMMENT_EVENT` — this is expected for fake test payloads).

---

## Step 6 — Real Comment Test

Prerequisites:
- Connected Instagram account: `@ceptice` (or your account)
- Facebook Page ID: `100121532610908`
- IG Business ID: `17841451766608292`
- Active campaign with: Any post, keyword `ai`, matching CONTAINS

Steps:
1. From a **separate** Instagram account (not `@ceptice`), that is accepted as a tester:
2. Find any real post/Reel owned by `@ceptice`
3. Comment `ai` on that post
4. Wait 30–60 seconds
5. Refresh admin page

Expected pipeline:
- `WEBHOOK_POST_RECEIVED_RAW` appears
- `REAL_COMMENT_EVENT` appears (not META_TEST_EVENT)
- `WEBHOOK_RECEIVED` automation event
- `KEYWORD_MATCHED` automation event
- Lead created
- `DM_SENT` or `DM_FAILED` with reason in MessageLog

---

## Interpreting Admin Diagnostics

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| No `WEBHOOK_POST_RECEIVED_RAW` | Meta is not delivering to AP3k | Check callback URL in Meta dashboard, check app is Live or tester accepted, check correct webhook object/product selected |
| `SIGNATURE_FAILED` | Wrong app secret | Check `META_APP_SECRET` in Vercel matches the App Secret in Meta Developers → App Settings → Basic |
| `REAL_COMMENT_EVENT` with `no_matching_integration` | Entry ID does not match stored Page/IG ID | Reconnect Instagram and check that the Page ID stored matches what Meta sends in `entry.id` |
| `REAL_COMMENT_EVENT` with `no_active_automation_for_media` | No campaign matches this post/keyword | Create an active campaign with Any post and the keyword |
| `KEYWORD_MATCHED` but `DM_FAILED` | DM send failed | Check error message in MessageLog — usually permission, rate limit, or messaging window issue |
| Meta Test button works, real comment does not arrive | App Development mode + commenter not a tester | Add commenter as Instagram Tester in Meta Developers → App Roles |

---

## Meta Dashboard Subscription Warning

AP3k currently operates in **Meta Dashboard Managed** subscription mode because `pages_manage_metadata` is not available in the app permissions.

This means the **Webhook Subscription toggle** must be manually confirmed ON in Meta Developers for the connected Instagram account. AP3k cannot subscribe programmatically without that permission.

Manual steps:
1. Meta Developers → Your App → Instagram API → Webhooks
2. Find the connected Instagram account
3. Confirm the toggle is ON
4. Confirm `comments` and `messages` fields are subscribed

---

## OAuth Scopes (Facebook Login for Business)

Requested scopes (do not change):
```
pages_show_list
pages_read_engagement
business_management
instagram_basic
instagram_manage_comments
instagram_manage_messages
```

Do NOT add:
- `pages_manage_metadata` — not available in Meta app permissions UI
- `instagram_business_basic` — wrong scope family for this OAuth product
- `instagram_business_manage_comments` — wrong scope family
- `instagram_business_manage_messages` — wrong scope family
- `instagram_content_publish` — not needed for comment-to-DM MVP
