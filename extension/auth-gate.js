// First-run sign-in gate. The popup talks straight to Firebase Auth with the same
// project API key the FLAME DRAGON HUB website uses, so one account works in both.
// No extra backend or OAuth client is involved.
(() => {
  const FDH_API_KEY = "AIzaSyDhj1G--S8S2oqQxoi1PkPvI4Msmw_klq0";
  const IDENTITY = "https://identitytoolkit.googleapis.com/v1/";
  const TOKEN = "https://securetoken.googleapis.com/v1/token";
  const AUTH_KEYS = ["fdhAuthIdToken", "fdhAuthRefreshToken", "fdhAuthExpiresAt", "fdhAuthEmail"];
  const REFRESH_MARGIN = 60 * 1000;

  const $ = id => document.getElementById(id);
  const panel = $("authPanel"), shell = $("appShell"), form = $("extensionAuthForm");
  const statusEl = $("authStatus"), emailEl = $("authEmail"), passwordEl = $("authPassword");
  if (!panel || !shell || !form) return;

  const setStatus = message => { if (statusEl) statusEl.textContent = message; };
  const setBusy = busy => {
    for (const id of ["signInBtn", "createAccountBtn", "forgotPasswordBtn"]) {
      const el = $(id);
      if (el) el.disabled = busy;
    }
  };
  function showApp(email) {
    panel.hidden = true;
    shell.hidden = false;
    const label = $("signedInEmail");
    if (label) label.textContent = email || "Signed in";
  }
  function showLogin(message) {
    shell.hidden = true;
    panel.hidden = false;
    if (message) setStatus(message);
  }

  const MESSAGES = {
    EMAIL_NOT_FOUND: "No account found with this email. Create one below.",
    INVALID_PASSWORD: "Email or password is incorrect.",
    INVALID_LOGIN_CREDENTIALS: "Email or password is incorrect.",
    USER_DISABLED: "This account has been disabled.",
    EMAIL_EXISTS: "This email already has an account. Sign in instead.",
    WEAK_PASSWORD: "Choose a stronger password (at least 6 characters).",
    INVALID_EMAIL: "Enter a valid email address.",
    MISSING_PASSWORD: "Enter your password.",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Please wait and try again."
  };
  function describe(error) {
    const code = error?.error?.message || "";
    return MESSAGES[code] || "Could not complete the request. Check your details and try again.";
  }

  async function authRequest(endpoint, payload) {
    const response = await fetch(IDENTITY + endpoint + "?key=" + FDH_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }

  async function saveSession(data) {
    const email = data.email || "";
    await chrome.storage.local.set({
      fdhAuthIdToken: data.idToken,
      fdhAuthRefreshToken: data.refreshToken,
      fdhAuthExpiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
      fdhAuthEmail: email
    });
    showApp(email);
  }

  async function refreshSession(session) {
    const response = await fetch(TOKEN + "?key=" + FDH_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: session.fdhAuthRefreshToken
      })
    });
    const data = await response.json();
    if (!response.ok) throw data;
    await saveSession({
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      email: session.fdhAuthEmail
    });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    setBusy(true);
    setStatus("Signing in...");
    try {
      const data = await authRequest("accounts:signInWithPassword", {
        email: emailEl.value.trim(),
        password: passwordEl.value,
        returnSecureToken: true
      });
      passwordEl.value = "";
      await saveSession(data);
    } catch (error) {
      setStatus(describe(error));
    } finally {
      setBusy(false);
    }
  });

  $("createAccountBtn")?.addEventListener("click", async () => {
    if (!form.reportValidity()) return;
    setBusy(true);
    setStatus("Creating your account...");
    try {
      const data = await authRequest("accounts:signUp", {
        email: emailEl.value.trim(),
        password: passwordEl.value,
        returnSecureToken: true
      });
      try {
        await authRequest("accounts:sendOobCode", { requestType: "VERIFY_EMAIL", idToken: data.idToken });
      } catch {}
      passwordEl.value = "";
      await saveSession(data);
    } catch (error) {
      setStatus(describe(error));
    } finally {
      setBusy(false);
    }
  });

  $("forgotPasswordBtn")?.addEventListener("click", async () => {
    const email = emailEl.value.trim();
    if (!email) { setStatus("Enter your email address first."); emailEl.focus(); return; }
    setBusy(true);
    setStatus("Sending password reset email...");
    try {
      await authRequest("accounts:sendOobCode", { requestType: "PASSWORD_RESET", email });
      setStatus("If this account exists, a password reset email has been sent.");
    } catch (error) {
      setStatus(describe(error));
    } finally {
      setBusy(false);
    }
  });

  $("signOutBtn")?.addEventListener("click", async () => {
    try { await chrome.storage.local.remove(AUTH_KEYS); } catch {}
    showLogin("You have signed out.");
  });

  (async () => {
    if (!chrome?.storage?.local) return showLogin();
    try {
      const session = await chrome.storage.local.get(AUTH_KEYS);
      if (!session.fdhAuthRefreshToken) return showLogin();
      if (session.fdhAuthExpiresAt > Date.now() + REFRESH_MARGIN) return showApp(session.fdhAuthEmail);
      await refreshSession(session);
    } catch {
      try { await chrome.storage.local.remove(AUTH_KEYS); } catch {}
      showLogin("Your session expired. Please sign in again.");
    }
  })();
})();
