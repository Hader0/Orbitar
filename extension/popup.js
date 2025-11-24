// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("token");
  const saveBtn = document.getElementById("save");
  const status = document.getElementById("status");

  // Load saved token
  chrome.storage.sync.get(["orbitarToken"], (result) => {
    if (result.orbitarToken) {
      tokenInput.value = result.orbitarToken;
    }
  });

  // Save token
  saveBtn.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    chrome.storage.sync.set({ orbitarToken: token }, async () => {
      status.style.display = "block";
      setTimeout(() => {
        status.style.display = "none";
      }, 2000);

      // After saving a token locally, verify it with the backend.
      // If valid and onboarding hasn't been shown for this profile, open the installed page.
      // In production change the installedUrl to your production installed page, e.g. https://getorbitar.com/installed
      const installedUrl = "http://localhost:3000/installed";
      const endpoints = [
        "http://localhost:3001/api/user/me",
        "http://127.0.0.1:3001/api/user/me",
        "http://localhost:3000/api/user/me",
        "http://127.0.0.1:3000/api/user/me",
      ];

      try {
        const { onboardingShown } = await new Promise((res) =>
          chrome.storage.sync.get(["onboardingShown"], (r) => res(r || {}))
        );

        if (onboardingShown) {
          // Already shown; nothing to do.
          return;
        }

        let ok = false;
        for (const endpoint of endpoints) {
          try {
            const resp = await fetch(endpoint, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            if (resp && resp.ok) {
              ok = true;
              break;
            }
          } catch (_e) {
            // try next endpoint
            continue;
          }
        }

        if (ok) {
          // Open the installed onboarding page in a new tab and mark onboardingShown = true.
          chrome.tabs.create({ url: installedUrl }, () => {
            chrome.storage.sync.set({ onboardingShown: true });
          });
        }
      } catch (err) {
        // Non-fatal; just log.
        console.error("Orbitar popup: onboarding check failed", err);
      }
    });
  });
});
