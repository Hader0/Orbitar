# Orbitar

Orbitar is a Chrome Extension + SaaS backend that helps users rewrite their own text into better prompts for AI models.

## Project Structure

- `backend/`: Next.js App Router application (SaaS Dashboard & API).
- `extension/`: Chrome Extension (Manifest V3).

## Setup Instructions

### 1. Backend Setup

1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    - Copy `.env.example` (or create `.env`) with the following:
      ```env
      DATABASE_URL="file:./dev.db"
      NEXTAUTH_SECRET="supersecret"
      NEXTAUTH_URL="http://localhost:3000"
      OPENAI_API_KEY="sk-..."
      STRIPE_SECRET_KEY="sk_test_..."
      STRIPE_WEBHOOK_SECRET="whsec_..."
      ORBITAR_API_BASE_URL="http://localhost:3000"
      GOOGLE_CLIENT_ID="..."
      GOOGLE_CLIENT_SECRET="..."
      ```
4.  Run Database Migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```
    The backend will run at `http://localhost:3000`.

### 2. Chrome Extension Setup

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (top right).
3.  Click **Load unpacked**.
4.  Select the `extension/` folder in this project.
5.  The Orbitar extension should now be active.

### 3. Connecting Extension to Backend

1.  Go to `http://localhost:3000` and sign in (Google Auth).
2.  Go to the **Dashboard** (`/dashboard`).
3.  Click **Generate New Key** and copy the key.
4.  Click the Orbitar extension icon in your browser toolbar.
5.  Paste the API Key and click **Save Settings**.

## Usage

1.  Go to any website with a text input (e.g., `chat.openai.com` or a simple test page).
2.  Type some text into a text area.
3.  You should see a small Orbitar icon appear near the input field.
4.  Click the icon (or press `Cmd+Shift+P` / `Ctrl+Shift+P`).
5.  Select a style and click **Refine**.
6.  Review the refined text and click **Replace** to update your input.

## Policy Compliance

- **No Scraping**: The extension only reads the value of the focused input element or the user's explicit text selection. It does not read other DOM elements.
- **Explicit Action**: Data is only sent to the backend when the user clicks "Refine".
