# ReplyFlow AI

Turn Instagram comments into leads automatically. ReplyFlow AI sends personalised DMs the moment someone comments a keyword on your post — no manual work required.

---

## Features

- **Comment → DM automation** — trigger a private DM when a keyword is spotted in a comment
- **3 matching modes** — Exact, Contains, and Smart AI (OpenAI-powered intent matching)
- **Template variables** — `{{username}}`, `{{first_name}}`, `{{keyword}}`, `{{link}}` in every DM
- **Optional public reply** — reply to the comment thread at the same time
- **Lead tracking** — every triggered DM is saved as a lead with full event log
- **Analytics** — per-automation stats: triggers, DMs sent, replies sent, leads captured
- **Stripe billing** — FREE (3 automations) and PRO (unlimited) plans

---

## Tech Stack

Next.js 14 · TypeScript · Prisma (PostgreSQL) · Clerk (auth) · Stripe · Meta Graph API · OpenAI · Tailwind CSS · React Query · Vitest

---

## Local Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a hosted DB — Neon, Supabase, etc.)
- A [Meta Developer account](https://developers.facebook.com) with an app
- A [Clerk account](https://clerk.com) with an application
- A [Stripe account](https://stripe.com) in test mode
- (Optional) An [OpenAI API key](https://platform.openai.com) for Smart AI matching

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd SAAS-Instagram-DM-Automations
npm install
```

### 3. Environment Variables

Copy the example and fill in all values:

```bash
cp .env.example .env.local
```

See `.env.example` for the full list with inline documentation. Every variable must be set before running `npm run dev`.

### 4. Database

```bash
# Apply migrations and generate the Prisma client
npx prisma migrate deploy
npx prisma generate
```

To inspect the database locally:

```bash
npx prisma studio
```

### 5. Run Locally

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Meta Developer Setup

### Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**
2. Choose **Business** type
3. Add the **Instagram** product to your app

### Configure OAuth

1. Under **Instagram → Basic Display**, add an OAuth redirect URI:
   ```
   http://localhost:3000/callback/instagram
   ```
2. Copy your **App ID** → `INSTAGRAM_CLIENT_ID` and `META_APP_ID`
3. Copy your **App Secret** → `INSTAGRAM_CLIENT_SECRET` and `META_APP_SECRET`

### Configure the Webhook

You need a public HTTPS URL for Meta to send events. Use [ngrok](https://ngrok.com) in development:

```bash
# Install ngrok, then:
ngrok http 3000
```

Copy the `https://xxxx.ngrok.io` URL.

1. Under **Instagram → Webhooks**, add a new subscription:
   - **Callback URL:** `https://xxxx.ngrok.io/api/webhooks/meta`
   - **Verify Token:** the value you set in `META_VERIFY_TOKEN`
2. Subscribe to `comments` and `messages` fields

Meta will make a GET request to verify the URL — the handler at `/api/webhooks/meta` responds to this automatically.

### Test Accounts

During development, add your personal Instagram account as a **Test User** in the Meta app so it can receive webhooks without going through App Review.

---

## Stripe Setup

### Test Mode Keys

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → API Keys**
2. Copy the **Secret key** (`sk_test_...`) → `STRIPE_CLIENT_SECRET`
3. Copy the **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Create a Price

1. Go to **Products → Add Product** → create a recurring monthly product
2. Copy the **Price ID** (`price_...`) → `STRIPE_SUBSCRIPTION_PRICE_ID`

### Stripe Webhook (Local)

```bash
# Install Stripe CLI, then:
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the **webhook signing secret** it prints → `STRIPE_WEBHOOK_SECRET`

Events handled:
- `checkout.session.completed` — upgrades user to PRO
- `customer.subscription.created` — syncs a new subscription if it arrives before/after checkout completion
- `customer.subscription.updated` — syncs plan status
- `customer.subscription.deleted` — downgrades to FREE

---

## Running Tests

```bash
npm test           # run once
npm run test:watch # watch mode
```

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import repository
2. Framework: **Next.js** (auto-detected)

### 3. Set Environment Variables

In Vercel → Project → Settings → Environment Variables, add every variable from `.env.example` with production values. Key differences from local:

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_HOST_URL` | `https://ap3k.com` |
| `META_REDIRECT_URI` | `https://ap3k.com/callback/instagram` |
| `INSTAGRAM_EMBEDDED_OAUTH_URL` | Full Instagram OAuth URL with `redirect_uri=https://ap3k.com/callback/instagram` |
| `STRIPE_WEBHOOK_SECRET` | Secret from Vercel webhook endpoint (see below) |

### 4. Stripe Webhook (Production)

1. Go to Stripe → **Developers → Webhooks → Add endpoint**
2. URL: `https://ap3k.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel env vars

### 5. Meta Webhook (Production)

Update the webhook callback URL in Meta Developer Console:

```text
https://ap3k.com/api/webhooks/meta
```

Use the same verify token value that is stored in `META_VERIFY_TOKEN`.

---

## Project Structure

```
app/
  (website)/          # Public pages: landing, pricing
  (auth)/             # Clerk sign-in / sign-up
  (protected)/        # Auth-gated: dashboard, onboarding, callback
    dashboard/[slug]/ # Per-user slug: campaigns, integrations, settings
    onboarding/       # First-run flow: connect Instagram
  api/
    webhooks/meta/    # Meta comment + DM webhook (GET verify, POST events)
    webhooks/stripe/  # Stripe subscription lifecycle webhook
actions/              # Next.js Server Actions (DB writes + reads)
components/global/    # Reusable UI: wizard-stepper, dm-editor, stat-card, etc.
hooks/                # Client state: use-wizard, use-automation, etc.
lib/                  # Utilities: prisma client, stripe proxy, openai, fetch helpers
prisma/               # Schema + migrations
```

---

## Known Limitations

- **Plan enforcement** — FREE plan limit (3 automations) is tracked in the DB schema but not yet enforced on the backend. Activation is not blocked for FREE users. Marked as TODO.
- **Story reply automations** — the DB schema supports story reply triggers but the wizard UI does not expose them.
- **Token refresh** — Instagram long-lived tokens expire after 60 days. Automatic refresh is not implemented; users will need to reconnect when the token expires.
- **Smart AI matching** — requires a valid `OPENAI_API_KEY`. If missing or the call fails, the automation silently skips the DM.
