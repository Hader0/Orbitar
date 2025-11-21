// content.js

let activeElement = null;
let orbitarIcon = null;
let toolbarHost = null;
let toolbarRoot = null;

/**
 * Safe messaging to background with retry to handle transient "Extension context invalidated"
 * errors when the service worker reloads. Retries a couple of times with small delay.
 */
function sendMessageSafe(message, callback, retries = 2, delayMs = 400) {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        if (retries > 0) {
          setTimeout(
            () => sendMessageSafe(message, callback, retries - 1, delayMs),
            delayMs
          );
        } else {
          callback &&
            callback({
              error:
                chrome.runtime.lastError.message ||
                "Extension messaging failed.",
            });
        }
        return;
      }
      callback && callback(response);
    });
  } catch (err) {
    if (retries > 0) {
      setTimeout(
        () => sendMessageSafe(message, callback, retries - 1, delayMs),
        delayMs
      );
    } else {
      console.error("Orbitar messaging error:", err);
      callback && callback({ error: "Extension messaging failed." });
    }
  }
}

// Template taxonomy for UI
const ORBITAR_TEMPLATE_GROUPS = {
  coding: [
    { value: "coding_feature", label: "Implement feature" },
    { value: "coding_debug", label: "Debug / fix bug" },
    { value: "coding_refactor", label: "Refactor / improve" },
    { value: "coding_tests", label: "Write tests" },
    { value: "coding_explain", label: "Explain code" },
  ],
  writing: [
    { value: "writing_blog", label: "Blog post" },
    { value: "writing_twitter_thread", label: "Twitter/X thread" },
    { value: "writing_linkedin_post", label: "LinkedIn post" },
    { value: "writing_email", label: "Email" },
    { value: "writing_landing_page", label: "Landing page copy" },
  ],
  research: [
    { value: "research_summarize", label: "Summarize" },
    { value: "research_compare", label: "Compare options" },
    { value: "research_extract_points", label: "Extract key points" },
  ],
  planning: [
    { value: "planning_roadmap", label: "Roadmap / plan" },
    { value: "planning_feature_spec", label: "Feature spec" },
    { value: "planning_meeting_notes", label: "Meeting notes" },
  ],
  communication: [
    { value: "communication_reply", label: "Reply" },
    { value: "communication_tone_adjust", label: "Adjust tone" },
  ],
  creative: [
    { value: "creative_story", label: "Story / scene" },
    { value: "creative_brainstorm", label: "Brainstorm ideas" },
  ],
  general: [{ value: "general_general", label: "General prompt" }],
};

const ORBITAR_DEFAULT_CATEGORY = "general";
const ORBITAR_DEFAULT_TEMPLATE_ID = "general_general";

// --- Helper: Check if element is editable ---
function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    const type = (el.type || "text").toLowerCase();
    const textTypes = ["text", "search", "email", "url", "tel", "password"];
    return textTypes.includes(type);
  }
  if (el.isContentEditable) return true;
  return false;
}

// --- Focus detection & Icon Management ---

document.addEventListener("focusin", (e) => {
  const target = e.target;
  if (isEditable(target)) {
    activeElement = target;
    showIcon(target);
  } else {
    // Delay hiding to allow clicking the icon
    setTimeout(() => {
      if (
        document.activeElement !== target &&
        !toolbarHost?.contains(document.activeElement)
      ) {
        activeElement = null;
        hideIcon();
        removeToolbar();
      }
    }, 200);
  }
});

// Reposition on scroll/resize
window.addEventListener(
  "scroll",
  () => {
    if (activeElement) {
      if (orbitarIcon) positionIcon(activeElement);
      if (toolbarHost) positionToolbar(activeElement);
    }
  },
  true
);

window.addEventListener("resize", () => {
  if (activeElement) {
    if (orbitarIcon) positionIcon(activeElement);
    if (toolbarHost) positionToolbar(activeElement);
  }
});

function showIcon(target) {
  if (!orbitarIcon) {
    orbitarIcon = document.createElement("div");
    orbitarIcon.className = "orbitar-icon";

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("icons/icon48.png");
    img.alt = "Orbitar";
    orbitarIcon.appendChild(img);

    // Prevent focus loss when clicking icon
    orbitarIcon.addEventListener("mousedown", (e) => e.preventDefault());
    orbitarIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleToolbar();
    });

    document.body.appendChild(orbitarIcon);
  }

  positionIcon(target);
  orbitarIcon.style.display = "flex";
}

