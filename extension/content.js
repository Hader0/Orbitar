// content.js

let activeElement = null;
let orbitarIcon = null;
let toolbarHost = null;
let toolbarRoot = null;

// Integrated ChatGPT mode state
let integratedComposer = null; // the ChatGPT composer container
let integratedPanelEl = null; // the top panel shown when Dyson icon clicked
let integratedIconEl = null; // the Dyson icon injected into the composer

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
    { value: "coding_review", label: "Code review" },
    { value: "coding_optimize", label: "Optimize performance" },
    { value: "coding_documentation", label: "Write documentation" },
    { value: "coding_api", label: "Design API" },
    { value: "coding_database", label: "Database schema" },
    { value: "coding_architecture", label: "System architecture" },
    { value: "coding_security", label: "Security review" },
    { value: "coding_migration", label: "Code migration" },
    { value: "coding_website", label: "Build website" },
  ],
  writing: [
    { value: "writing_blog", label: "Blog post" },
    { value: "writing_twitter_thread", label: "Twitter/X thread" },
    { value: "writing_linkedin_post", label: "LinkedIn post" },
    { value: "writing_email", label: "Email" },
    { value: "writing_landing_page", label: "Landing page copy" },
    { value: "writing_newsletter", label: "Newsletter" },
    { value: "writing_doc", label: "Documentation" },
    { value: "writing_press_release", label: "Press release" },
    { value: "writing_product_desc", label: "Product description" },
  ],
  research: [
    { value: "research_summarize", label: "Summarize" },
    { value: "research_compare", label: "Compare options" },
    { value: "research_extract_points", label: "Extract key points" },
    { value: "research_analysis", label: "Market analysis" },
    { value: "research_trends", label: "Trend analysis" },
    { value: "research_competitive", label: "Competitive research" },
  ],
  planning: [
    { value: "planning_roadmap", label: "Roadmap / plan" },
    { value: "planning_feature_spec", label: "Feature spec" },
    { value: "planning_meeting_notes", label: "Meeting notes" },
    { value: "planning_project", label: "Project plan" },
    { value: "planning_strategy", label: "Strategy document" },
    { value: "planning_timeline", label: "Timeline / milestones" },
  ],
  communication: [
    { value: "communication_reply", label: "Reply" },
    { value: "communication_tone_adjust", label: "Adjust tone" },
    { value: "communication_translate", label: "Translate" },
    { value: "communication_simplify", label: "Simplify language" },
    { value: "communication_professional", label: "Make professional" },
  ],
  creative: [
    { value: "creative_story", label: "Story / scene" },
    { value: "creative_brainstorm", label: "Brainstorm ideas" },
    { value: "creative_slogan", label: "Slogan / tagline" },
    { value: "creative_poem", label: "Poem / verse" },
    { value: "creative_script", label: "Script / dialogue" },
    { value: "creative_naming", label: "Name ideas" },
    { value: "creative_worldbuilding", label: "Worldbuilding" },
    { value: "creative_character", label: "Character development" },
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

/**
 * Detect if we are on ChatGPT's chat product where we should integrate
 * directly into the composer (not overlay).
 */
function isChatGPTPage() {
  const host = location.hostname;
  return (
    /(^|\.)chatgpt\.com$/i.test(host) || /(^|\.)openai\.com$/i.test(host) // chat.openai.com
  );
}

/**
 * Find a robust composer container starting from the focused editable target.
 * We use heuristics that work across ChatGPT UI revisions.
 */
function findComposerContainerFrom(target) {
  let el = target;
  for (let i = 0; i < 8 && el && el !== document.body; i++) {
    try {
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const hasEditable =
        el.querySelector?.("textarea, [contenteditable='true']") != null ||
        el === target;
      const isBlocky =
        cs.display === "block" ||
        cs.display === "flex" ||
        cs.display === "grid" ||
        cs.display === "flow-root";
      if (hasEditable && isBlocky && rect.width > 300 && rect.height > 40) {
        return el;
      }
    } catch (_e) {}
    el = el.parentElement;
  }
  return null;
}

/**
 * Ensure a Dyson sphere icon is injected into the ChatGPT composer.
 * It appears integrated with the UI, without using a viewport overlay.
 */
/**
 * Ensure a Dyson sphere icon is injected into ChatGPT's button controls area.
 */
function ensureIntegratedIcon(composer) {
  if (integratedIconEl && integratedIconEl.isConnected) return;

  const createDysonButton = () => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "orbitar-chatgpt-icon composer-btn";
    btn.title = "Orbitar – Refine prompt";
    btn.ariaLabel = "Open Orbitar";
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (integratedPanelEl) {
        removeIntegratedPanel();
      } else {
        showIntegratedPanel();
      }
    });

    // Inner glow
    const glow = document.createElement("div");
    glow.className = "orbitar-icon-glow";
    btn.appendChild(glow);

    // SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    
    // SVG Content (Dyson Sphere circles)
    svg.innerHTML = `
      <circle cx="12" cy="12" r="2" fill="currentColor" class="group-hover:opacity-100 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.8" class="group-hover:opacity-100 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.5" transform="rotate(60 12 12)" class="group-hover:opacity-70 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.5" transform="rotate(120 12 12)" class="group-hover:opacity-70 transition-opacity"></circle>
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" stroke-width="1" opacity="0.6" class="group-hover:opacity-80 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" stroke-width="1" opacity="0.6" class="group-hover:opacity-80 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" stroke-width="0.8" opacity="0.4" transform="rotate(45 12 12)" class="group-hover:opacity-60 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" stroke-width="0.8" opacity="0.4" transform="rotate(-45 12 12)" class="group-hover:opacity-60 transition-opacity"></ellipse>
    `;
    
    btn.appendChild(svg);
    return btn;
  };

  // Find the form element which contains the composer grid
  const form = composer.closest('form') || composer.querySelector('form');
  if (!form) {
    console.warn('[Orbitar] Could not find form element');
    return;
  }

  // Strategy 1: Find [grid-area:trailing] container within the form
  const trailingContainer = form.querySelector('[class*="grid-area:trailing"]') ||
                           form.querySelector('div[class*="[grid-area:trailing]"]');
  
  if (trailingContainer) {
    // Find the flex container inside trailing area
    const flexContainer = trailingContainer.querySelector('.ms-auto.flex.items-center') ||
                          trailingContainer.querySelector('div.flex.items-center');
    
    if (flexContainer) {
      const btn = createDysonButton();
      // Insert as first child of the flex container (before mic)
      flexContainer.insertBefore(btn, flexContainer.firstChild);
      integratedIconEl = btn;
      console.log('[Orbitar] Icon placed in grid-area:trailing flex container');
      return;
    }
  }

  // Strategy 2: Find dictate/mic button within form and use its parent
  const micBtn = form.querySelector('button[aria-label*="Dictate" i]') ||
                 form.querySelector('button[aria-label*="microphone" i]') ||
                 form.querySelector('button[aria-label*="voice" i]');
  
  if (micBtn && micBtn.parentElement) {
    const btn = createDysonButton();
    micBtn.parentElement.insertBefore(btn, micBtn);
    integratedIconEl = btn;
    console.log('[Orbitar] Icon placed before mic button');
    return;
  }

  // Strategy 3: Find send button within form and use its parent
  const sendBtn = form.querySelector('button[data-testid="send-button"]') ||
                  form.querySelector('#composer-submit-button') ||
                  form.querySelector('button[id*="submit"]');

  if (sendBtn && sendBtn.parentElement) {
    const btn = createDysonButton();
    sendBtn.parentElement.insertBefore(btn, sendBtn);
    integratedIconEl = btn;
    console.log('[Orbitar] Icon placed before send button');
    return;
  }

  console.warn('[Orbitar] Icon placement failed - no suitable container found');
}

