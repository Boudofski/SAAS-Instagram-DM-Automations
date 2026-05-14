# ReplyFlow AI — Launch Checklist

## Development Readiness

- [ ] `npm run build` exits 0 (no TypeScript errors, no pre-render failures)
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx eslint . --max-warnings 0` exits 0
- [ ] `npm test` — all tests pass (currently 20/20)
- [ ] `npx prisma validate` exits 0 (requires `DATABASE_URL`)
- [ ] `npx prisma migrate status` — no pending migrations
- [ ] `.env.local` has all variables set (compare with `.env.example`)
- [ ] `npm run dev` starts without errors

## User Flow Verification (Manual)

Walk through this flow end-to-end with real credentials before launch:

- [ ] Sign up via Clerk — user + subscription row created in DB
- [ ] Redirected to `/onboarding` on first login
- [ ] Connect Instagram OAuth — integration row saved, token stored
- [ ] Redirected to `/onboarding/complete` → dashboard
- [ ] Create automation via wizard (all 6 steps complete)
- [ ] Automation appears in campaign list with status **Inactive**
- [ ] Activate automation — status flips to **Active**
- [ ] Campaign detail page shows 4 stat cards
- [ ] Trigger a comment on the linked post with the configured keyword
- [ ] DM arrives in the test account's inbox
- [ ] Lead row appears in DB (`Lead` table)
- [ ] Analytics stats increment on the detail page
- [ ] Navigate to `/pricing` → click Upgrade → Stripe checkout opens
- [ ] Complete test payment (`4242 4242 4242 4242`) → plan upgrades to PRO in DB
- [ ] Cancel subscription in Stripe dashboard → plan downgrades to FREE

## Meta Integration

- [ ] Meta app has Instagram product added
- [ ] OAuth redirect URI registered: `<HOST>/callback/instagram`
- [ ] Webhook callback URL registered: `<HOST>/api/webhooks/meta`
- [ ] Webhook verify token matches `META_VERIFY_TOKEN` in env
- [ ] `comments` and `messages` webhook fields subscribed
- [ ] Webhook GET verification passes (Meta sends a challenge)
- [ ] Webhook POST events received and processed (check server logs)
- [ ] Test Instagram account added as Test User in Meta app

## Stripe Integration

- [ ] `STRIPE_CLIENT_SECRET` is set (test or live)
- [ ] `STRIPE_SUBSCRIPTION_PRICE_ID` points to a valid recurring price
- [ ] `STRIPE_WEBHOOK_SECRET` matches the registered webhook endpoint
- [ ] Webhook endpoint registered for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Test payment upgrades user plan to PRO (verify in DB)
- [ ] Subscription cancellation downgrades user plan to FREE (verify in DB)

## Security

- [ ] `CLERK_SECRET_KEY` is not exposed in client-side code
- [ ] `STRIPE_CLIENT_SECRET` is not exposed in client-side code
- [ ] `META_APP_SECRET` is not exposed in client-side code
- [ ] Meta webhook verifies `META_VERIFY_TOKEN` on GET requests
- [ ] Stripe webhook verifies `stripe-signature` header
- [ ] No `.env.local` or `.env` committed to git (check `.gitignore`)
- [ ] `DATABASE_URL` not hardcoded anywhere in source

## Production Deployment (Vercel)

- [ ] All environment variables set in Vercel project settings
- [ ] `NEXT_PUBLIC_HOST_URL` = `https://ap3k.com` (no trailing slash)
- [ ] `META_REDIRECT_URI` = `https://ap3k.com/callback/instagram`
- [ ] `INSTAGRAM_EMBEDDED_OAUTH_URL` updated with production redirect URI
- [ ] First deployment completes without build errors
- [ ] Database migrations applied against production DB (`prisma migrate deploy`)
- [ ] Stripe webhook updated to production URL
- [ ] Meta webhook updated to production URL
- [ ] Sign-up → connect → create automation flow works on production domain

## Meta App Review (Before Public Launch)

Required before real (non-test) Instagram accounts can use the app:

- [ ] App is in **Live** mode (not Development)
- [ ] `instagram_manage_messages` permission submitted for review
- [ ] `instagram_manage_comments` permission submitted for review
- [ ] Screencast demo of the automation flow prepared for review submission
- [ ] Privacy policy URL set in Meta app settings
- [ ] Terms of service URL set in Meta app settings
- [ ] App icon and description filled in

## Known TODOs (Post-Launch)

- [ ] Enforce FREE plan limit (3 automations) in `activate` server action
- [ ] Implement Instagram token refresh (tokens expire after 60 days)
- [ ] Add story reply trigger support in the automation wizard
- [ ] Add error UI when Smart AI matching fails (currently silent)
- [ ] Rate-limit webhook handler to prevent abuse
