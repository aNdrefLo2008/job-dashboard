document.addEventListener("DOMContentLoaded", async () => {
  // ⚙️ KONFIGURATION
  const GOOGLE_CLIENT_ID = "140044066141-o2i676ttmv05k425kc5uoanh6fjphigt.apps.googleusercontent.com";
  const BACKEND_URL = "https://job-dashboard-5pzp.onrender.com"; // Passe die URL an dein Backend an (z. B. http://localhost/auth/login oder http://localhost:8080)

  const loginView = document.getElementById("loginView");
  const clipperView = document.getElementById("clipperView");
  
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  const companyInput = document.getElementById("company");
  const platformInput = document.getElementById("platform");
  const jobUrlInput = document.getElementById("job_url");
  const salaryInput = document.getElementById("salary");
  const saveBtn = document.getElementById("saveBtn");
  const statusMsg = document.getElementById("statusMsg");

  let jwtToken = null;

  // 1. Prüfen, ob bereits eingeloggt (egal ob über Google oder E-Mail/Passwort)
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

  // 2a. Normaler Login Event (E-Mail & Passwort)
  loginBtn.addEventListener("click", async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      showError("Bitte E-Mail & Passwort eingeben!");
      return;
    }

    loginBtn.innerText = "Lade...";

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error("Login fehlgeschlagen");

      const data = await res.json();
      saveTokenAndLogin(data.token);
    } catch (err) {
      showError("Falsche Login-Daten!");
      loginBtn.innerText = "Einloggen";
    }
  });

  // 2b. Google Login Event
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
      const redirectUrl = chrome.identity.getRedirectURL();

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("response_type", "id_token");
      authUrl.searchParams.set("redirect_uri", redirectUrl);
      authUrl.searchParams.set("scope", "openid email profile");
      authUrl.searchParams.set("nonce", Math.random().toString(36).substring(2));

      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.toString(),
          interactive: true,
        },
        async (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            showError("Google Login abgebrochen!");
            return;
          }

          const urlHash = new URL(responseUrl).hash.substring(1);
          const params = new URLSearchParams(urlHash);
          const idToken = params.get("id_token");

          if (!idToken) {
            showError("Kein Token empfangen");
            return;
          }

          try {
            const res = await fetch(`${BACKEND_URL}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: idToken }),
            });

            if (!res.ok) throw new Error("Google Backend Login fehlgeschlagen");

            const data = await res.json();
            saveTokenAndLogin(data.token);
          } catch (err) {
            showError("Google Login fehlgeschlagen!");
          }
        }
      );
    });
  }

  // Token im Browser-Storage speichern und View umschalten
  function saveTokenAndLogin(token) {
    jwtToken = token;
    chrome.storage.local.set({ jwtToken: token }, () => {
      showClipperView();
    });
  }

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

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeJobDetails
    }, (results) => {
      companyInput.placeholder = "z.B. Google";
      platformInput.placeholder = "z.B. LinkedIn / Senior Dev";

      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        companyInput.value = data.company || "";
        salaryInput.value = data.salary || "";
        platformInput.value = data.title || (tab.title ? tab.title.substring(0, 50) : "");
      } else {
        platformInput.value = tab.title ? tab.title.substring(0, 50) : "";
      }
    });
  }

  function scrapeJobDetails() {
    let company = "";
    let title = "";
    let salary = "";

    const host = window.location.hostname;

    if (host.includes("indeed.")) {
      company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.innerText ||
                document.querySelector('.jobsearch-CompanyReview--heading')?.innerText || "";
      title = document.querySelector('[data-testid="simulated-title"]')?.innerText || 
              document.querySelector('h1.jobsearch-JobInfoHeader-title')?.innerText || "";
      salary = document.querySelector('#salaryInfoAndJobType')?.innerText || "";
    } 
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
      const res = await fetch(`${BACKEND_URL}/applications/`, {
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