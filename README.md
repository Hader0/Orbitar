# Orbitar

Orbitar is a Chrome extension + SaaS backend that helps users refine their AI prompts.

## Project Structure

- `backend/`: Next.js App Router application (SaaS dashboard & API).
- `extension/`: Chrome Extension (Manifest V3).

## Prerequisites

- Node.js 18+ (Recommended: v20)
- SQLite (for local dev) or PostgreSQL (for production)
- Stripe CLI (for dev/test webhooks): https://stripe.com/docs/stripe-cli

## Backend Setup (Local Dev)

1. Install dependencies

```bash
cd backend
npm install
```

2. Environment variables

- Copy `.env.example` to `.env` in `backend/` and fill in values:

```env
# Database (SQLite for dev)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-dev-secret"

# OpenAI
OPENAI_API_KEY="sk-..."

# Base URL for building redirect URLs
ORBITAR_API_BASE_URL="http://localhost:3000"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs for subscriptions (create two test prices in your Stripe dashboard)
STRIPE_PRICE_BUILDER="price_..."
STRIPE_PRICE_PRO="price_..."
```

3. Database migrations

```bash
npx prisma migrate dev
```

4. Run the dev server

```bash
npm run dev
```

- Next.js dev server runs on http://localhost:3000

## OpenAI Integration (Local Dev)

- The `/api/refine-prompt` route:
  - Auth via API key (Authorization: Bearer orb\_...).
  - Enforces per-plan daily limits (free/builder/pro).
  - Uses OpenAI (default model: gpt-4o-mini) to rewrite the input prompt using `modelStyle` + `template`.
  - Checks `process.env.OPENAI_API_KEY` and returns `{ error: "OpenAI API key not configured." }` with status 500 if missing.
  - Uses the official OpenAI Node SDK; falls back to `fetch` if the SDK call fails.

Ensure `OPENAI_API_KEY` is set in `backend/.env`.

## Stripe Integration (Dev/Test Mode)

The backend provides:

- POST `/api/stripe/checkout`:
  - Body: `{ plan: "builder" | "pro" }`
  - Creates or reuses a Stripe customer for the logged-in user.
  - Starts a subscription Checkout Session using `STRIPE_PRICE_BUILDER` or `STRIPE_PRICE_PRO`.
  - Redirect URLs:
    - success -> `http://localhost:3000/dashboard?checkout=success`
    - cancel -> `http://localhost:3000/dashboard?checkout=cancel`
- POST `/api/webhooks/stripe`:
  - Verifies signature using `STRIPE_WEBHOOK_SECRET` and raw request body.
  - Handles `checkout.session.completed` and `customer.subscription.updated/created/deleted`.
  - Updates `User.plan` based on the subscribed price, and persists subscription id/status:
    - `stripeSubscriptionId`, `stripeSubscriptionStatus`
    - `stripeCustomerId` is set on first checkout.

User model fields (Prisma):

- `stripeCustomerId`, `stripeSubscriptionId`, `stripeSubscriptionStatus`

### Stripe CLI (required for webhooks in dev)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login:

```bash
stripe login
```

3. Listen and forward webhooks to the backend:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- The CLI prints a `whsec_...` value; paste it into `STRIPE_WEBHOOK_SECRET` in your `backend/.env`.
- Ensure `STRIPE_SECRET_KEY`, `STRIPE_PRICE_BUILDER`, and `STRIPE_PRICE_PRO` are set to your Stripe test keys/price IDs.

## Chrome Extension Setup

1. Open Chrome: `chrome://extensions/`

2. Enable Developer Mode

3. Click "Load unpacked" and select the `extension/` folder

4. Configuration:

- Backend base URL is set to `http://localhost:3000` in `extension/background.js`.
- Allowed hosts include `http://localhost:3000` in `extension/manifest.json`.

## Dashboard & UX

- Protected `/dashboard` uses `getServerSession(authOptions)`; Dev Login via NextAuth Credentials (type any email).
- Generate & revoke API keys with server actions.
- Upgrade buttons:
  - “Upgrade to Builder” / “Upgrade to Pro” trigger the checkout API and redirect to Stripe Checkout.
- Notices/toasts:
  - Query-string driven status messages (API key generated/revoked, checkout success/cancel).

## Test Checklist (Local Dev)

1. Dev Login and Dashboard

- Start backend: `cd backend && npm run dev`
- Visit http://localhost:3000/dashboard
- Sign in using “Dev Login” (enter any email)

2. API key

- Click “Generate New Key”, copy the key (starts with `orb_`)

3. Extension refine flow

- Load the extension (see setup above)
- Open extension popup, paste the Orbitar API key, Save
- Focus a text field on any page, click the floating Orbitar icon
- Choose Model Style + Template, click Refine
- Check that refined text replaces the input (or selection)
- Error cases:
  - Stop backend -> you should see “Orbitar: backend unreachable. Is dev server running?”
  - Use an invalid API key -> “Orbitar: Invalid API key. Check your dashboard.”
  - Hit daily limit -> error shows “Daily limit reached”

4. Subscribe flow (Stripe Test)

- Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BUILDER`, `STRIPE_PRICE_PRO` in `backend/.env`
- Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- In Dashboard, click “Upgrade to Builder” or “Upgrade to Pro”
- Complete Stripe test checkout using test card 4242 4242 4242 4242 …
- On webhook receipt, user’s plan should update accordingly
- Returning to `/dashboard?checkout=success` shows a success notice

## Notes

- The backend never exposes the OpenAI API key to the browser.
- The extension never scrapes assistant responses nor auto-clicks “Send”; it only refines user-authored text in inputs/contentEditable fields.
- For production, consider hashing API keys in the database, using a production DB, and hardening auth and rate limits.

## Tech Stack

- **Frontend/Backend:** Next.js 14, Tailwind CSS, TypeScript
- **Database:** Prisma (SQLite/Postgres)
- **Auth:** NextAuth.js (Credentials/OAuth)
- **AI:** OpenAI API (gpt-4o-mini default)
- **Payments:** Stripe (Checkout + Webhooks in test mode)
