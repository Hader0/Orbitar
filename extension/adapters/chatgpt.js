// adapters/chatgpt.js

const OrbitarChatGPTAdapter = {
  name: "ChatGPT",
  
  isMatch() {
    const host = location.hostname;
    return (
      /(^|\.)chatgpt\.com$/i.test(host) || /(^|\.)openai\.com$/i.test(host)
    );
  },

  findComposer(target) {
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
  },

  ensureIcon(composer, createIconFn, togglePanelFn) {
    // Check if icon already exists in the DOM (not just in memory var)
    if (document.querySelector(".orbitar-chatgpt-icon")) return;

    const btn = createIconFn(togglePanelFn);

    // Find the form element which contains the composer grid
    const form = composer.closest("form") || composer.querySelector("form");
    if (!form) {
      console.warn("[Orbitar] Could not find form element");
      return;
    }

    // Strategy 1: Find [grid-area:trailing] container within the form
    const trailingContainer =
      form.querySelector('[class*="grid-area:trailing"]') ||
      form.querySelector('div[class*="[grid-area:trailing]"]');

    if (trailingContainer) {
      // Find the flex container inside trailing area
      const flexContainer =
        trailingContainer.querySelector(".ms-auto.flex.items-center") ||
        trailingContainer.querySelector("div.flex.items-center");

      if (flexContainer) {
        // Insert as first child of the flex container (before mic)
        flexContainer.insertBefore(btn, flexContainer.firstChild);
        console.log("[Orbitar] Icon placed in grid-area:trailing flex container");
        return btn;
      }
    }

    // Strategy 2: Find dictate/mic button within form and use its parent
    const micBtn =
      form.querySelector('button[aria-label*="Dictate" i]') ||
      form.querySelector('button[aria-label*="microphone" i]') ||
      form.querySelector('button[aria-label*="voice" i]');

    if (micBtn && micBtn.parentElement) {
      micBtn.parentElement.insertBefore(btn, micBtn);
      console.log("[Orbitar] Icon placed before mic button");
      return btn;
    }

    // Strategy 3: Find send button within form and use its parent
    const sendBtn =
      form.querySelector('button[data-testid="send-button"]') ||
      form.querySelector("#composer-submit-button") ||
      form.querySelector('button[id*="submit"]');

    if (sendBtn && sendBtn.parentElement) {
      sendBtn.parentElement.insertBefore(btn, sendBtn);
      console.log("[Orbitar] Icon placed before send button");
      return btn;
    }

    console.warn("[Orbitar] Icon placement failed - no suitable container found");
    return null;
  },

  injectPanel(composer, panelEl) {
    // Find the form or the grid container that spans full width
    let panelContainer = null;

    // Strategy 1: Find the form element (immediate parent of grid)
    const form =
      composer.closest("form") ||
      composer.querySelector("form");

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
      let current = composer;
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

    // Fallback to composer
    if (!panelContainer) {
      panelContainer = composer;
    }

    // Insert at the top of the container (before everything else)
    panelContainer.insertBefore(panelEl, panelContainer.firstChild);
    return panelEl;
  },
  
  // Helper to get current text from the composer
  getText(composer) {
    const textarea = composer.querySelector("textarea") || 
                     composer.querySelector('[contenteditable="true"]');
    if (textarea) {
      return textarea.value || textarea.innerText || "";
    }
    return "";
  },

  // Helper to set text in the composer
  setText(composer, text) {
    const textarea = composer.querySelector("textarea") || 
                     composer.querySelector('[contenteditable="true"]');
    if (!textarea) return;

    if (textarea.tagName === "TEXTAREA") {
      textarea.value = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      textarea.innerText = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
};

// Expose to global scope so content.js can find it
window.OrbitarChatGPTAdapter = OrbitarChatGPTAdapter;
