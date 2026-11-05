const FDH_UPDATE_VERSION = "1.0.3";
const FDH_UPDATE_URL_PART = "/releases/download/v1.0.3/FLAME_DRAGON_HUB_v1.0.3.zip";
const FDH_UPDATE_FILE = "FLAME_DRAGON_HUB_v1.0.3.zip";
const FDH_UPDATE_STORAGE_KEY = "fdhCompletedUpdateDownload_1_0_3";

function isTargetUpdateDownload(item) {
  if (!item || item.state !== "complete") return false;
  const source = [item.url, item.finalUrl].filter(Boolean).join(" ");
  const filename = String(item.filename || "").replace(/\\/g, "/").split("/").pop() || "";
  return source.includes(FDH_UPDATE_URL_PART) &&
    (filename === FDH_UPDATE_FILE || filename.startsWith("FLAME_DRAGON_HUB_v1.0.3 (") && filename.endsWith(".zip"));
}

async function findCompletedUpdateDownload() {
  try {
    const items = await chrome.downloads.search({
      query: [FDH_UPDATE_FILE],
      orderBy: ["-startTime"],
      limit: 100
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
