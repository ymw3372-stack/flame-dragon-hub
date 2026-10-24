(() => {
    const container = document.querySelector(".favorites-empty");
    if (!container) return;
    const readFavorites = () => {
        try {
            const value = JSON.parse(localStorage.getItem("flameDragonFavorites") || "[]");
            return Array.isArray(value) ? value : [];
        } catch (_) { return []; }
    };
    function render() {
        const favorites = readFavorites();
        container.replaceChildren();
        if (!favorites.length) {
            const icon = document.createElement("div"); icon.className = "favorites-icon"; icon.textContent = "♡";
            const title = document.createElement("h2"); title.textContent = "No Favorites Yet";
            const p = document.createElement("p"); p.textContent = "Explore skins and save the designs you want to find again later.";
            const link = document.createElement("a"); link.href = "skins.html"; link.textContent = "Explore Skins →";
            container.append(icon, title, p, link); return;
        }
        const icon = document.createElement("div"); icon.className = "favorites-icon"; icon.textContent = "♥";
        const title = document.createElement("h2"); title.textContent = "Your Favorites";
        const p = document.createElement("p"); p.textContent = `${favorites.length} saved item${favorites.length === 1 ? "" : "s"}. Your collection stays on this browser.`;
        const list = document.createElement("div"); list.className = "favorites-list";
        favorites.forEach(name => {
            const item = document.createElement("div"); item.className = "favorite-item";
            const label = document.createElement("span"); label.textContent = name;
            const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove-favorite"; remove.textContent = "Remove";
            remove.addEventListener("click", () => {
                localStorage.setItem("flameDragonFavorites", JSON.stringify(readFavorites().filter(x => x !== name)));
                render();
            });
            item.append(label, remove); list.appendChild(item);
        });
        const link = document.createElement("a"); link.href = "skins.html"; link.textContent = "Browse Skins →";
        container.append(icon, title, p, list, link);
    }
    render();
})();
