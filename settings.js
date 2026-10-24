(() => {
    const themeSelect = document.getElementById("themeSelect");
    const performanceMode = document.getElementById("performanceMode");
    const resetSettings = document.getElementById("resetSettings");
    const savedTheme = localStorage.getItem("flameDragonTheme") || "ember";
    const savedPerformance = localStorage.getItem("flameDragonPerformance") === "true";
    if (themeSelect) themeSelect.value = savedTheme;
    if (performanceMode) performanceMode.checked = savedPerformance;
    function applyTheme(theme) {
        document.body.dataset.theme = theme;
        localStorage.setItem("flameDragonTheme", theme);
    }
    function applyPerformanceMode(enabled) {
        document.body.classList.toggle("performance-mode", enabled);
        localStorage.setItem("flameDragonPerformance", String(enabled));
    }
    themeSelect?.addEventListener("change", () => applyTheme(themeSelect.value));
    performanceMode?.addEventListener("change", () => applyPerformanceMode(performanceMode.checked));
    resetSettings?.addEventListener("click", () => {
        applyTheme("ember"); applyPerformanceMode(false);
        if (themeSelect) themeSelect.value = "ember";
        if (performanceMode) performanceMode.checked = false;
    });
})();