/**
 * Create an integrated panel at the form/composer level for full width.
 * Based on ChatGPT's actual DOM structure.
 */
function showIntegratedPanel() {
  if (!integratedComposer) return;
  if (integratedPanelEl && integratedPanelEl.isConnected) return;

  // Find the form or the grid container that spans full width
  let panelContainer = null;
  
  // Strategy 1: Find the form element (immediate parent of grid)
  const form = integratedComposer.closest('form') || 
               integratedComposer.querySelector('form');
  
  if (form) {
    // Find the grid container inside the form
    const gridContainer = form.querySelector('div[class*="grid"]');
    if (gridContainer) {
      panelContainer = gridContainer.parentElement; // Insert before the grid
    } else {
      panelContainer = form;
    }
  }
  
  // Strategy 2: Walk up to find a wider container
  if (!panelContainer) {
    let current = integratedComposer;
    for (let i = 0; i < 5 && current && current !== document.body; i++) {
      try {
        const rect = current.getBoundingClientRect();
        const parentRect = current.parentElement?.getBoundingClientRect();
        
        if (parentRect && parentRect.width > rect.width + 40) {
          panelContainer = current.parentElement;
        }
      } catch (_e) {}
      current = current.parentElement;
    }
  }

  // Fallback to integratedComposer
  if (!panelContainer) {
    panelContainer = integratedComposer;
  }

  const panel = document.createElement("div");
  panel.className = "orbitar-panel";
  panel.innerHTML = `
    <div class="orbitar-chatgpt-bar" id="orbitar-bar">
      <div class="orbitar-panel-glow"></div>
      
      <div class="orbitar-chatgpt-left">
        <span class="orbitar-recommendation-text" id="orbitar-suggestion" style="display:none;"></span>

        <div class="orbitar-labels-row">
          <span class="orbitar-input-label">Category</span>
          <span class="orbitar-input-label">Template</span>
        </div>

        <div class="orbitar-selectors-row">
          <div class="orbitar-pill-wrap">
            <div class="orbitar-pill orbitar-category-pill">
               <span class="orbitar-pill-value" id="orbitar-category-value">General</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="orbitar-pill-chevron"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <select class="orbitar-select-native" id="orbitar-category" title="Category"></select>
          </div>

          <div class="orbitar-pill-wrap">
            <div class="orbitar-pill orbitar-template-pill">
               <span class="orbitar-pill-value" id="orbitar-template-value">General prompt</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="orbitar-pill-chevron"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <select class="orbitar-select-native" id="orbitar-template" title="Template"></select>
          </div>
        </div>
      </div>

      <div class="orbitar-chatgpt-right">
        <div class="orbitar-plan-pill">
          <span id="orbitar-plan-badge">Free</span>
        </div>
        <button class="orbitar-refine-button" id="refine-btn">
           <div class="orbitar-refine-shine"></div>
           <span style="position:relative; z-index:10;">Refine</span>
        </button>
      </div>
    </div>

    <span class="orbitar-error" id="error-msg"></span>
  `;

  // Insert at the top of the container (before everything else)
  panelContainer.insertBefore(panel, panelContainer.firstChild);

  // Wire up events
  const refineBtn = panel.querySelector("#refine-btn");
  const planBadge = panel.querySelector("#orbitar-plan-badge");
  const categorySelect = panel.querySelector("#orbitar-category");
  const templateSelect = panel.querySelector("#orbitar-template");
  const suggestionSpan = panel.querySelector("#orbitar-suggestion");
  const errorMsg = panel.querySelector("#error-msg");
  const categoryValueEl = panel.querySelector("#orbitar-category-value");
  const templateValueEl = panel.querySelector("#orbitar-template-value");

  // Fetch User Plan
  sendMessageSafe({ type: "GET_USER_PLAN" }, (resp) => {
    if (resp && resp.plan) {
      const planName = resp.plan.charAt(0).toUpperCase() + resp.plan.slice(1);
      planBadge.textContent = planName;
      planBadge.setAttribute('data-plan', resp.plan);
    } else {
      planBadge.textContent = "Free";
      planBadge.setAttribute('data-plan', 'free');
    }
  });

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

  // Initialize visible values in the pills
  try {
    categoryValueEl.textContent =
      categorySelect.options[categorySelect.selectedIndex]?.textContent ||
      ORBITAR_DEFAULT_CATEGORY;
    templateValueEl.textContent =
      templateSelect.options[templateSelect.selectedIndex]?.textContent ||
      "General prompt";
  } catch (_e) {}

  categorySelect.addEventListener("change", () => {
    userChangedCategory = true;
    populateTemplateOptions(categorySelect.value);
    // Update the visible value text for category and template
    try {
      categoryValueEl.textContent =
        categorySelect.options[categorySelect.selectedIndex]?.textContent ||
        categorySelect.value;
      templateValueEl.textContent =
        templateSelect.options[templateSelect.selectedIndex]?.textContent ||
        templateSelect.value;
    } catch (_e) {}
    suggestionSpan.style.display = "none";
  });
  
  // Prevent select clicks from bubbling and closing panel
  categorySelect.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  categorySelect.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  
  templateSelect.addEventListener("change", () => {
    userChangedTemplate = true;
    try {
      templateValueEl.textContent =
        templateSelect.options[templateSelect.selectedIndex]?.textContent ||
        templateSelect.value;
    } catch (_e) {}
    suggestionSpan.style.display = "none";
  });
  
  // Prevent select clicks from bubbling and closing panel
  templateSelect.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  templateSelect.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Function to update recommendations based on text
  function updateRecommendations(text) {
    if (!text || text.trim().length === 0 || userChangedCategory || userChangedTemplate) return;
    
    sendMessageSafe(
      {
        type: "CLASSIFY_TEXT",
        text: text,
      },
      (resp) => {
        if (!resp || resp.error) return;
        if (userChangedCategory || userChangedTemplate) return;
        const { templateId, category } = resp;
        if (category && ORBITAR_TEMPLATE_GROUPS[category]) {
          categorySelect.value = category;
          populateTemplateOptions(category);
          const group = ORBITAR_TEMPLATE_GROUPS[category];
          if (group.some((g) => g.value === templateId)) {
            templateSelect.value = templateId;
            // Update visible value texts in pills to reflect suggestion
            try {
              categoryValueEl.textContent =
                categorySelect.options[categorySelect.selectedIndex]
                  ?.textContent || category;
              templateValueEl.textContent =
                templateSelect.options[templateSelect.selectedIndex]
                  ?.textContent || templateId;
            } catch (_e) {}
            // Recommendation text with "Recommended: " prefix
            suggestionSpan.textContent = `Recommended: ${niceCategoryLabel(category)} → ${
              group.find((g) => g.value === templateId)?.label || templateId
            }`;
            suggestionSpan.style.display = "inline-block";
          }
        }
      }
    );
  }

  // Suggest category/template from current text
  const initialText = getCurrentText();
  if (initialText && initialText.trim().length > 0) {
    updateRecommendations(initialText);
  }

  // Real-time text monitoring with debounce
  let textCheckTimeout;
  let lastCheckedText = initialText || "";
  
  const textMonitorInterval = setInterval(() => {
    if (!integratedPanelEl) {
      clearInterval(textMonitorInterval);
      return;
    }
    
    const currentText = getCurrentText();
    if (currentText !== lastCheckedText) {
      lastCheckedText = currentText;
      
      // Clear existing timeout
      if (textCheckTimeout) clearTimeout(textCheckTimeout);
      
      // Set new timeout for 1 second
      textCheckTimeout = setTimeout(() => {
        updateRecommendations(currentText);
      }, 1000);
    }
  }, 250); // Check every 250ms

  refineBtn.addEventListener("click", () => {
    const text = getCurrentText();
    if (!text) {
      errorMsg.textContent = "No text";
      return;
    }
    refineBtn.disabled = true;
    refineBtn.textContent = "...";
    errorMsg.textContent = "";

    sendMessageSafe(
      {
        type: "REFINE_TEXT",
        text,
        templateId: templateSelect.value,
        category: categorySelect.value,
      },
      (response) => {
        refineBtn.disabled = false;
        refineBtn.textContent = "Refine";
        if (!response || response.error || chrome.runtime.lastError) {
          errorMsg.textContent =
            response?.error ||
            "Orbitar: backend unreachable. Is dev server running?";
          return;
        }
        replaceTextInActiveElement(response.refinedText);
        removeIntegratedPanel();
      }
    );
  });

  integratedPanelEl = panel;
}

