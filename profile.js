(() => {
  const profileName = document.getElementById("profileName");
  const editProfile = document.getElementById("editProfile");
  const favoriteCount = document.getElementById("favoriteCount");
  const profileAvatar = document.getElementById("profileAvatar");
  const avatarOptions = document.querySelectorAll("[data-avatar]");
  const avatarUpload = document.getElementById("avatarUpload");
  if (!profileName || !profileAvatar || !avatarUpload) return;

  profileName.textContent = localStorage.getItem("flameDragonProfileName") || "FLAME DRAGON";
  editProfile?.addEventListener("click", () => {
    const value = prompt("Enter your player name:", profileName.textContent);
    if (value === null) return;
    const clean = value.trim().slice(0, 24);
    if (!clean) return;
    localStorage.setItem("flameDragonProfileName", clean);
    profileName.textContent = clean;
  });

  try {
    const favorites = JSON.parse(localStorage.getItem("flameDragonFavorites") || "[]");
    if (favoriteCount) favoriteCount.textContent = String(Array.isArray(favorites) ? favorites.length : 0);
  } catch { if (favoriteCount) favoriteCount.textContent = "0"; }

  function showImage(data) {
    profileAvatar.textContent = "";
    profileAvatar.style.backgroundImage = 'url("' + data + '")';
    profileAvatar.style.backgroundSize = "cover";
    profileAvatar.style.backgroundPosition = "center";
    profileAvatar.style.backgroundRepeat = "no-repeat";
  }
  function showEmoji(value) {
    profileAvatar.style.backgroundImage = "none";
    profileAvatar.textContent = value;
  }

  const savedImage = localStorage.getItem("flameDragonProfileImage");
  if (savedImage) showImage(savedImage);
  else showEmoji(localStorage.getItem("flameDragonProfileAvatar") || "🐉");

  avatarOptions.forEach(button => button.addEventListener("click", () => {
    const emoji = button.dataset.avatar;
    if (!emoji) return;
    localStorage.removeItem("flameDragonProfileImage");
    localStorage.setItem("flameDragonProfileAvatar", emoji);
    showEmoji(emoji);
  }));

  avatarUpload.addEventListener("change", async () => {
    const file = avatarUpload.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid image file.");
      avatarUpload.value = "";
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert("Please choose an image smaller than 12 MB.");
      avatarUpload.value = "";
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      let data = canvas.toDataURL("image/webp", 0.82);
      if (!data.startsWith("data:image/webp")) data = canvas.toDataURL("image/jpeg", 0.82);
      if (data.length > 900000) data = canvas.toDataURL("image/jpeg", 0.68);
      localStorage.setItem("flameDragonProfileImage", data);
      localStorage.removeItem("flameDragonProfileAvatar");
      showImage(data);
    } catch (error) {
      console.error("Could not save profile photo", error);
      alert("Couldn't save this photo. Try a smaller image.");
    } finally {
      avatarUpload.value = "";
    }
  });
})();
