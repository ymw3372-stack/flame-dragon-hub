const profileName = document.getElementById("profileName");
const editProfile = document.getElementById("editProfile");
const favoriteCount = document.getElementById("favoriteCount");

const profileAvatar = document.getElementById("profileAvatar");
const avatarOptions = document.querySelectorAll("[data-avatar]");
const avatarUpload = document.getElementById("avatarUpload");


// =========================
// PROFILE NAME
// =========================

const savedName =
    localStorage.getItem("flameDragonProfileName") ||
    "FLAME DRAGON";

profileName.textContent = savedName;


// Edit profile name
editProfile.addEventListener("click", () => {

    const newName = prompt(
        "Enter your player name:",
        profileName.textContent
    );

    if (!newName) return;

    const cleanName = newName.trim();

    if (!cleanName) return;

    localStorage.setItem(
        "flameDragonProfileName",
        cleanName
    );

    profileName.textContent = cleanName;
});


// =========================
// FAVORITES
// =========================

function updateFavoriteCount() {

    const favorites =
        JSON.parse(
            localStorage.getItem("flameDragonFavorites")
        ) || [];

    favoriteCount.textContent = favorites.length;
}

updateFavoriteCount();


// =========================
// LOAD AVATAR
// =========================

const savedImage =
    localStorage.getItem("flameDragonProfileImage");

const savedAvatar =
    localStorage.getItem("flameDragonProfileAvatar") || "🐉";

if (savedImage) {

    profileAvatar.textContent = "";

    profileAvatar.style.backgroundImage =
        `url("${savedImage}")`;

    profileAvatar.style.backgroundSize = "cover";
    profileAvatar.style.backgroundPosition = "center";
    profileAvatar.style.backgroundRepeat = "no-repeat";

} else {

    profileAvatar.style.backgroundImage = "none";

    profileAvatar.textContent =
        savedAvatar;
}


// =========================
// READY AVATARS
// =========================

avatarOptions.forEach(option => {

    option.addEventListener("click", () => {

        const selectedAvatar =
            option.dataset.avatar;

        // Remove uploaded image
        localStorage.removeItem(
            "flameDragonProfileImage"
        );

        profileAvatar.style.backgroundImage = "none";

        profileAvatar.textContent =
            selectedAvatar;

        localStorage.setItem(
            "flameDragonProfileAvatar",
            selectedAvatar
        );

    });

});


// =========================
// UPLOAD PHOTO
// =========================

avatarUpload.addEventListener("change", () => {

    const file = avatarUpload.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        alert("Please select an image.");

        return;
    }

    const reader = new FileReader();

    reader.onload = () => {

        profileAvatar.textContent = "";

        profileAvatar.style.backgroundImage =
            `url("${reader.result}")`;

        profileAvatar.style.backgroundSize = "cover";
        profileAvatar.style.backgroundPosition = "center";
        profileAvatar.style.backgroundRepeat = "no-repeat";

        localStorage.setItem(
            "flameDragonProfileImage",
            reader.result
        );

    };

    reader.readAsDataURL(file);

});