function hideIcon() {
  if (orbitarIcon) {
    orbitarIcon.style.display = "none";
  }
}

function positionIcon(target) {
  if (!orbitarIcon || !target) return;
  const rect = target.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;

  // Position icon inside the right edge of the input
  const size = 24;
  const offset = 8;

  // Check if there's space on the right, otherwise float over
  const top = rect.top + scrollY + offset;
  const left = rect.right + scrollX - size - offset - 5; // 5px padding from right edge

  orbitarIcon.style.position = "absolute";
  orbitarIcon.style.top = `${top}px`;
  orbitarIcon.style.left = `${left}px`;
}

// --- Toolbar Logic ---

function toggleToolbar() {
  if (toolbarHost) {
    removeToolbar();
  } else {
    showToolbar();
  }
}

function showToolbar() {
  if (!activeElement) return;

  toolbarHost = document.createElement("div");
  // Position wrapper absolutely in the body
  toolbarHost.style.position = "absolute";
  toolbarHost.style.zIndex = "2147483647";
  document.body.appendChild(toolbarHost);

  toolbarRoot = toolbarHost.attachShadow({ mode: "closed" });

  const container = document.createElement("div");
  container.className = "orbitar-toolbar";

  container.innerHTML = `
    <style>
      .orbitar-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #202123; /* ChatGPT dark bg */
        padding: 6px 10px;
        border-radius: 8px;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.2); /* Shadow upwards */
        border: 1px solid #444;
        font-family: 'Söhne', 'Segoe UI', sans-serif;
        font-size: 13px;
        color: #ececf1;
        animation: slideUp 0.15s ease-out;
        backdrop-filter: blur(8px);
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }
      select, .orbitar-inline-select {
        background: transparent;
        color: #ececf1;
        border: none;
        padding: 4px 20px 4px 4px;
        font-size: 12px;
        outline: none;
        cursor: pointer;
        appearance: none;
        background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ececf1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
        background-repeat: no-repeat;
        background-position: right 4px center;
        background-size: 8px;
      }
      select:hover, .orbitar-inline-select:hover {
        color: #fff;
      }
      .divider {
        width: 1px;
        height: 16px;
        background: #555;
        margin: 0 4px;
      }
      .orbitar-inline-pill {
        display: inline-block;
        background: #374151;
        color: #d1d5db;
        border: 1px solid #4b5563;
        border-radius: 9999px;
        padding: 2px 8px;
        font-size: 11px;
      }
      button.primary {
        background: #10a37f; /* ChatGPT Green */
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
        margin-left: 4px;
      }
      button.primary:hover {
        background: #1a7f5a;
      }
      button.primary:disabled {
        opacity: 0.7;
        cursor: wait;
      }
      button.close {
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 18px;
        padding: 0 6px;
        display: flex;
        align-items: center;
        margin-left: 2px;
      }
      button.close:hover {
        color: #fff;
      }
      .error {
        color: #ef4444;
        font-size: 11px;
        margin-left: 4px;
      }
    </style>
    
    <select id="model" title="Model Style">
      <option value="gpt-mini">GPT-mini</option>
      <option value="gpt-5">GPT-5</option>
      <option value="claude">Claude</option>
      <option value="gemini">Gemini</option>
    </select>
    
    <div class="divider"></div>

    <select class="orbitar-inline-select" id="orbitar-category" title="Category"></select>
    <select class="orbitar-inline-select" id="orbitar-template" title="Template"></select>
    <span class="orbitar-inline-pill" id="orbitar-suggestion" style="display:none;"></span>
    
    <button class="primary" id="refine-btn">Refine</button>
    <button class="close" id="close-btn">&times;</button>
    <span class="error" id="error-msg"></span>
  `;

  toolbarRoot.appendChild(container);

  // Add visual overrides for a more OpenAI-like look and feel
  try {
    const override = document.createElement("style");
    override.textContent = `
      .orbitar-toolbar {
        background: linear-gradient(180deg, #23242a 0%, #1f2026 100%) !important;
        border: 1px solid #2a2b32 !important;
        box-shadow: 0 12px 40px rgba(0,0,0,.40), 0 1px 0 rgba(255,255,255,0.02) inset !important;
        padding: 10px 12px !important;
        gap: 10px !important;
      }
      .orbitar-inline-select {
        background: #2a2b32 !important;
        color: #ececf1 !important;
        border: 1px solid #3a3b45 !important;
        border-radius: 8px !important;
        padding: 6px 28px 6px 10px !important;
        font-size: 12px !important;
      }
      .orbitar-inline-select:hover {
        border-color: #4b4c57 !important;
      }
      button.primary {
        height: 30px !important;
        padding: 0 14px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        background: #10a37f !important;
        color: #fff !important;
        border: 1px solid #0e8d6d !important;
      }
      button.primary:hover {
        background: #0e8d6d !important;
      }
      .orbitar-inline-pill {
        background: #2a2b32 !important;
        border-color: #3a3b45 !important;
      }
    `;
    container.appendChild(override);
  } catch (_e) {}

  // Defer an extra layout pass so positioning can use measured height/width
  requestAnimationFrame(() => {
    positionToolbar(activeElement);
  });

  // Event Listeners
  const refineBtn = container.querySelector("#refine-btn");
  const closeBtn = container.querySelector("#close-btn");
  const modelSelect = container.querySelector("#model");
  const categorySelect = container.querySelector("#orbitar-category");
  const templateSelect = container.querySelector("#orbitar-template");
  const suggestionSpan = container.querySelector("#orbitar-suggestion");
  const errorMsg = container.querySelector("#error-msg");

  // Prevent focus loss but allow interaction with form controls (selects, buttons, inputs)
  container.addEventListener("mousedown", (e) => {
    const t = e.target;
    const tag = t && t.tagName;
    if (
      tag !== "SELECT" &&
      tag !== "BUTTON" &&
      tag !== "INPUT" &&
      tag !== "TEXTAREA"
    ) {
      e.preventDefault();
    }
  });

  closeBtn.addEventListener("click", removeToolbar);

  // Category/template setup
  function niceCategoryLabel(key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
  function populateCategoryOptions() {
    categorySelect.innerHTML = "";
    Object.keys(ORBITAR_TEMPLATE_GROUPS).forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = niceCategoryLabel(cat);
      categorySelect.appendChild(opt);
    });
  }
  function populateTemplateOptions(cat) {
    templateSelect.innerHTML = "";
    const arr = ORBITAR_TEMPLATE_GROUPS[cat] || [];
    arr.forEach((tpl) => {
      const opt = document.createElement("option");
      opt.value = tpl.value;
      opt.textContent = tpl.label;
      templateSelect.appendChild(opt);
    });
  }

  let userChangedCategory = false;
  let userChangedTemplate = false;

  populateCategoryOptions();
  categorySelect.value = ORBITAR_DEFAULT_CATEGORY;
  populateTemplateOptions(ORBITAR_DEFAULT_CATEGORY);
  templateSelect.value = ORBITAR_DEFAULT_TEMPLATE_ID;

  categorySelect.addEventListener("change", () => {
    userChangedCategory = true;
    populateTemplateOptions(categorySelect.value);
    suggestionSpan.style.display = "none";
  });
  templateSelect.addEventListener("change", () => {
    userChangedTemplate = true;
    suggestionSpan.style.display = "none";
  });

  // Ask backend for classification suggestion if text exists and user hasn't interacted
  const initialText = getCurrentText();
  if (initialText && initialText.trim().length > 0) {
    sendMessageSafe(
      {
        type: "CLASSIFY_TEXT",
        text: initialText,
      },
      (resp) => {
        if (!resp || resp.error) {
          try {
            console.error("Orbitar classify -> error", resp);
          } catch (_e) {}
          return;
        }
        if (userChangedCategory || userChangedTemplate) return; // respect manual override
        const { templateId, category } = resp;
        if (category && ORBITAR_TEMPLATE_GROUPS[category]) {
          categorySelect.value = category;
          populateTemplateOptions(category);
          const group = ORBITAR_TEMPLATE_GROUPS[category];
          if (group.some((g) => g.value === templateId)) {
            templateSelect.value = templateId;
            suggestionSpan.textContent = `Suggested: ${niceCategoryLabel(
              category
            )} → ${
              group.find((g) => g.value === templateId)?.label || templateId
            }`;
            suggestionSpan.style.display = "inline";
          }
        }
      }
    );
  }

  refineBtn.addEventListener("click", async () => {
    const text = getCurrentText();
    if (!text) {
      errorMsg.textContent = "No text";
      return;
    }

    refineBtn.disabled = true;
    refineBtn.textContent = "...";
    errorMsg.textContent = "";
    const startedAt =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    try {
      console.debug("Orbitar refine -> sending", {
        textLength: (text || "").length,
        modelStyle: modelSelect.value,
        templateId: templateSelect.value,
        category: categorySelect.value,
      });
    } catch (_e) {}

    sendMessageSafe(
      {
        type: "REFINE_TEXT",
        text: text,
        modelStyle: modelSelect.value,
        templateId: templateSelect.value,
        category: categorySelect.value,
      },
      (response) => {
        refineBtn.disabled = false;
        refineBtn.textContent = "Refine";

        if (chrome.runtime.lastError) {
          try {
            console.error(
              "Orbitar refine -> runtime error",
              chrome.runtime.lastError
            );
          } catch (_e) {}
          errorMsg.textContent =
            "Orbitar: backend unreachable. Is dev server running?";
          return;
        }
        if (!response) {
          try {
            console.error("Orbitar refine -> empty response");
          } catch (_e) {}
          errorMsg.textContent = "Unexpected error.";
          return;
        }
        if (response.error) {
          try {
            console.error("Orbitar refine -> background error", response);
            if (response._debug) {
              console.debug("Orbitar refine -> debug", response._debug);
            }
          } catch (_e) {}
          errorMsg.textContent = response.error;
          return;
        }

        // Success! Replace text
        try {
          const endedAt =
            typeof performance !== "undefined" && performance.now
              ? performance.now()
              : Date.now();
          console.debug("Orbitar refine -> success", {
            durationMs: endedAt - startedAt,
            refinedTextLength: (response.refinedText || "").length,
          });
        } catch (_e) {}
        replaceTextInActiveElement(response.refinedText);
        removeToolbar();
      }
    );
  });

  positionToolbar(activeElement);
}

