document.addEventListener("DOMContentLoaded", async () => {
  const tokenInput = document.getElementById("token");
  const companyInput = document.getElementById("company");
  const platformInput = document.getElementById("platform");
  const jobUrlInput = document.getElementById("job_url");
  const saveBtn = document.getElementById("saveBtn");
  const statusMsg = document.getElementById("statusMsg");

  // 1. Gespeicherten Auth-Token laden
  chrome.storage.local.get(["jwtToken"], (result) => {
    if (result.jwtToken) tokenInput.value = result.jwtToken;
  });

  // Token speichern wenn geändert
  tokenInput.addEventListener("change", () => {
    chrome.storage.local.set({ jwtToken: tokenInput.value });
  });

  // 2. Aktiven Tab auslesen (URL & Seitentitel)
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    jobUrlInput.value = tab.url || "";
    // Versucht den Firmennamen grob aus dem Seitentitel zu erraten
    platformInput.value = tab.title ? tab.title.substring(0, 40) : "";
  }

  // 3. Bewerbung an Go-Backend senden
  saveBtn.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      statusMsg.innerText = "❌ Bitte zuerst Token eingeben!";
      statusMsg.style.color = "#f87171";
      return;
    }

    const payload = {
      company: companyInput.value || "Unbekannt",
      platform: platformInput.value || "Web",
      status: document.getElementById("status").value,
      job_url: jobUrlInput.value,
      salary: document.getElementById("salary").value,
      notes: "Hinzugefügt via Chrome Extension",
      cv_version: "Standard"
    };

    saveBtn.innerText = "Speichere...";
    
    try {
      const res = await fetch("http://localhost/applications/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        statusMsg.innerText = "✅ Erfolgreich gespeichert!";
        statusMsg.style.color = "#4ade80";
        setTimeout(() => window.close(), 1200);
      } else {
        const errorText = await res.text();
        console.error("API Fehler:", res.status, errorText);
        statusMsg.innerText = `❌ Fehler ${res.status}: ${res.statusText}`;
        statusMsg.style.color = "#f87171";
        saveBtn.innerText = "Speichern";
      }
    } catch (err) {
      console.error("Netzwerkfehler:", err);
      statusMsg.innerText = "❌ Netzwerkfehler (CORS / Host)?";
      statusMsg.style.color = "#f87171";
      saveBtn.innerText = "Speichern";
    }
  });
});