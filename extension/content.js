// content.js

let activeAdapter = null;
let integratedComposer = null; // the composer container
let integratedPanelEl = null; // the top panel shown when Dyson icon clicked
let integratedIconEl = null; // the Dyson icon injected into the composer

/* --- Orbitar injected assets & helpers --- */
function injectOrbitarAssets() {
  try {
    if (document.getElementById("orbitar-displace")) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("id", "orbitar-displace");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    svg.innerHTML = `
      <defs>
        <filter id="orbitar-displace" x="0" y="0" width="100%" height="100%">
          <feTurbulence baseFrequency="0.9" numOctaves="2" seed="2" result="turb" />
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="6" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    `;
    (document.body || document.documentElement).appendChild(svg);
  } catch (e) {
    console.warn("[Orbitar] failed to inject assets", e);
  }
}

function addRefineFilterListeners(btn) {
  if (!btn) return;
  try {
    if (btn.__orbitar_filter_listeners) return;
    const onEnter = () => {
      try {
        btn.style.transition = "filter 220ms ease";
        btn.style.filter = "url(#orbitar-displace)";
      } catch (_e) {}
    };
    const onLeave = () => {
      try {
        btn.style.filter = "";
      } catch (_e) {}
    };
    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.__orbitar_filter_listeners = { onEnter, onLeave };
    btn.classList.add("orbitar-refine-with-filter");
  } catch (e) {
    console.warn("[Orbitar] addRefineFilterListeners failed", e);
  }
}

/* --- Safe Messaging --- */
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

/* --- Template Taxonomy --- */
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

/* --- UI Creation Helpers --- */

function createDysonButton(onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "orbitar-chatgpt-icon composer-btn";
  btn.title = "Orbitar – Refine prompt";
  btn.ariaLabel = "Open Orbitar";
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
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
}

function createPanel() {
  const panel = document.createElement("div");
  panel.className = "orbitar-panel";
  panel.innerHTML = `
    <span class="orbitar-recommendation-text" id="orbitar-suggestion" style="display:none;"></span>
    <div class="orbitar-chatgpt-bar" id="orbitar-bar">
      <div class="orbitar-panel-glow"></div>
      
      <div class="orbitar-chatgpt-left">
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

          <div class="orbitar-plan-pill">
            <span id="orbitar-plan-badge">Free</span>
          </div>
        </div>
      </div>

      <div class="orbitar-chatgpt-right">
        <div class="orbitar-refine-wrapper">
          <button class="orbitar-refine-button" id="refine-btn">
             <div class="orbitar-refine-shine"></div>
             <span style="position:relative; z-index:10;">Refine</span>
          </button>
          <span class="orbitar-usage-text" id="orbitar-usage-text"></span>
        </div>
      </div>
    </div>

    <span class="orbitar-error" id="error-msg"></span>
  `;
  return panel;
}

/* --- Logic --- */

function ensureIntegratedIcon(composer) {
  if (integratedIconEl && integratedIconEl.isConnected) return;
  if (!activeAdapter) return;

  const togglePanel = () => {
    if (integratedPanelEl) {
      removeIntegratedPanel();
    } else {
      showIntegratedPanel();
    }
  };

  integratedIconEl = activeAdapter.ensureIcon(
    composer,
    createDysonButton,
    togglePanel
  );
}