/** Remove the integrated panel only (keep icon) */
function removeIntegratedPanel() {
  if (integratedPanelEl) {
    integratedPanelEl.remove();
    integratedPanelEl = null;
  }
}

/**
 * Resilience helpers for ChatGPT integration:
 * - Debounced MutationObserver to re-attach after SPA route changes/renders
 * - Initial attach without requiring focus so icon is present at rest
 */
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function tryAttachToChatGPT() {
  if (!isChatGPTPage()) return;
  // Try to find a composer even without focus
  const candidate =
    document.querySelector("main textarea") ||
    document.querySelector("textarea[placeholder]") ||
    document.querySelector('[contenteditable="true"][role="textbox"]') ||
    document.querySelector("div[contenteditable='true']");
  const comp = candidate ? findComposerContainerFrom(candidate) : null;
  if (comp) {
    integratedComposer = comp;
    ensureIntegratedIcon(comp);
  }
}

function initChatGPTIntegration() {
  tryAttachToChatGPT();
  const observer = new MutationObserver(
    debounce(() => {
      tryAttachToChatGPT();
    }, 150)
  );
  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });

  // Re-run on navigation and visibility changes
  window.addEventListener("pageshow", tryAttachToChatGPT);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryAttachToChatGPT();
  });

  // If focus moves to an editable, ensure icon exists
  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (isEditable(t)) {
      const comp = findComposerContainerFrom(t);
      if (comp) {
        integratedComposer = comp;
        ensureIntegratedIcon(comp);
      }
    }
  });
}

