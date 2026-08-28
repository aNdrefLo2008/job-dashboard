document.addEventListener("DOMContentLoaded", async () => {
  const loginView = document.getElementById("loginView");
  const clipperView = document.getElementById("clipperView");
  
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  const companyInput = document.getElementById("company");
  const platformInput = document.getElementById("platform");
  const jobUrlInput = document.getElementById("job_url");
  const salaryInput = document.getElementById("salary");
  const saveBtn = document.getElementById("saveBtn");
  const statusMsg = document.getElementById("statusMsg");

  let jwtToken = null;

  // 1. Prüfen, ob bereits eingeloggt
  chrome.storage.local.get(["jwtToken"], async (result) => {
    if (result.jwtToken) {
      jwtToken = result.jwtToken;
      showClipperView();
    } else {
      showLoginView();
    }
  });

  function showLoginView() {
    loginView.classList.remove("hidden");
    clipperView.classList.add("hidden");
    statusMsg.innerText = "";
  }

  function showClipperView() {
    loginView.classList.add("hidden");
    clipperView.classList.remove("hidden");
    statusMsg.innerText = "";
    initScraper();
  }

  // 2. Login Event
  loginBtn.addEventListener("click", async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      showError("Bitte E-Mail & Passwort eingeben!");
      return;
    }

    loginBtn.innerText = "Lade...";

    try {
      const res = await fetch("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error("Login fehlgeschlagen");

      const data = await res.json();
      jwtToken = data.token;

      // Token sicher im Browser speichern
      chrome.storage.local.set({ jwtToken: data.token }, () => {
        showClipperView();
      });
    } catch (err) {
      showError("Falsche Login-Daten!");
      loginBtn.innerText = "Einloggen";
    }
  });

  // Logout Event
  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["jwtToken"], () => {
      jwtToken = null;
      showLoginView();
    });
  });

  // 3. Smart DOM Auto-Scraper für Indeed & LinkedIn
  async function initScraper() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    jobUrlInput.value = tab.url || "";

    // Skript in der aktuellen Website ausführen, um Daten abzugreifen
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeJobDetails
    }, (results) => {
      // Platzhalter wieder normalisieren, falls nichts gefunden wird
      companyInput.placeholder = "z.B. Google";
      platformInput.placeholder = "z.B. LinkedIn / Senior Dev";

      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        
        // Wenn Daten gefunden wurden, eintragen
        companyInput.value = data.company || "";
        salaryInput.value = data.salary || "";
        
        // Wenn kein Titel gefunden wurde, nimm den Browser-Tab-Titel als Fallback
        platformInput.value = data.title || (tab.title ? tab.title.substring(0, 50) : "");
      } else {
        // Kompletter Fallback, falls das Skript fehlschlägt
        platformInput.value = tab.title ? tab.title.substring(0, 50) : "";
      }
    });
  }

  // Diese Funktion läuft DIREKT im HTML der Jobseite!
  function scrapeJobDetails() {
    let company = "";
    let title = "";
    let salary = "";

    const host = window.location.hostname;

    // INDEED SCRAPER
    if (host.includes("indeed.")) {
      company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.innerText ||
                document.querySelector('.jobsearch-CompanyReview--heading')?.innerText || "";
      title = document.querySelector('[data-testid="simulated-title"]')?.innerText || 
              document.querySelector('h1.jobsearch-JobInfoHeader-title')?.innerText || "";
      salary = document.querySelector('#salaryInfoAndJobType')?.innerText || "";
    } 
    // LINKEDIN SCRAPER
    else if (host.includes("linkedin.")) {
      company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText ||
                document.querySelector('.jobs-unified-top-card__company-name')?.innerText || "";
      title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText ||
              document.querySelector('.jobs-unified-top-card__job-title')?.innerText || "";
    }

    return {
      company: company.trim(),
      title: title.trim(),
      salary: salary.trim()
    };
  }

  // 4. Job im Go-Backend speichern
  saveBtn.addEventListener("click", async () => {
    saveBtn.innerText = "Speichere...";

    const payload = {
      company: companyInput.value || "Unbekannt",
      platform: platformInput.value || "Web",
      status: document.getElementById("status").value,
      job_url: jobUrlInput.value,
      salary: salaryInput.value,
      notes: "Hinzugefügt via Chrome Extension Auto-Clipper",
      cv_version: "Standard"
    };

    try {
      const res = await fetch("http://localhost/applications/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        statusMsg.innerText = "✅ Erfolgreich gespeichert!";
        statusMsg.style.color = "#4ade80";
        setTimeout(() => window.close(), 1000);
      } else if (res.status === 401) {
        showError("Session abgelaufen, bitte neu einloggen!");
        chrome.storage.local.remove(["jwtToken"]);
        setTimeout(showLoginView, 1500);
      } else {
        throw new Error("Fehler beim Speichern");
      }
    } catch (err) {
      showError("Fehler beim Senden!");
      saveBtn.innerText = "In Dashboard Speichern";
    }
  });

  function showError(msg) {
    statusMsg.innerText = `❌ ${msg}`;
    statusMsg.style.color = "#f87171";
  }
});