function showIntegratedPanel() {
  if (!activeAdapter) return;
  // Ensure we have a composer reference — try to recover if it wasn't set earlier
  if (!integratedComposer) {
    try {
      const candidate =
        document.activeElement ||
        document.querySelector("main textarea") ||
        document.querySelector("textarea[placeholder]") ||
        document.querySelector('[contenteditable="true"][role="textbox"]') ||
        document.querySelector('div[contenteditable="true"]');
      if (candidate && activeAdapter && activeAdapter.findComposer) {
        const found = activeAdapter.findComposer(candidate);
        if (found) integratedComposer = found;
      }
    } catch (_e) {}
  }
  if (!integratedComposer) return;
  if (integratedPanelEl && integratedPanelEl.isConnected) return;

  const panel = createPanel();

  // Wire up events
  const refineBtn = panel.querySelector("#refine-btn");
  // Prevent the refine button from taking focus away from the composer so we can reliably read text
  try {
    refineBtn.addEventListener("mousedown", (e) => e.preventDefault());
  } catch (_e) {}
  const planBadge = panel.querySelector("#orbitar-plan-badge");
  const usageText = panel.querySelector("#orbitar-usage-text");
  const categorySelect = panel.querySelector("#orbitar-category");
  const templateSelect = panel.querySelector("#orbitar-template");
  const suggestionSpan = panel.querySelector("#orbitar-suggestion");
  const errorMsg = panel.querySelector("#error-msg");
  const categoryValueEl = panel.querySelector("#orbitar-category-value");
  const templateValueEl = panel.querySelector("#orbitar-template-value");

  // Ensure there's a compact suggestion element (used by the UI)
  const suggestionTextEl =
    panel.querySelector("#orbitar-suggestion-text") ||
    (function () {
      const el = document.createElement("span");
      el.className = "orbitar-suggestion-text";
      el.id = "orbitar-suggestion-text";
      el.style.display = "none";
      // Append to left column so it's visible in the panel layout
      const leftCol =
        panel.querySelector(".orbitar-chatgpt-left") ||
        panel.querySelector(".orbitar-labels-row");
      if (leftCol) leftCol.appendChild(el);
      el.style.cursor = "pointer";
      // Make the compact suggestion clickable: apply category/template when clicked
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        try {
          const cat = el.dataset.category;
          const tpl = el.dataset.templateId;
          if (cat) {
            categorySelect.value = cat;
            populateTemplateOptions(cat);
          }
          if (tpl) {
            templateSelect.value = tpl;
          }
          try {
            categoryValueEl.textContent =
              categorySelect.options[categorySelect.selectedIndex]
                ?.textContent || categorySelect.value;
            templateValueEl.textContent =
              templateSelect.options[templateSelect.selectedIndex]
                ?.textContent || templateSelect.value;
          } catch (_e) {}
          // Hide the compact suggestion after applying
          el.style.display = "none";
        } catch (_e) {}
      });
      return el;
    })();

  // Fetch User Plan and Usage
  // Local counters so the UI can show "remaining / total" and decrement on successful refine
  let usedCount = 0;
  let planLimit = 10;
  sendMessageSafe({ type: "GET_USER_PLAN" }, (resp) => {
    if (resp && resp.plan) {
      const planName = resp.plan.charAt(0).toUpperCase() + resp.plan.slice(1);
      planBadge.textContent = planName;
      planBadge.setAttribute("data-plan", resp.plan);

      if (
        typeof resp.dailyUsageCount === "number" &&
        typeof resp.limit === "number"
      ) {
        usedCount = resp.dailyUsageCount;
        planLimit = resp.limit;
      } else {
        usedCount = 0;
        planLimit = 10;
      }

      const remaining = Math.max(0, planLimit - usedCount);
      usageText.textContent = `${remaining} / ${planLimit} left today`;
      usageText.setAttribute(
        "title",
        `${remaining} of ${planLimit} refinements remaining today`
      );

      try {
        const pill = planBadge.parentElement;
        if (pill) {
          pill.setAttribute("data-plan", resp.plan);
        }
      } catch (_e) {}
    } else {
      planBadge.textContent = "Free";
      planBadge.setAttribute("data-plan", "free");
      usedCount = 0;
      planLimit = 10;
      const remaining = Math.max(0, planLimit - usedCount);
      usageText.textContent = `${remaining} / ${planLimit} left today`;
      usageText.setAttribute(
        "title",
        `${remaining} of ${planLimit} refinements remaining today`
      );
      try {
        const pill = planBadge.parentElement;
        if (pill) {
          pill.setAttribute("data-plan", "free");
        }
      } catch (_e) {}
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

  // Initialize visible values
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

  categorySelect.addEventListener("mousedown", (e) => e.stopPropagation());
  categorySelect.addEventListener("click", (e) => e.stopPropagation());

  templateSelect.addEventListener("change", () => {
    userChangedTemplate = true;
    try {
      templateValueEl.textContent =
        templateSelect.options[templateSelect.selectedIndex]?.textContent ||
        templateSelect.value;
    } catch (_e) {}
    suggestionSpan.style.display = "none";
  });

  templateSelect.addEventListener("mousedown", (e) => e.stopPropagation());
  templateSelect.addEventListener("click", (e) => e.stopPropagation());

  // Function to update recommendations
  function updateRecommendations(text) {
    if (
      !text ||
      text.trim().length === 0 ||
      userChangedCategory ||
      userChangedTemplate
    )
      return;

    sendMessageSafe(
      {
        type: "CLASSIFY_TEXT",
        text: text,
      },
      (resp) => {
        // Hide compact suggestion by default unless we have a good response
        try {
          suggestionTextEl.style.display = "none";
        } catch (_e) {}
        if (!resp || resp.error) return;
        if (userChangedCategory || userChangedTemplate) return;
        const { templateId, category } = resp;
        if (category && ORBITAR_TEMPLATE_GROUPS[category]) {
          categorySelect.value = category;
          populateTemplateOptions(category);
          const group = ORBITAR_TEMPLATE_GROUPS[category];
          if (group.some((g) => g.value === templateId)) {
            templateSelect.value = templateId;
            try {
              categoryValueEl.textContent =
                categorySelect.options[categorySelect.selectedIndex]
                  ?.textContent || category;
              templateValueEl.textContent =
                templateSelect.options[templateSelect.selectedIndex]
                  ?.textContent || templateId;
            } catch (_e) {}

            // Top recommendation card (fancier)
            suggestionSpan.innerHTML = `
              <span>Recommended: ${niceCategoryLabel(category)} → ${
              group.find((g) => g.value === templateId)?.label || templateId
            }</span>
              <button id="orbitar-dismiss-recommendation" title="Dismiss" style="background:none; border:none; cursor:pointer; color:inherit; margin-left:8px; padding:0; display:inline-flex; align-items:center; opacity:0.7;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            `;
            // Ensure the recommendation block is visible and readable across themes
            suggestionSpan.style.display = "inline-flex";
            suggestionSpan.style.alignItems = "center";
            suggestionSpan.style.visibility = "visible";
            suggestionSpan.style.opacity = "1";
            suggestionSpan.style.position =
              suggestionSpan.style.position || "relative";
            suggestionSpan.style.zIndex = 9999;

            // Compact inline suggestion (used in the labels row)
            try {
              const compactLabel =
                group.find((g) => g.value === templateId)?.label || templateId;
              suggestionTextEl.textContent = `${niceCategoryLabel(
                category
              )} → ${compactLabel}`;
              // store metadata so the compact suggestion can be applied when clicked
              try {
                suggestionTextEl.dataset.category = category;
                suggestionTextEl.dataset.templateId = templateId;
              } catch (_e) {}
              suggestionTextEl.style.display = "inline";
            } catch (_e) {}

            const dismissBtn = suggestionSpan.querySelector(
              "#orbitar-dismiss-recommendation"
            );
            if (dismissBtn) {
              dismissBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Reset to General
                categorySelect.value = ORBITAR_DEFAULT_CATEGORY;
                populateTemplateOptions(ORBITAR_DEFAULT_CATEGORY);
                templateSelect.value = ORBITAR_DEFAULT_TEMPLATE_ID;

                try {
                  categoryValueEl.textContent = ORBITAR_DEFAULT_CATEGORY;
                  templateValueEl.textContent = "General prompt";
                } catch (_e) {}

                suggestionSpan.style.display = "none";
                try {
                  suggestionTextEl.style.display = "none";
                } catch (_e) {}
                userChangedCategory = false;
                userChangedTemplate = false;
              });
            }
          }
        }
      }
    );
  }

  // Suggest category/template from current text
  const initialText = activeAdapter.getText(integratedComposer);
  if (initialText && initialText.trim().length > 0) {
    updateRecommendations(initialText);
  }

  // Real-time text monitoring
  let textCheckTimeout;
  let lastCheckedText = initialText || "";

  const textMonitorInterval = setInterval(() => {
    if (!integratedPanelEl) {
      clearInterval(textMonitorInterval);
      return;
    }

    const currentText = activeAdapter.getText(integratedComposer);
    if (currentText !== lastCheckedText) {
      lastCheckedText = currentText;

      if (!currentText || currentText.trim().length === 0) {
        userChangedCategory = false;
        userChangedTemplate = false;
        try {
          categorySelect.value = ORBITAR_DEFAULT_CATEGORY;
          populateTemplateOptions(ORBITAR_DEFAULT_CATEGORY);
          templateSelect.value = ORBITAR_DEFAULT_TEMPLATE_ID;

          categoryValueEl.textContent =
            categorySelect.options[categorySelect.selectedIndex]?.textContent ||
            ORBITAR_DEFAULT_CATEGORY;
          templateValueEl.textContent =
            templateSelect.options[templateSelect.selectedIndex]?.textContent ||
            "General prompt";
        } catch (_e) {}
        suggestionSpan.style.display = "none";

        if (textCheckTimeout) {
          clearTimeout(textCheckTimeout);
          textCheckTimeout = null;
        }
        return;
      }

      if (textCheckTimeout) clearTimeout(textCheckTimeout);

      textCheckTimeout = setTimeout(() => {
        updateRecommendations(currentText);
      }, 1000);
    }
  }, 250);

  refineBtn.addEventListener("click", () => {
    // Robustly obtain text: prefer adapter, fall back to focused element and global selectors
    let text = "";
    try {
      if (activeAdapter && activeAdapter.getText) {
        text = activeAdapter.getText(integratedComposer) || "";
      }
    } catch (_e) {
      text = "";
    }

    // Fallback to currently focused editable element if adapter didn't find text
    if ((!text || text.trim().length === 0) && document.activeElement) {
      const a = document.activeElement;
      try {
        if (a.tagName === "TEXTAREA") {
          text = a.value || "";
        } else if (a.isContentEditable) {
          text = a.innerText || a.textContent || "";
        }
      } catch (_e) {
        text = text || "";
      }
    }

    // Final fallback: try common global selector patterns (useful when focus moved)
    if (!text || text.trim().length === 0) {
      try {
        const globalEl =
          document.querySelector("main textarea") ||
          document.querySelector("textarea[placeholder]") ||
          document.querySelector('[contenteditable="true"][role="textbox"]') ||
          document.querySelector('div[contenteditable="true"]') ||
          document.querySelector('[role="textbox"]');
        if (globalEl) {
          // If we found a global editable, prefer using its parent composer if possible
          try {
            if (activeAdapter && activeAdapter.findComposer) {
              const candidateComposer = activeAdapter.findComposer(globalEl);
              if (candidateComposer) {
                integratedComposer = candidateComposer;
              }
            }
          } catch (_e) {
            // ignore
          }

          if (globalEl.tagName === "TEXTAREA") {
            text = globalEl.value || "";
          } else if (globalEl.isContentEditable) {
            text = globalEl.innerText || globalEl.textContent || "";
          } else {
            text =
              globalEl.value ||
              globalEl.innerText ||
              globalEl.textContent ||
              "";
          }
        }
      } catch (_e) {
        /* ignore */
      }
    }

    if (!text || text.trim().length === 0) {
      errorMsg.textContent = "No text";
      return;
    }

    const prevHTML = refineBtn.innerHTML;
    refineBtn.setAttribute("data-prev-html", prevHTML);
    refineBtn.disabled = true;
    refineBtn.setAttribute("aria-busy", "true");
    errorMsg.textContent = "";
    refineBtn.innerHTML = `
           <div class="orbitar-refine-shine"></div>
           <span style="position:relative; z-index:10; display:inline-flex; align-items:center;">
             <svg width="16" height="16" viewBox="0 0 50 50" aria-label="Loading">
               <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-dasharray="31.4 188.4">
                 <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/>
               </circle>
             </svg>
           </span>
    `;

    sendMessageSafe(
      {
        type: "REFINE_TEXT",
        text,
        templateId: templateSelect.value,
        category: categorySelect.value,
      },
      (response) => {
        const original = refineBtn.getAttribute("data-prev-html");
        if (original) refineBtn.innerHTML = original;
        refineBtn.disabled = false;
        refineBtn.setAttribute("aria-busy", "false");

        if (!response || response.error || chrome.runtime.lastError) {
          errorMsg.textContent =
            response?.error ||
            "Orbitar: backend unreachable. Is dev server running?";
          return;
        }

        const refined = response.refinedText || "";
        if ((refined || "").trim() === (text || "").trim()) {
          errorMsg.textContent = "No changes suggested.";
          return;
        }

        activeAdapter.setText(integratedComposer, refined);

        // Update local usage counters so the UI shows remaining / total and counts down
        try {
          usedCount = (typeof usedCount === "number" ? usedCount : 0) + 1;
          const remaining = Math.max(0, planLimit - usedCount);
          usageText.textContent = `${remaining} / ${planLimit} left today`;
          usageText.setAttribute(
            "title",
            `${remaining} of ${planLimit} refinements remaining today`
          );
        } catch (_e) {}

        removeIntegratedPanel();
      }
    );
  });

  try {
    addRefineFilterListeners(refineBtn);
  } catch (_e) {}

  integratedPanelEl = activeAdapter.injectPanel(integratedComposer, panel);

  // Ensure standalone recommendation panel exists (restore the original Recommendation component)
  if (!document.getElementById("orbitar-recommendation-panel")) {
    try {
      const rec = document.createElement("div");
      rec.id = "orbitar-recommendation-panel";
      rec.className = "orbitar-recommendation-text";
      rec.style.display = "none";
      // Place it just after the injected panel so it appears visually near the bar
      if (integratedPanelEl && integratedPanelEl.parentElement) {
        integratedPanelEl.parentElement.insertBefore(
          rec,
          integratedPanelEl.nextSibling
        );
      } else {
        document.body.appendChild(rec);
      }
    } catch (e) {
      /* ignore errors creating recommendation panel */
    }
  }
}