// Initialize when ready on ChatGPT pages
if (isChatGPTPage()) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      initChatGPTIntegration()
    );
  } else {
    initChatGPTIntegration();
  }
}

// --- Focus detection & Icon Management ---

document.addEventListener("focusin", (e) => {
  const target = e.target;

  if (isEditable(target)) {
    activeElement = target;

    // If on ChatGPT, integrate into the composer
    if (isChatGPTPage()) {
      integratedComposer = findComposerContainerFrom(target);
      if (integratedComposer) {
        ensureIntegratedIcon(integratedComposer);
        // Do NOT show overlay icon in ChatGPT integrated mode
        hideIcon();
        return;
      }
    }

    // Fallback to overlay icon for non-ChatGPT pages
    showIcon(target);
  } else {
    // Delay hiding to allow clicking the icon or the integrated panel
    setTimeout(() => {
      const focused = document.activeElement;
      const stillInIntegrated =
        integratedComposer?.contains?.(focused) ||
        integratedPanelEl?.contains?.(focused) ||
        integratedIconEl?.contains?.(focused);
      const stillInOverlay = toolbarHost?.contains?.(focused);

      if (!stillInIntegrated && !stillInOverlay) {
        activeElement = null;
        hideIcon();
        removeToolbar(); // also removes integrated panel
      }
    }, 200);
  }
});

