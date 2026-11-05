const FDH_UPDATE_VERSION = "1.0.3";
const FDH_UPDATE_URL_PART = "/releases/download/v1.0.3/FLAME_DRAGON_HUB_v1.0.3.zip";
const FDH_UPDATE_FILE = "FLAME_DRAGON_HUB_v1.0.3.zip";
const FDH_UPDATE_STORAGE_KEY = "fdhCompletedUpdateDownload_1_0_3";

function isTargetUpdateDownload(item) {
  if (!item || item.state !== "complete") return false;
  const filename = String(item.filename || "").replace(/\\/g, "/").split("/").pop() || "";
  const correctFilename = filename === FDH_UPDATE_FILE ||
    (filename.startsWith("FLAME_DRAGON_HUB_v1.0.3 (") && filename.endsWith(".zip"));
  if (!correctFilename) return false;

  // Accept the exact tagged release URL and GitHub's "latest/download" alias.
  // Chrome may retain the original URL while finalUrl points at a signed asset host.
  const urls = [item.url, item.finalUrl].filter(Boolean);
  return urls.some(raw => {
    try {
      const parsed = new URL(raw);
      const path = decodeURIComponent(parsed.pathname);
      const isGitHubHost = parsed.hostname === "github.com" ||
        parsed.hostname.endsWith(".githubusercontent.com");
      return isGitHubHost && (
        path.includes(FDH_UPDATE_URL_PART) ||
        path.endsWith("/releases/latest/download/" + FDH_UPDATE_FILE) ||
        path.endsWith("/releases/download/v1.0.3/" + FDH_UPDATE_FILE)
      );
    } catch (_) {
      return raw.includes(FDH_UPDATE_URL_PART);
    }
  });
}

async function findCompletedUpdateDownload() {
  try {
    const items = await chrome.downloads.search({
      query: [FDH_UPDATE_FILE],
      orderBy: ["-startTime"],
      limit: 1000
    });
    return items.find(isTargetUpdateDownload) || null;
  } catch (_) {
    return null;
  }
}

async function saveCompletedUpdateDownload(item) {
  if (!isTargetUpdateDownload(item)) return false;
  const record = {
    downloaded: true,
    version: FDH_UPDATE_VERSION,
    completedAt: item.endTime || new Date().toISOString(),
    filename: item.filename || FDH_UPDATE_FILE
  };
  await chrome.storage.local.set({ [FDH_UPDATE_STORAGE_KEY]: record });
  await notifyUpdateStatusToTabs(record);
  return true;
}

async function notifyUpdateStatusToTabs(record) {
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(tabs.filter(tab => Number.isInteger(tab.id)).map(tab =>
      chrome.tabs.sendMessage(tab.id, {
        type: "FDH_UPDATE_DOWNLOAD_STATE",
        ...record
      }).catch(() => {})
    ));
  } catch (_) {}
}

async function refreshUpdateDownloadStatus() {
  const item = await findCompletedUpdateDownload();
  if (item) await saveCompletedUpdateDownload(item);
  return item;
}

chrome.downloads.onChanged.addListener(async delta => {
  if (delta.state?.current !== "complete") return;
  try {
    const items = await chrome.downloads.search({ id: delta.id });
    if (items[0]) await saveCompletedUpdateDownload(items[0]);
  } catch (_) {}
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "FDH_GET_UPDATE_DOWNLOAD_STATE" ||
      message?.version !== FDH_UPDATE_VERSION) return;

  (async () => {
    const stored = await chrome.storage.local.get(FDH_UPDATE_STORAGE_KEY);
    let record = stored[FDH_UPDATE_STORAGE_KEY];
    if (!record?.downloaded) {
      await refreshUpdateDownloadStatus();
      const refreshed = await chrome.storage.local.get(FDH_UPDATE_STORAGE_KEY);
      record = refreshed[FDH_UPDATE_STORAGE_KEY];
    }
    sendResponse(record?.downloaded
      ? record
      : { downloaded: false, version: FDH_UPDATE_VERSION });
  })().catch(() => sendResponse({ downloaded: false, version: FDH_UPDATE_VERSION }));

  return true;
});

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (
      (sender.url?.startsWith("https://ymw3372-stack.github.io/") ||
       sender.url?.startsWith("https://flamedragonhub.pages.dev/")) &&
      message?.type === "FDH_PING"
    ) {
      sendResponse({ installed: true });
    }
  }
);

// Check the browser's existing download history after this permission is granted,
// so a v1.0.3 ZIP downloaded before the helper update can still be recognized.
refreshUpdateDownloadStatus();

// Preserve the existing extension service-worker initialization behavior.
