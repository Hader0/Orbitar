// content.js

let activeElement = null;
let orbitarIcon = null;
let shadowHost = null;
let shadowRoot = null;

// --- 1. Focus Detection & Icon Injection ---

document.addEventListener('focusin', (e) => {
  const target = e.target;
  if (isEditable(target)) {
    activeElement = target;
    showIcon(target);
  }
});

document.addEventListener('focusout', (e) => {
  // Delay hiding to allow clicking the icon
  setTimeout(() => {
    if (activeElement === e.target && !shadowHost?.contains(document.activeElement)) {
      hideIcon();
    }
  }, 200);
});

function isEditable(el) {
  return el.tagName === 'TEXTAREA' || 
         (el.tagName === 'INPUT' && el.type === 'text') || 
         el.isContentEditable;
}

function showIcon(target) {
  if (!orbitarIcon) {
    createIcon();
  }
  
  const rect = target.getBoundingClientRect();
  // Position icon at top-right of the input
  const top = rect.top + window.scrollY + 5;
  const left = rect.right + window.scrollX - 30;

  orbitarIcon.style.display = 'block';
  orbitarIcon.style.top = `${top}px`;
  orbitarIcon.style.left = `${left}px`;
}

function hideIcon() {
  if (orbitarIcon) {
    orbitarIcon.style.display = 'none';
  }
}

function createIcon() {
  orbitarIcon = document.createElement('div');
  orbitarIcon.className = 'orbitar-icon';
  orbitarIcon.title = 'Refine with Orbitar';
  document.body.appendChild(orbitarIcon);

  orbitarIcon.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent focus loss
    openRefineModal();
  });
}

// --- 2. Refine Modal (Shadow DOM) ---

function openRefineModal() {
  if (shadowHost) return; // Already open

  let initialText = '';
  const selection = window.getSelection().toString();
  
  if (selection) {
    initialText = selection;
  } else if (activeElement) {
    initialText = activeElement.value || activeElement.innerText || '';
  }

  if (!initialText.trim()) {
    alert('Please type or select some text first.');
    return;
  }

  createModalUI(initialText);
}

function createModalUI(initialText) {
  shadowHost = document.createElement('div');
  shadowHost.style.position = 'fixed';
  shadowHost.style.zIndex = '2147483647'; // Max z-index
  shadowHost.style.top = '0';
  shadowHost.style.left = '0';
  
  shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  document.body.appendChild(shadowHost);

  const style = document.createElement('style');
  style.textContent = `
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
    }
    .modal-content {
      background: white; padding: 20px; border-radius: 12px; width: 400px;
      font-family: sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    h2 { margin-top: 0; color: #333; font-size: 18px; }
    textarea { width: 100%; height: 100px; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;}
    select { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px; }
    .buttons { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
    button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .preview-area { background: #f9fafb; padding: 10px; border-radius: 6px; margin-top: 10px; display: none; }
  `;

  shadowRoot.appendChild(style);

  const container = document.createElement('div');
  container.className = 'modal-overlay';
  container.innerHTML = `
    <div class="modal-content">
      <h2>Refine with Orbitar</h2>
      <textarea id="inputText">${initialText}</textarea>
      
      <select id="modelStyle">
        <option value="General AI">General AI Style</option>
        <option value="Professional">Professional</option>
        <option value="Casual">Casual</option>
        <option value="Code">Code Optimized</option>
      </select>

      <div id="preview" class="preview-area">
        <strong>Refined:</strong>
        <p id="refinedText"></p>
      </div>

      <div class="buttons">
        <button id="closeBtn" class="btn-secondary">Cancel</button>
        <button id="refineBtn" class="btn-primary">Refine</button>
        <button id="replaceBtn" class="btn-primary" style="display:none;">Replace</button>
      </div>
    </div>
  `;

  shadowRoot.appendChild(container);

  // Event Listeners
  const closeBtn = shadowRoot.getElementById('closeBtn');
  const refineBtn = shadowRoot.getElementById('refineBtn');
  const replaceBtn = shadowRoot.getElementById('replaceBtn');
  const inputText = shadowRoot.getElementById('inputText');
  const modelStyle = shadowRoot.getElementById('modelStyle');
  const preview = shadowRoot.getElementById('preview');
  const refinedTextP = shadowRoot.getElementById('refinedText');

  closeBtn.onclick = closeModal;

  refineBtn.onclick = async () => {
    refineBtn.textContent = 'Refining...';
    refineBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REFINE_TEXT',
        text: inputText.value,
        modelStyle: modelStyle.value,
        template: 'General'
      });

      if (response.error) {
        alert(response.error);
      } else {
        refinedTextP.textContent = response.refinedText;
        preview.style.display = 'block';
        refineBtn.style.display = 'none';
        replaceBtn.style.display = 'block';
      }
    } catch (e) {
      alert('Error communicating with background script');
    } finally {
      refineBtn.textContent = 'Refine';
      refineBtn.disabled = false;
    }
  };

  replaceBtn.onclick = () => {
    const newText = refinedTextP.textContent;
    replaceUserText(newText);
    closeModal();
  };
}

function closeModal() {
  if (shadowHost) {
    document.body.removeChild(shadowHost);
    shadowHost = null;
    shadowRoot = null;
  }
}

function replaceUserText(newText) {
  if (!activeElement) return;

  if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const val = activeElement.value;
    
    // If there was a selection, replace it. Otherwise replace all? 
    // Let's replace all for now if no selection, or replace selection if exists.
    if (start !== end) {
      activeElement.value = val.substring(0, start) + newText + val.substring(end);
    } else {
      // Replace all or insert? Let's replace all to be safe/simple for v1
      activeElement.value = newText;
    }
  } else if (activeElement.isContentEditable) {
    // Simple contentEditable replacement
    activeElement.innerText = newText;
  }
}

// --- 3. Listen for background triggers (Keyboard Shortcut) ---
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'TRIGGER_REFINE_MODAL') {
    // If we have a focused element, use it
    if (document.activeElement && isEditable(document.activeElement)) {
      activeElement = document.activeElement;
      openRefineModal();
    } else {
      // Try to use selection
      const selection = window.getSelection().toString();
      if (selection) {
        openRefineModal();
      }
    }
  }
});
