// background.js

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'REFINE_TEXT') {
    handleRefineRequest(request, sendResponse);
    return true; // Indicates async response
  }
});

async function handleRefineRequest(request, sendResponse) {
  try {
    // Get token from storage
    const result = await chrome.storage.sync.get(['orbitarToken']);
    const token = result.orbitarToken;

    if (!token) {
      sendResponse({ error: 'No API token found. Please set it in the extension options.' });
      return;
    }

    const response = await fetch('http://localhost:3000/api/refine-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: request.text,
        modelStyle: request.modelStyle,
        template: request.template
      })
    });

    const data = await response.json();

    if (!response.ok) {
      sendResponse({ error: data.error || 'Failed to refine prompt' });
    } else {
      sendResponse({ refinedText: data.refinedText });
    }

  } catch (error) {
    console.error('Error calling Orbitar API:', error);
    sendResponse({ error: 'Network error or server unreachable.' });
  }
}

// Listen for command shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'refine-prompt') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_REFINE_MODAL' });
      }
    });
  }
});
