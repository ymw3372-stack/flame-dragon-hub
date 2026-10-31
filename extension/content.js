(() => {
  if (window.__fdhSkinBridgeLoaded) return;
  window.__fdhSkinBridgeLoaded = true;

  const originalSrc = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "src"
  );

  if (!originalSrc?.get || !originalSrc?.set) return;

  let frames = {};
  const trackedImages = new Set();

  function replacementFor(url) {
    try {
      const parsed = new URL(url, location.href);
      const match = parsed.pathname.match(
        /\/(idle|flying|attack)\/(\d+)\.png$/
      );

      if (!match) return null;
      return typeof frames[`${match[1]}/${match[2]}`] === "string"
        ? frames[`${match[1]}/${match[2]}`]
        : null;
    } catch {
      return null;
    }
  }

  Object.defineProperty(HTMLImageElement.prototype, "src", {
    configurable: true,
    enumerable: originalSrc.enumerable,

    get() {
      return originalSrc.get.call(this);
    },

    set(value) {
      trackedImages.add(this);
      originalSrc.set.call(
        this,
        replacementFor(String(value)) || value
      );
    }
  });

  chrome.storage.local.get("skinBundle", result => {
    const bundle = result.skinBundle;
    if (!bundle?.frames) return;

    frames = bundle.frames;

    for (const img of trackedImages) {
      const replacement = replacementFor(originalSrc.get.call(img));
      if (replacement) originalSrc.set.call(img, replacement);
    }
  });

  console.info("[FLAME DRAGON HUB] Sprite bridge initialized.");
})();
