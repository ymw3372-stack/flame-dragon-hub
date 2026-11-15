(() => {
    const performanceMode = document.getElementById("performanceMode");
    const resetSettings = document.getElementById("resetSettings");
    const backgroundSelect = document.getElementById("backgroundSelect");
    const accentColor = document.getElementById("accentColor");
    const accentColorValue = document.getElementById("accentColorValue");
    const glowSelect = document.getElementById("glowSelect");

    const DEFAULT_BG = "evoworld";
    const DEFAULT_ACCENT = "#ff6a2b";
    const DEFAULT_GLOW = "calm";

    const savedPerformance = localStorage.getItem("flameDragonPerformance") === "true";
    const savedBg = localStorage.getItem("flameDragonBg") || DEFAULT_BG;
    const savedAccent = localStorage.getItem("flameDragonAccent") || DEFAULT_ACCENT;
    const savedGlow = localStorage.getItem("flameDragonGlow") || DEFAULT_GLOW;

    if (performanceMode) performanceMode.checked = savedPerformance;
    if (backgroundSelect) backgroundSelect.value = savedBg;
    if (accentColor) accentColor.value = savedAccent;
    if (accentColorValue) accentColorValue.textContent = savedAccent;
    if (glowSelect) glowSelect.value = savedGlow;

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

    function applyGlow(level) {
        document.body.dataset.glow = level;
        localStorage.setItem("flameDragonGlow", level);
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
    glowSelect?.addEventListener("change", () => applyGlow(glowSelect.value));

    resetSettings?.addEventListener("click", () => {
        applyPerformanceMode(false);
        applyBackground(DEFAULT_BG);
        applyAccent(DEFAULT_ACCENT);
        applyGlow(DEFAULT_GLOW);
        if (performanceMode) performanceMode.checked = false;
        if (backgroundSelect) backgroundSelect.value = DEFAULT_BG;
        if (accentColor) accentColor.value = DEFAULT_ACCENT;
        if (glowSelect) glowSelect.value = DEFAULT_GLOW;
    });

    ensureLayer();
})();
