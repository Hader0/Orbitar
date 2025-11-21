// background.js

/**
 * Change this to "https://getorbitar.com" when you deploy the backend
 * Local dev backend runs on 3000 (Next.js)
 */
const API_BASE_URL = "http://localhost:3001";
const API_BASE_URL_FALLBACK = "http://127.0.0.1:3001";
const API_BASE_URL_ALT = "http://localhost:3000";
const API_BASE_URL_ALT_FALLBACK = "http://127.0.0.1:3000";
const DEBUG = true;

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
    let refineUrl = `${API_BASE_URL}/api/refine-prompt`;
    try {
      response = await fetch(refineUrl, {
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
        refineUrl = `${API_BASE_URL_FALLBACK}/api/refine-prompt`;
        response = await fetch(refineUrl, {
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
        try {
          refineUrl = `${API_BASE_URL_ALT}/api/refine-prompt`;
          response = await fetch(refineUrl, {
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
        } catch (_e3) {
          try {
            refineUrl = `${API_BASE_URL_ALT_FALLBACK}/api/refine-prompt`;
            response = await fetch(refineUrl, {
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
          } catch (_e4) {
            sendResponse({
              error: "Orbitar: backend unreachable. Is dev server running?",
              _debug: {
                endpoints: [
                  `${API_BASE_URL}/api/refine-prompt`,
                  `${API_BASE_URL_FALLBACK}/api/refine-prompt`,
                  `${API_BASE_URL_ALT}/api/refine-prompt`,
                  `${API_BASE_URL_ALT_FALLBACK}/api/refine-prompt`,
                ],
                networkError: true,
              },
            });
            return;
          }
        }
      }
    }

    if (!response.ok) {
      let message = `Server error (${response.status}).`;
      let errorBody = null;
      try {
        const data = await response.json();
        errorBody = data;
        if (DEBUG) {
          console.debug("Orbitar refine -> non-OK", {
            status: response.status,
            body: data,
            endpoint: refineUrl,
          });
        }
        if (data && data.error) {
          message = data.error;
        }
        if (response.status === 401) {
          message =
            (errorBody && errorBody.error) ||
            "Orbitar: Invalid API key. Check your dashboard.";
        } else if (response.status === 429) {
          message =
            (errorBody && errorBody.error) ||
            "Daily limit reached. Try again tomorrow.";
        } else if (response.status >= 500) {
          message = (errorBody && errorBody.error) || "Backend error.";
        }
      } catch (_e) {
        // ignore JSON parse errors
      }
      sendResponse({
        error: message,
        _debug: {
          endpoint: refineUrl,
          status: response.status,
          body: errorBody,
        },
      });
      return;
    }

    const data = await response.json();
    if (DEBUG) {
      console.debug("Orbitar refine -> success", {
        templateIdUsed: data.templateIdUsed,
        categoryUsed: data.categoryUsed,
        refinedTextLength: (data.refinedText || "").length,
      });
    }
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