function removeToolbar() {
  if (toolbarHost) {
    toolbarHost.remove();
    toolbarHost = null;
    toolbarRoot = null;
  }
}

function positionToolbar(target) {
  if (!toolbarHost || !target) return;

  const rect = target.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;

  // Set width to match input (within sensible bounds)
  const minWidth = 360;
  const maxWidth = 720;
  const desiredWidth = Math.max(
    minWidth,
    Math.min(maxWidth, Math.floor(rect.width))
  );
  toolbarHost.style.width = `${desiredWidth}px`;

  // After width set, measure the host height (includes shadow content)
  const hostHeight = toolbarHost.offsetHeight || 60;
  const padding = 10;

  // Align left with input, adjust if panel wider than input
  let left = rect.left + scrollX;
  if (desiredWidth > rect.width) {
    // Keep left edge aligned but never overflow right viewport
    const viewportRight =
      scrollX + (window.innerWidth || document.documentElement.clientWidth);
    const right = left + desiredWidth;
    if (right > viewportRight - 10) {
      left = Math.max(10 + scrollX, viewportRight - desiredWidth - 10);
    }
  }

  // Position ABOVE the input
  let top = rect.top + scrollY - hostHeight - padding;

  // Ensure it doesn't go off-screen top
  const minTop = scrollY + 10;
  if (top < minTop) {
    top = minTop;
  }

  toolbarHost.style.top = `${top}px`;
  toolbarHost.style.left = `${left}px`;
  toolbarHost.style.zIndex = "2147483647";
}

