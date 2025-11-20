// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('token');
  const saveBtn = document.getElementById('save');
  const status = document.getElementById('status');

  // Load saved token
  chrome.storage.sync.get(['orbitarToken'], (result) => {
    if (result.orbitarToken) {
      tokenInput.value = result.orbitarToken;
    }
  });

  // Save token
  saveBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    chrome.storage.sync.set({ orbitarToken: token }, () => {
      status.style.display = 'block';
      setTimeout(() => {
        status.style.display = 'none';
      }, 2000);
    });
  });
});
