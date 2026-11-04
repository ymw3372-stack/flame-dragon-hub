/* Anonymous unique program-entry tracking.
   One random ID is kept in this browser profile; no account, email or device details are sent. */
(() => {
  const STORAGE_KEY = "fdhProgramVisitorId";
  const API_KEY = "AIzaSyDhj1G--S8S2oqQxoi1PkPvI4Msmw_klq0";
  const COLLECTION = "https://firestore.googleapis.com/v1/projects/flame-dragon-hub/databases/(default)/documents/programVisitors";

  try {
    if (location.pathname.endsWith("/developer.html")) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!globalThis.crypto?.randomUUID) return;

    const visitorId = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(STORAGE_KEY, visitorId);
    const fields = {
      firstSeenAt: { timestampValue: new Date().toISOString() },
      entryPage: { stringValue: (location.pathname || "/").slice(0, 200) }
    };

    fetch(COLLECTION + "?documentId=" + encodeURIComponent(visitorId) + "&key=" + API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
      keepalive: true
    }).then(response => {
      if (!response.ok && response.status !== 409) {
        throw new Error("Visitor event rejected: " + response.status);
      }
    }).catch(error => {
      console.warn("Could not record anonymous program visitor:", error);
      try {
        if (localStorage.getItem(STORAGE_KEY) === visitorId) localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    });
  } catch (error) {
    console.warn("Anonymous visitor tracking unavailable:", error);
  }
})();
