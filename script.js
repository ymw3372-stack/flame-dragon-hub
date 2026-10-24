const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".evolution-card");

filters.forEach(filter => {

    filter.addEventListener("click", () => {

        filters.forEach(button => {
            button.classList.remove("active");
        });

        filter.classList.add("active");

        const selected = filter.textContent.trim().toLowerCase();

        cards.forEach(card => {

            const difficulty =
                card.querySelector(".difficulty").textContent
                .trim()
                .toLowerCase();

            if (selected === "all" || difficulty === selected) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }

        });

    });

});


/* =========================
   FAVORITES
   ========================= */

const favoriteButtons = document.querySelectorAll(".favorite-btn");

favoriteButtons.forEach(button => {

    button.addEventListener("click", () => {

        const favoriteName = button.dataset.favorite;

        let favorites =
            JSON.parse(localStorage.getItem("flameDragonFavorites")) || [];

        if (favorites.includes(favoriteName)) {

            favorites = favorites.filter(item => item !== favoriteName);

            button.textContent = "♡";

        } else {

            favorites.push(favoriteName);

            button.textContent = "♥";

        }

        localStorage.setItem(
            "flameDragonFavorites",
            JSON.stringify(favorites)
        );

    });

});