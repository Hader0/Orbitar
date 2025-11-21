// background.js

/**
 * Change this to "https://getorbitar.com" when you deploy the backend
 * Local dev backend runs on 3000 (Next.js)
 */
const API_BASE_URL = "http://localhost:3001";
const API_BASE_URL_FALLBACK = "http://127.0.0.1:3001";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "REFINE_TEXT") {
    handleRefineRequest(request, sendResponse);
    return true;
  } else if (request.type === "CLASSIFY_TEXT") {
    handleClassifyRequest(request, sendResponse);
    return true;
  }
});

async function handleClassifyRequest(request, sendResponse) {
  try {
    const { text } = request;
    if (!text || !text.trim()) {
      sendResponse({ error: "No text" });
      return;
    }
    let resp;
    try {
      resp = await fetch(`${API_BASE_URL}/api/classify-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (_e) {
      try {
        resp = await fetch(`${API_BASE_URL_FALLBACK}/api/classify-template`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      } catch (_e2) {
        sendResponse({ error: "Classification failed." });
        return;
      }
    }
    if (!resp.ok) {
      let message = `Server error (${resp.status}).`;
      try {
        const data = await resp.json();
        if (data && data.error) {
          message = data.error;
        }
      } catch (_e) {}
      sendResponse({ error: message });
      return;
    }
    const data = await resp.json();
    sendResponse(data);
  } catch (error) {
    console.error("Orbitar classify error:", error);
    sendResponse({ error: "Classification failed." });
  }
}

// Handle refine requests from the content script
async function handleRefineRequest(request, sendResponse) {
  try {
    const { text, modelStyle, template, templateId, category } = request;

    // Get token from storage
    const { orbitarToken } = await chrome.storage.sync.get(["orbitarToken"]);
    if (!orbitarToken) {
      sendResponse({
        error:
          "No Orbitar API key found. Open the Orbitar extension popup and save your API key first.",
      });
      return;
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/refine-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${orbitarToken}`,
        },
        body: JSON.stringify({
          text,
          modelStyle: modelStyle || "gpt-mini",
          templateId,
          category,
          template: template || "general",
        }),
      });
    } catch (_e) {
      try {
        response = await fetch(`${API_BASE_URL_FALLBACK}/api/refine-prompt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${orbitarToken}`,
          },
          body: JSON.stringify({
            text,
            modelStyle: modelStyle || "gpt-mini",
            templateId,
            category,
            template: template || "general",
          }),
        });
      } catch (_e2) {
        sendResponse({
          error: "Orbitar: backend unreachable. Is dev server running?",
        });
        return;
      }
    }

    if (!response.ok) {
      let message = `Server error (${response.status}).`;
      try {
        const data = await response.json();
        if (data && data.error) {
          message = data.error;
        }
        if (response.status === 401) {
          message =
            data?.error || "Orbitar: Invalid API key. Check your dashboard.";
        } else if (response.status === 429) {
          message = data?.error || "Daily limit reached. Try again tomorrow.";
        } else if (response.status >= 500) {
          message = data?.error || "Backend error.";
        }
      } catch (_e) {
        // ignore JSON parse errors
      }
      sendResponse({ error: message });
      return;
    }

    const data = await response.json();
    sendResponse({ refinedText: data.refinedText || text });
  } catch (error) {
    console.error("Orbitar refine error:", error);
    sendResponse({
      error: "Orbitar: backend unreachable. Is dev server running?",
    });
  }
}

// Keyboard shortcut support
chrome.commands.onCommand.addListener((command) => {
  if (command === "refine-prompt") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_REFINE_MODAL" });
      }
    });
  }
});
