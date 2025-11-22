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
        console.log(
          "[Orbitar] Icon placed in grid-area:trailing flex container"
        );
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

    console.warn(
      "[Orbitar] Icon placement failed - no suitable container found"
    );
    return null;
  },

  injectPanel(composer, panelEl) {
    // Find the form or the grid container that spans full width
    let panelContainer = null;

    // Strategy 1: Find the form element (immediate parent of grid)
    const form = composer.closest("form") || composer.querySelector("form");

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

  // Helper to get current text from the composer - made more robust for nested or focused inputs
  getText(composer) {
    try {
      if (!composer) return "";
      // Prefer any textarea descendants (most reliable)
      const textareas = composer.querySelectorAll("textarea");
      for (const ta of textareas) {
        if (ta && typeof ta.value === "string") {
          const v = (ta.value || "").trim();
          if (v.length) return v;
        }
      }

      // Look for contenteditable or role=textbox descendants
      const editable =
        composer.querySelector('[contenteditable="true"]') ||
        composer.querySelector('[role="textbox"]') ||
        composer.querySelector('[contenteditable=""]');
      if (editable) {
        const t = (editable.innerText || editable.textContent || "").trim();
        if (t.length) return t;
      }

      // Fallback: if a focused element is a textarea or contenteditable, return its content
      const active = document.activeElement;
      if (active) {
        if (active.tagName === "TEXTAREA") {
          return (active.value || "").trim();
        }
        if (active.isContentEditable) {
          return (active.innerText || active.textContent || "").trim();
        }
      }

      // Last resort: try any descendant input-like element
      const anyTa = composer.querySelector(
        "textarea, [contenteditable='true'], [role='textbox']"
      );
      if (anyTa) {
        return (
          anyTa.value ||
          anyTa.innerText ||
          anyTa.textContent ||
          ""
        ).trim();
      }

      return "";
    } catch (_e) {
      return "";
    }
  },

  // Helper to set text in the composer
  setText(composer, text) {
    console.log("[Orbitar setText] === START ===");
    console.log("[Orbitar setText] Composer:", composer);
    console.log("[Orbitar setText] Text to set:", text);
    
    try {
      // CRITICAL: Check for contenteditable FIRST (ChatGPT uses ProseMirror contenteditable, not textarea)
      // The textarea is just a hidden fallback
      let textarea = composer.querySelector('[contenteditable="true"]');
      
      if (!textarea) {
        // Fallback to textarea, but skip hidden ones
        const textareas = composer.querySelectorAll("textarea");
        for (const ta of textareas) {
          const style = window.getComputedStyle(ta);
          if (style.display !== "none" && style.visibility !== "hidden") {
            textarea = ta;
            break;
          }
        }
      }
      
      if (!textarea) {
        console.error("[Orbitar setText] ERROR: No visible textarea or contenteditable found!");
        console.log("[Orbitar setText] Composer HTML:", composer.innerHTML);
        return false;
      }

      console.log("[Orbitar setText] Found element:", textarea.tagName, textarea);
      console.log("[Orbitar setText] Element contenteditable:", textarea.contentEditable);
      console.log("[Orbitar setText] Element display style:", window.getComputedStyle(textarea).display);

      if (textarea.tagName === "TEXTAREA") {
        console.log("[Orbitar setText] Using TEXTAREA approach");
        
        // Store old value for comparison
        const oldValue = textarea.value;
        console.log("[Orbitar setText] Old value:", oldValue);
        
        // Method 1: Try using native setter
        try {
          const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
          ).set;
          nativeTextareaSetter.call(textarea, text);
          console.log("[Orbitar setText] Native setter applied");
        } catch (e) {
          console.warn("[Orbitar setText] Native setter failed:", e);
          textarea.value = text;
        }
        
        // Verify value was set
        console.log("[Orbitar setText] New value:", textarea.value);
        console.log("[Orbitar setText] Value changed:", textarea.value !== oldValue);
        
        // Trigger React/input events
        console.log("[Orbitar setText] Dispatching events...");
        
        // Event 1: input event (most important for React)
        const inputEvent = new Event("input", { bubbles: true, cancelable: true });
        textarea.dispatchEvent(inputEvent);
        console.log("[Orbitar setText] Dispatched: input");
        
        // Event 2: change event  
        const changeEvent = new Event("change", { bubbles: true });
        textarea.dispatchEvent(changeEvent);
        console.log("[Orbitar setText] Dispatched: change");
        
        // Event 3: InputEvent with data
        try {
          const inputEventWithData = new InputEvent("input", {
            bubbles: true,
            cancelable: true,
            inputType: "insertText",
            data: text
          });
          textarea.dispatchEvent(inputEventWithData);
          console.log("[Orbitar setText] Dispatched: InputEvent with data");
        } catch (e) {
          console.warn("[Orbitar setText] InputEvent failed:", e);
        }
        
        // Focus the textarea to ensure React picks up changes
        console.log("[Orbitar setText] Focusing textarea...");
        textarea.focus();
        
        // Trigger one more input event after focus
        setTimeout(() => {
          const finalInput = new Event("input", { bubbles: true });
          textarea.dispatchEvent(finalInput);
          console.log("[Orbitar setText] Dispatched final input after focus");
          
          // Verify final state
          console.log("[Orbitar setText] Final value:", textarea.value);
          console.log("[Orbitar setText] === COMPLETE (TEXTAREA) ===");
        }, 50);
        
        return true;
        
      } else {
        console.log("[Orbitar setText] Using CONTENTEDITABLE approach");
        
        // For contenteditable (ProseMirror)
        const oldContent = textarea.textContent || textarea.innerText || "";
        console.log("[Orbitar setText] Old content:", oldContent);
        
        // Clear existing content
        textarea.innerHTML = "";
        
        // Split text by newlines and create proper structure to preserve formatting
        const lines = text.split('\n');
        console.log("[Orbitar setText] Text has", lines.length, "lines");
        
        // For each line, create a div (ProseMirror uses divs for line breaks)
        lines.forEach((line, index) => {
          const lineDiv = document.createElement('div');
          if (line.trim() === '') {
            // Empty line - add a br to preserve the line break
            lineDiv.appendChild(document.createElement('br'));
          } else {
            // Non-empty line - add text content
            lineDiv.textContent = line;
          }
          textarea.appendChild(lineDiv);
        });
        
        console.log("[Orbitar setText] New content set with", lines.length, "line divs");
        
        // Dispatch input events
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("[Orbitar setText] Dispatched events");
        
        // Focus the element
        textarea.focus();
        console.log("[Orbitar setText] Focused contenteditable");
        
        // Set cursor to end
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(textarea);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          console.log("[Orbitar setText] Set cursor to end");
        } catch (e) {
          console.warn("[Orbitar setText] Could not set cursor:", e);
        }
        
        // Trigger additional input event after a short delay
        setTimeout(() => {
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          console.log("[Orbitar setText] Dispatched delayed input event");
          console.log("[Orbitar setText] === COMPLETE (CONTENTEDITABLE) ===");
        }, 50);
        
        return true;
      }
    } catch (error) {
      console.error("[Orbitar setText] EXCEPTION:", error);
      console.error("[Orbitar setText] Stack:", error.stack);
      return false;
    }
  },
};

// Expose to global scope so content.js can find it
window.OrbitarChatGPTAdapter = OrbitarChatGPTAdapter;
