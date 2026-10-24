
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (
      sender.url?.startsWith(
        "https://ymw3372-stack.github.io/"
      ) &&
      message?.type === "FDH_PING"
    ) {
      sendResponse({ installed: true });
    }
  }
);