function removeIntegratedPanel() {
  if (integratedPanelEl) {
    integratedPanelEl.remove();
    integratedPanelEl = null;
  }
}

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function tryAttach() {
  if (!activeAdapter) return;

  // Try to find a composer even without focus
  const candidate =
    document.querySelector("main textarea") ||
    document.querySelector("textarea[placeholder]") ||
    document.querySelector('[contenteditable="true"][role="textbox"]') ||
    document.querySelector('div[contenteditable="true"]');

  if (candidate) {
    const composer = activeAdapter.findComposer(candidate);
    if (composer) {
      integratedComposer = composer;
      ensureIntegratedIcon(composer);
    }
  }
}

/* --- Initialization --- */

function init() {
  // Determine active adapter
  if (window.OrbitarChatGPTAdapter && window.OrbitarChatGPTAdapter.isMatch()) {
    activeAdapter = window.OrbitarChatGPTAdapter;
    console.log("[Orbitar] Active adapter:", activeAdapter.name);
  } else {
    console.log("[Orbitar] No matching adapter found for this site.");
    return;
  }

  injectOrbitarAssets();

  // Initial attach attempt
  setTimeout(tryAttach, 1000);
  setTimeout(tryAttach, 3000);

  // Watch for focus
  document.addEventListener(
    "focus",
    (e) => {
      const target = e.target;
      if (isEditable(target)) {
        const composer = activeAdapter.findComposer(target);
        if (composer) {
          integratedComposer = composer;
          ensureIntegratedIcon(composer);
        }
      }
    },
    true
  );

  // Watch for DOM changes (SPA navigation)
  const observer = new MutationObserver(
    debounce(() => {
      tryAttach();
    }, 500)
  );
  observer.observe(document.body, { childList: true, subtree: true });
}

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

// Start
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