// --- Text Manipulation ---

function getCurrentText() {
  if (!activeElement) return "";

  if (
    activeElement.tagName === "TEXTAREA" ||
    activeElement.tagName === "INPUT"
  ) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    if (start !== end) {
      return activeElement.value.substring(start, end);
    }
    return activeElement.value;
  }

  if (activeElement.isContentEditable) {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      return sel.toString();
    }
    return activeElement.innerText;
  }

  return "";
}

function replaceTextInActiveElement(newText) {
  if (!activeElement) return;

  const el = activeElement;

  // Input/Textarea
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // If there was a selection, replace just that
    if (start !== end) {
      const val = el.value;
      el.value = val.substring(0, start) + newText + val.substring(end);
    } else {
      // Otherwise replace all (or insert at cursor? User said "replaces the text in the same field")
      // Assuming replace ALL if no selection, or replace selection if exists.
      // But if no selection, "replace text" usually means the whole thing for a "refine" action.
      el.value = newText;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  // ContentEditable
  else if (el.isContentEditable) {
    // Simple replacement for now
    el.innerText = newText;
  }
}

// --- Keyboard Shortcut ---
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "TRIGGER_REFINE_MODAL") {
    if (document.activeElement && isEditable(document.activeElement)) {
      activeElement = document.activeElement;
      toggleToolbar();
    }
  }
});
