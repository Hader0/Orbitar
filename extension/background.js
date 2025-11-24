// background.js

/**
 * In dev, the Next.js app runs on :3000. Prefer that, with a single sensible fallback.
 * For production, switch to https://getorbitar.com (or your prod domain) and adjust host_permissions.
 */
const API_BASE_URL = "http://localhost:3001"; // unused in refine (kept for plan/me/classify legacy)
const API_BASE_URL_FALLBACK = "http://127.0.0.1:3001"; // unused in refine (kept for plan/me/classify legacy)
const API_BASE_URL_ALT = "http://localhost:3000"; // primary for refine in dev
const API_BASE_URL_ALT_FALLBACK = "http://127.0.0.1:3000"; // fallback for refine in dev
const DEBUG = true;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "REFINE_TEXT") {
    handleRefineRequest(request, sendResponse);
    return true;
  } else if (request.type === "CLASSIFY_TEXT") {
    handleClassifyRequest(request, sendResponse);
    return true;
  } else if (request.type === "GET_USER_PLAN") {
    handleGetUserPlan(request, sendResponse);
    return true;
  } else if (request.type === "GET_TEMPLATES") {
    handleGetTemplates(request, sendResponse);
    return true;
  }
});

async function handleGetUserPlan(_request, sendResponse) {
  try {
    const { orbitarToken } = await chrome.storage.sync.get(["orbitarToken"]);
    if (!orbitarToken) {
      sendResponse({ error: "No token" });
      return;
    }

    let resp;

    // Try primary, then fallbacks
    const endpoints = [
      `${API_BASE_URL}/api/user/me`,
      `${API_BASE_URL_FALLBACK}/api/user/me`,
      `${API_BASE_URL_ALT}/api/user/me`,
      `${API_BASE_URL_ALT_FALLBACK}/api/user/me`,
    ];

    for (const endpoint of endpoints) {
      try {
        resp = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${orbitarToken}`,
          },
        });
        if (resp) break;
      } catch (_e) {
        // continue to next
      }
    }

    if (!resp || !resp.ok) {
      sendResponse({ error: "Failed to fetch plan" });
      return;
    }

    const data = await resp.json();
    sendResponse(data);
  } catch (error) {
    console.error("Orbitar get plan error:", error);
    sendResponse({ error: "Failed to fetch plan" });
  }
}

async function handleGetTemplates(_request, sendResponse) {
  try {
    const { orbitarToken } = await chrome.storage.sync.get(["orbitarToken"]);
    if (!orbitarToken) {
      sendResponse({ error: "No token" });
      return;
    }

    let resp;
    const endpoints = [
      `${API_BASE_URL_ALT}/api/templates/for-key`,
      `${API_BASE_URL_ALT_FALLBACK}/api/templates/for-key`,
      `${API_BASE_URL}/api/templates/for-key`,
      `${API_BASE_URL_FALLBACK}/api/templates/for-key`,
    ];

    for (const endpoint of endpoints) {
      try {
        resp = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${orbitarToken}`,
          },
        });
        if (resp) break;
      } catch (_e) {
        // continue
      }
    }

    if (!resp || !resp.ok) {
      sendResponse({ error: "Failed to fetch templates" });
      return;
    }

    const data = await resp.json();
    sendResponse(data);
  } catch (error) {
    console.error("Orbitar get templates error:", error);
    sendResponse({ error: "Failed to fetch templates" });
  }
}

