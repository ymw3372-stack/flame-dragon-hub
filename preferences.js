(function () {
    const theme = localStorage.getItem("flameDragonTheme") || "ember";
    const performanceEnabled = localStorage.getItem("flameDragonPerformance") === "true";
    document.body.dataset.theme = theme;
    document.body.classList.toggle("performance-mode", performanceEnabled);
})();
