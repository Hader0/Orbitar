# Orbitar Project Status & Roadmap

This document outlines the current state of the Orbitar project, detailing what has been completed and what remains for both a functional Development environment and a Production-ready launch.

## ✅ Completed (Current State)

### Backend (`/backend`)

- **Framework**: Next.js 14 App Router with TypeScript & Tailwind CSS.
- **Database**: Prisma Schema defined (User, ApiKey, Plans). SQLite configured for local dev.
- **Authentication**: NextAuth.js set up with `CredentialsProvider` for "Dev Login" (bypassing Google OAuth for now).
- **API**:
  - `/api/auth/*`: Handles login/session.
  - `/api/refine-prompt`: Validates API keys, checks daily limits, and calls OpenAI (logic implemented).
  - Server Actions: `generateApiKey`, `revokeApiKey` (with soft delete).
- **Dashboard**: UI for viewing plan, usage, and managing API keys.
- **Styling**: Fixed dark mode text visibility issues.

### Chrome Extension (`/extension`)

- **Manifest V3**: Correctly configured with permissions and host permissions.
- **Content Script**:
  - Detects focus on inputs/textareas.
  - Injects floating Orbitar icon.
  - **UI**: "ChatGPT-style" inline toolbar (Dark theme, Pill shape, Green button) positioned _above_ the input.
  - **Logic**: Sends text + options to backend, receives refined text, and replaces input value.
- **Popup**: Simple settings page to save the API Key.
- **Background**: Handles API calls to `localhost:3001` to avoid CORS issues in content script.

---

## 🛠 To Do: Development Environment

_Goal: Get the app fully working on your local machine for testing and demoing._

1.  **OpenAI API Key**

    - [ ] **Action**: Get a real OpenAI API Key from [platform.openai.com](https://platform.openai.com).
    - [ ] **Action**: Update `backend/.env` with `OPENAI_API_KEY=sk-...`.
    - _Why_: The `/api/refine-prompt` endpoint will fail without this.

2.  **Stripe Integration (Mock/Test)**

    - [ ] **Action**: Set up Stripe CLI for local webhook forwarding.
    - [ ] **Action**: Implement `/api/webhooks/stripe` to handle `checkout.session.completed` and `customer.subscription.updated`.
    - [ ] **Action**: Create a "Subscribe" button on the dashboard that redirects to a Stripe Checkout URL.
    - _Why_: Currently, users are stuck on "Free" or manually set to "Pro" via the Dev Login hack. We need to test the upgrade flow.

3.  **Error Handling & Polish**
    - [ ] **Action**: Add toast notifications for success/error states in the Dashboard.
    - [ ] **Action**: Improve the extension's error messages (e.g., if backend is down or key is invalid).

---

## 🚀 To Do: Production Environment

_Goal: Deploy the app for real users._

1.  **Database Migration**

    - [ ] **Action**: Switch from SQLite (`file:./dev.db`) to PostgreSQL (e.g., Supabase, Neon, or Vercel Postgres).
    - [ ] **Action**: Update `schema.prisma` provider to `postgresql`.
    - [ ] **Action**: Run `npx prisma migrate deploy`.

2.  **Authentication (Real)**

    - [ ] **Action**: Create a Google Cloud Project.
    - [ ] **Action**: Configure OAuth Consent Screen and get Client ID / Secret.
    - [ ] **Action**: Switch `authOptions` in NextAuth from `CredentialsProvider` back to `GoogleProvider`.
    - [ ] **Action**: Set `NEXTAUTH_URL` to your real domain (e.g., `https://getorbitar.com`).

3.  **Environment Variables**

    - [ ] **Action**: Set production variables in Vercel/Host:
      - `DATABASE_URL` (Postgres)
      - `NEXTAUTH_SECRET` (Generated via `openssl rand -base64 32`)
      - `OPENAI_API_KEY`
      - `STRIPE_SECRET_KEY` (Live mode)
      - `STRIPE_WEBHOOK_SECRET` (Live mode)
      - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

4.  **Extension Deployment**

    - [ ] **Action**: Update `API_BASE_URL` in `extension/background.js` to the production URL.
    - [ ] **Action**: Create a production build of the extension (zip `extension/` folder).
    - [ ] **Action**: Submit to Chrome Web Store (requires $5 developer fee and review).

5.  **Legal & Compliance**
    - [ ] **Action**: Add Privacy Policy and Terms of Service pages (required for Google OAuth and Chrome Web Store).
