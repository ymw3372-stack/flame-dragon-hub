(() => {
  const UPDATE_VERSION = "1.0.3";

  function applyDownloadState(state) {
    if (!state?.downloaded || state.version !== UPDATE_VERSION) return;

    const apply = () => {
      if (!document.documentElement) return;
      document.documentElement.setAttribute("data-fdh-v103-downloaded", "true");
      window.dispatchEvent(new CustomEvent("fdh-update-download-state", {
        detail: {
          downloaded: true,
          version: UPDATE_VERSION
        }
      }));
    };

    if (document.documentElement) apply();
    else document.addEventListener("DOMContentLoaded", apply, { once: true });
  }

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type === "FDH_UPDATE_DOWNLOAD_STATE") {
      applyDownloadState(message);
    }
  });

  chrome.runtime.sendMessage({
    type: "FDH_GET_UPDATE_DOWNLOAD_STATE",
    version: UPDATE_VERSION
  }, response => {
    if (chrome.runtime.lastError) return;
    applyDownloadState(response);
  });
})();