// Reposition on scroll/resize for overlay mode
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
  // If we are integrating into ChatGPT, do not create/position a floating icon
  if (isChatGPTPage() && integratedComposer) {
    ensureIntegratedIcon(integratedComposer);
    return;
  }

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

  const top = rect.top + scrollY + offset;
  const left = rect.right + scrollX - size - offset - 5; // 5px padding from right edge

  orbitarIcon.style.position = "absolute";
  orbitarIcon.style.top = `${top}px`;
  orbitarIcon.style.left = `${left}px`;
}

// --- Toolbar Logic (overlay fallback) ---

function toggleToolbar() {
  // In ChatGPT integrated mode, toggle the integrated panel
  if (isChatGPTPage() && integratedComposer) {
    if (integratedPanelEl) {
      removeIntegratedPanel();
    } else {
      showIntegratedPanel();
    }
    return;
  }

  // Fallback to overlay toolbar for other sites
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
        position: relative; /* For absolute positioning of suggestion */
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
      /* Suggestion chip positioning */
      #orbitar-suggestion {
        position: absolute;
        top: -24px;
        left: 100px;
        background: rgba(32, 33, 35, 0.9);
        border: 1px solid #444;
        color: #d1d5db;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        white-space: nowrap;
        z-index: 10;
        pointer-events: none;
        display: none;
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
      #orbitar-plan-badge {
        font-size: 12px;
        color: #9ca3af;
        padding: 0 4px;
        text-transform: capitalize;
      }
    </style>
    
    <div id="orbitar-plan-badge">Loading...</div>
    
    <div class="divider"></div>

    <div style="position: relative;">
        <select class="orbitar-inline-select" id="orbitar-category" title="Category"></select>
        <span id="orbitar-suggestion"></span>
    </div>
    <select class="orbitar-inline-select" id="orbitar-template" title="Template"></select>
    
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
      #orbitar-plan-badge {
        color: #8e8ea0 !important;
        font-weight: 500 !important;
      }
      #orbitar-suggestion {
        top: -28px !important;
        left: 0 !important;
        background: #2a2b32 !important;
        border: 1px solid #3a3b45 !important;
        color: #a1a1aa !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
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
  const planBadge = container.querySelector("#orbitar-plan-badge");
  const categorySelect = container.querySelector("#orbitar-category");
  const templateSelect = container.querySelector("#orbitar-template");
  const suggestionSpan = container.querySelector("#orbitar-suggestion");
  const errorMsg = container.querySelector("#error-msg");

  // Fetch User Plan
  sendMessageSafe({ type: "GET_USER_PLAN" }, (resp) => {
    if (resp && resp.plan) {
      planBadge.textContent =
        resp.plan.charAt(0).toUpperCase() + resp.plan.slice(1);
    } else {
      planBadge.textContent = "Free"; // Fallback
    }
  });

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
            suggestionSpan.style.display = "block"; // Block for absolute positioning
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
    try {
      console.debug("Orbitar refine -> sending", {
        textLength: (text || "").length,
        templateId: templateSelect.value,
        category: categorySelect.value,
      });
    } catch (_e) {}

    sendMessageSafe(
      {
        type: "REFINE_TEXT",
        text: text,
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
        replaceTextInActiveElement(response.refinedText);
        removeToolbar();
      }
    );
  });

  positionToolbar(activeElement);
}

