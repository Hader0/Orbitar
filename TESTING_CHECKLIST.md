# Orbitar Testing Checklist

Follow these steps to verify the entire system is working correctly.

## 1. Backend Setup

- [ ] **Terminal**: Ensure `npm run dev` is running in `backend/`.
- [ ] **Browser**: Open [http://localhost:3001](http://localhost:3001).
- [ ] **Verify**: You should see the Orbitar landing page.

## 2. Authentication & Dashboard

- [ ] **Navigate**: Go to [http://localhost:3001/dashboard](http://localhost:3001/dashboard).
- [ ] **Login**: If prompted, use **Dev Login** with any email (e.g., `test@example.com`).
- [ ] **Generate Key**: Click "Generate New Key" button.
- [ ] **Copy Key**: Copy the generated key (starts with `orb_`).

## 3. Extension Setup

- [ ] **Chrome**: Go to `chrome://extensions/`.
- [ ] **Reload**: Click the "Reload" icon on the Orbitar card to ensure latest code is loaded.
- [ ] **Popup**: Click the Orbitar extension icon in your browser toolbar.
- [ ] **Save Key**: Paste your API Key and click "Save".

## 4. Testing the UI (The "Wow" Factor)

- [ ] **Navigate**: Go to a site with a text input (e.g., [Google Translate](https://translate.google.com), [ChatGPT](https://chatgpt.com), or a simple HTML test page).
- [ ] **Type**: Type some text into the input field (e.g., "hello world").
- [ ] **Focus**: Click inside the input field.
- [ ] **Icon**: Verify the small Orbitar icon appears inside/near the input.
- [ ] **Toolbar**: Click the icon.
  - [ ] **Verify**: The new **ChatGPT-style toolbar** should slide up _above_ the input.
  - [ ] **Verify**: It should have a dark theme, green "Refine" button, and pill shape.
  - [ ] **Plan Badge**: Verify you see your plan name (e.g., "Pro" or "Free") on the left, instead of a model selector.
  - [ ] **Suggestion**: If you typed a recognizable prompt (e.g., "Write a react component"), verify a suggestion chip appears _above_ the category dropdown.

## 5. Testing Functionality

- [ ] **Refine**: Select a category/template (or use the suggestion), then click "Refine".
- [ ] **Wait**: The button should show "Refining...".
- [ ] **Result**: The text in the input field should be replaced with the refined version.

## 6. Troubleshooting

- If the icon doesn't appear, try refreshing the page.
- If "Refine" fails, check the backend terminal for errors.
- Ensure the backend is running on port `3001`. If it's on `3000`, update `extension/background.js`.
