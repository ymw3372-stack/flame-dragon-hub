(() => {
    const performanceMode = document.getElementById("performanceMode");
    const resetSettings = document.getElementById("resetSettings");
    const backgroundSelect = document.getElementById("backgroundSelect");
    const accentColor = document.getElementById("accentColor");
    const accentColorValue = document.getElementById("accentColorValue");

    const DEFAULT_BG = "evoworld";
    const DEFAULT_ACCENT = "#ff6a2b";

    const savedPerformance = localStorage.getItem("flameDragonPerformance") === "true";
    const savedBg = localStorage.getItem("flameDragonBg") || DEFAULT_BG;
    const savedAccent = localStorage.getItem("flameDragonAccent") || DEFAULT_ACCENT;

    if (performanceMode) performanceMode.checked = savedPerformance;
    if (backgroundSelect) backgroundSelect.value = savedBg;
    if (accentColor) accentColor.value = savedAccent;
    if (accentColorValue) accentColorValue.textContent = savedAccent;

    function applyPerformanceMode(enabled) {
        document.body.classList.toggle("performance-mode", enabled);
        localStorage.setItem("flameDragonPerformance", String(enabled));
    }

    function applyBackground(bg) {
        document.body.dataset.bg = bg;
        localStorage.setItem("flameDragonBg", bg);
        ensureLayer();
    }

    function applyAccent(color) {
        document.body.style.setProperty("--fdh-accent", color);
        localStorage.setItem("flameDragonAccent", color);
        if (accentColorValue) accentColorValue.textContent = color;
        ensureLayer();
    }

    function ensureLayer() {
        if (document.querySelector(".fdh-bg-layer")) return;
        const layer = document.createElement("div");
        layer.className = "fdh-bg-layer";
        layer.setAttribute("aria-hidden", "true");
        document.body.prepend(layer);
    }

    performanceMode?.addEventListener("change", () => applyPerformanceMode(performanceMode.checked));
    backgroundSelect?.addEventListener("change", () => applyBackground(backgroundSelect.value));
    accentColor?.addEventListener("input", () => applyAccent(accentColor.value));

    resetSettings?.addEventListener("click", () => {
        applyPerformanceMode(false);
        applyBackground(DEFAULT_BG);
        applyAccent(DEFAULT_ACCENT);
        if (performanceMode) performanceMode.checked = false;
        if (backgroundSelect) backgroundSelect.value = DEFAULT_BG;
        if (accentColor) accentColor.value = DEFAULT_ACCENT;
    });

    ensureLayer();
})();