async function handleClassifyRequest(request, sendResponse) {
  try {
    const { text } = request;
    if (!text || !text.trim()) {
      sendResponse({ error: "No text" });
      return;
    }
    let resp;
    let classifyUrl = `${API_BASE_URL}/api/classify-template`;
    try {
      resp = await fetch(classifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (_e) {
      try {
        classifyUrl = `${API_BASE_URL_FALLBACK}/api/classify-template`;
        resp = await fetch(classifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      } catch (_e2) {
        try {
          classifyUrl = `${API_BASE_URL_ALT}/api/classify-template`;
          resp = await fetch(classifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
        } catch (_e3) {
          try {
            classifyUrl = `${API_BASE_URL_ALT_FALLBACK}/api/classify-template`;
            resp = await fetch(classifyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
          } catch (_e4) {
            sendResponse({
              error: "Classification failed.",
              _debug: {
                endpoints: [
                  `${API_BASE_URL}/api/classify-template`,
                  `${API_BASE_URL_FALLBACK}/api/classify-template`,
                  `${API_BASE_URL_ALT}/api/classify-template`,
                  `${API_BASE_URL_ALT_FALLBACK}/api/classify-template`,
                ],
                networkError: true,
              },
            });
            return;
          }
        }
      }
    }
    if (!resp.ok) {
      let message = `Server error (${resp.status}).`;
      let errorBody = null;
      try {
        const data = await resp.json();
        errorBody = data;
        if (data && data.error) {
          message = data.error;
        }
        if (DEBUG) {
          console.debug("Orbitar classify -> non-OK response", {
            status: resp.status,
            errorBody: data,
            endpoint: classifyUrl,
          });
        }
      } catch (_e) {}
      sendResponse({
        error: message,
        _debug: { endpoint: classifyUrl, status: resp.status, body: errorBody },
      });
      return;
    }
    const data = await resp.json();
    if (DEBUG) {
      console.debug("Orbitar classify -> success", { data });
    }
    sendResponse(data);
  } catch (error) {
    console.error("Orbitar classify error:", error);
    sendResponse({ error: "Classification failed." });
  }
}

// Handle refine requests from the content script
async function handleRefineRequest(request, sendResponse) {
  try {
    const { text, modelStyle, template, templateId, category, incognito } =
      request;

    // Get token from storage
    const { orbitarToken } = await chrome.storage.sync.get(["orbitarToken"]);
    if (!orbitarToken) {
      sendResponse({
        error:
          "No Orbitar API key found. Open the Orbitar extension popup and save your API key first.",
        code: "NO_TOKEN",
      });
      return;
    }

    // Dev-first endpoints: prefer Next.js dev server on :3000, minimal fallbacks.
    const endpoints = [
      `${API_BASE_URL_ALT}/api/refine-prompt`, // http://localhost:3000
      `${API_BASE_URL_ALT_FALLBACK}/api/refine-prompt`, // http://127.0.0.1:3000
    ];

    const payload = {
      text,
      modelStyle: modelStyle || "gpt-mini",
      templateId,
      category,
      template: template || "general",
      source: "chatgpt",
      incognito: typeof incognito === "boolean" ? incognito : undefined,
    };

    let lastNetworkError = null;
    for (const refineUrl of endpoints) {
      try {
        const response = await fetch(refineUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${orbitarToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          // Backend reachable but error: parse and surface structured message
          let data = null;
          try {
            data = await response.json();
          } catch (_e) {
            /* ignore */
          }

          const status = response.status;
          const code =
            (data && (data.error || data.code)) ||
            (status === 400
              ? "BAD_REQUEST"
              : status === 401
              ? "AUTH_ERROR"
              : status === 429
              ? "RATE_LIMIT"
              : status >= 500
              ? "INTERNAL_ERROR"
              : "HTTP_ERROR");

          const friendly =
            (data && (data.message || data.error)) ||
            (code === "AUTH_ERROR"
              ? "Your Orbitar API key looks invalid. Update it in the extension popup."
              : code === "RATE_LIMIT"
              ? "You’ve hit your daily limit for this plan."
              : code === "BAD_REQUEST"
              ? "The request was invalid. Please try again."
              : code === "NETWORK_ERROR"
              ? "Cannot connect to Orbitar. Check that the app is running."
              : "Orbitar had a hiccup. Try again in a moment.");

          if (DEBUG) {
            console.debug("Orbitar refine -> error response", {
              endpoint: refineUrl,
              status,
              data,
              code,
            });
          }

          sendResponse({
            error: friendly,
            code,
            _debug: { endpoint: refineUrl, status, raw: data },
          });
          return;
        }

        // Success
        const data = await response.json();
        if (DEBUG) {
          console.debug("Orbitar refine -> success", {
            endpoint: refineUrl,
            templateIdUsed: data.templateIdUsed,
            categoryUsed: data.categoryUsed,
            refinedTextLength: (data.refinedText || "").length,
          });
        }
        sendResponse({ refinedText: data.refinedText || text });
        return;
      } catch (err) {
        // Network error (connection refused, etc) – try next endpoint
        lastNetworkError = err;
        if (DEBUG) {
          console.debug("Orbitar refine -> network error", {
            endpoint: refineUrl,
            err,
          });
        }
        continue;
      }
    }

    // If we got here, all endpoints failed to connect
    sendResponse({
      error: "Cannot connect to Orbitar. Check that the app is running.",
      code: "NETWORK_ERROR",
      _debug: { endpoints, lastNetworkError },
    });
  } catch (error) {
    console.error("Orbitar refine error (unexpected):", error);
    sendResponse({
      error: "Unexpected error in extension. Try again.",
      code: "EXTENSION_ERROR",
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