function removeToolbar() {
  // Remove overlay toolbar if present
  if (toolbarHost) {
    toolbarHost.remove();
    toolbarHost = null;
    toolbarRoot = null;
  }
  // Remove integrated panel if present
  if (integratedPanelEl) {
    integratedPanelEl.remove();
    integratedPanelEl = null;
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
  // Primary: currently focused editable element
  if (activeElement) {
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
  }

  // Fallback: look inside the integrated ChatGPT composer if present
  if (integratedComposer) {
    const ta = integratedComposer.querySelector("textarea");
    if (ta) return ta.value || "";
    const ce =
      integratedComposer.querySelector(
        '[contenteditable="true"][role="textbox"]'
      ) || integratedComposer.querySelector("div[contenteditable='true']");
    if (ce) return ce.innerText || "";
  }

  return "";
}

function replaceTextInActiveElement(newText) {
  // Determine the best target element to write into
  let el = activeElement;

  // Fallback to an element inside the integrated composer if nothing focused
  if (!el && integratedComposer) {
    el =
      integratedComposer.querySelector("textarea") ||
      integratedComposer.querySelector(
        '[contenteditable="true"][role="textbox"]'
      ) ||
      integratedComposer.querySelector("div[contenteditable='true']");
    if (el) {
      try {
        el.focus();
      } catch (_e) {}
      activeElement = el;
    }
  }

  if (!el) return;

  // Input/Textarea
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start !== end) {
      const val = el.value;
      el.value = val.substring(0, start) + newText + val.substring(end);
    } else {
      el.value = newText;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  // ContentEditable
  else if (el.isContentEditable) {
    try {
      el.focus();
    } catch (_e) {}
    el.innerText = newText;
    try {
      el.dispatchEvent(
        new InputEvent("input", { bubbles: true, composed: true })
      );
      el.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    } catch (_e) {
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
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
