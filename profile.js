import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

(() => {
  const profileName = document.getElementById("profileName");
  const editProfile = document.getElementById("editProfile");
  const favoriteCount = document.getElementById("favoriteCount");
  const profileAvatar = document.getElementById("profileAvatar");
  const avatarOptions = document.querySelectorAll("[data-avatar]");
  const avatarUpload = document.getElementById("avatarUpload");
  const guestEditNotice = document.getElementById("guestEditNotice");
  if (!profileName || !profileAvatar || !avatarUpload) return;

  const firebaseConfig = {
    apiKey: "AIzaSyDhj1G--S8S2oqQxoi1PkPvI4Msmw_klq0",
    authDomain: "flame-dragon-hub.firebaseapp.com",
    projectId: "flame-dragon-hub",
    storageBucket: "flame-dragon-hub.firebasestorage.app",
    messagingSenderId: "1056871902074",
    appId: "1:105687190207:web:302726ca17cdf2dc6644c3",
    measurementId: "G-D96H7FXTTL"
  };
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const DEFAULT_NAME = "FLAME DRAGON";
  const DEFAULT_AVATAR = "🐉";
  let activeUser = null;
  let profileReady = false;

  function showImage(data) {
    profileAvatar.textContent = "";
    profileAvatar.style.backgroundImage = 'url("' + data + '")';
    profileAvatar.style.backgroundSize = "cover";
    profileAvatar.style.backgroundPosition = "center";
    profileAvatar.style.backgroundRepeat = "no-repeat";
  }

  function showEmoji(value) {
    profileAvatar.style.backgroundImage = "none";
    profileAvatar.textContent = value || DEFAULT_AVATAR;
  }

  function setEditingEnabled(enabled) {
    if (editProfile) editProfile.disabled = !enabled;
    avatarOptions.forEach(button => { button.disabled = !enabled; });
    avatarUpload.disabled = !enabled;
  }

  function showGuestProfile() {
    activeUser = null;
    profileReady = false;
    profileName.textContent = "Guest";
    showEmoji(DEFAULT_AVATAR);
    setEditingEnabled(false);
    if (guestEditNotice) guestEditNotice.hidden = false;
    // Remove legacy browser-wide profile data so it cannot leak between accounts.
    try {
      localStorage.removeItem("flameDragonProfileName");
      localStorage.removeItem("flameDragonProfileImage");
      localStorage.removeItem("flameDragonProfileAvatar");
    } catch (_) {}
  }

  async function saveProfile(changes) {
    const user = activeUser;
    if (!user || !profileReady) return;
    const profileRef = doc(db, "users", user.uid, "profile", "settings");
    try {
      await setDoc(profileRef, {
        displayName: profileName.textContent || DEFAULT_NAME,
        avatarEmoji: profileAvatar.style.backgroundImage === "none"
          ? (profileAvatar.textContent || DEFAULT_AVATAR)
          : (window.__fdhAvatarEmoji || DEFAULT_AVATAR),
        avatarImage: window.__fdhAvatarImage || "",
        ...changes,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Could not save account profile:", error);
      alert("Couldn't save your profile to your account. Please check your connection and try again.");
    }
  }

  function applyProfile(data) {
    const name = typeof data.displayName === "string" && data.displayName.trim()
      ? data.displayName.trim().slice(0, 24) : DEFAULT_NAME;
    const emoji = typeof data.avatarEmoji === "string" && data.avatarEmoji
      ? data.avatarEmoji : DEFAULT_AVATAR;
    const image = typeof data.avatarImage === "string" ? data.avatarImage : "";
    profileName.textContent = name;
    window.__fdhAvatarEmoji = emoji;
    window.__fdhAvatarImage = image;
    if (image) showImage(image);
    else showEmoji(emoji);
  }

  editProfile?.addEventListener("click", async () => {
    if (!activeUser || !profileReady) return;
    const value = prompt("Enter your player name:", profileName.textContent);
    if (value === null) return;
    const clean = value.trim().slice(0, 24);
    if (!clean) return;
    profileName.textContent = clean;
    await saveProfile({ displayName: clean });
  });

  try {
    const favorites = JSON.parse(localStorage.getItem("flameDragonFavorites") || "[]");
    if (favoriteCount) favoriteCount.textContent = String(Array.isArray(favorites) ? favorites.length : 0);
  } catch {
    if (favoriteCount) favoriteCount.textContent = "0";
  }

  avatarOptions.forEach(button => button.addEventListener("click", async () => {
    if (!activeUser || !profileReady) return;
    const emoji = button.dataset.avatar;
    if (!emoji) return;
    window.__fdhAvatarEmoji = emoji;
    window.__fdhAvatarImage = "";
    showEmoji(emoji);
    await saveProfile({ avatarEmoji: emoji, avatarImage: "" });
  }));

  avatarUpload.addEventListener("change", async () => {
    if (!activeUser || !profileReady) {
      avatarUpload.value = "";
      return;
    }
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
      const scale = Math.min(1, 384 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();

      let data = canvas.toDataURL("image/webp", 0.72);
      if (!data.startsWith("data:image/webp")) data = canvas.toDataURL("image/jpeg", 0.62);
      if (data.length > 800000) data = canvas.toDataURL("image/jpeg", 0.42);
      if (data.length > 800000) throw new Error("Image is too large after compression.");

      window.__fdhAvatarEmoji = DEFAULT_AVATAR;
      window.__fdhAvatarImage = data;
      showImage(data);
      await saveProfile({ avatarEmoji: DEFAULT_AVATAR, avatarImage: data });
    } catch (error) {
      console.error("Could not save profile photo:", error);
      alert("Couldn't save this photo. Please choose a smaller image.");
    } finally {
      avatarUpload.value = "";
    }
  });

  onAuthStateChanged(auth, async user => {
    if (!user) {
      showGuestProfile();
      return;
    }

    activeUser = user;
    profileReady = false;
    if (guestEditNotice) guestEditNotice.hidden = true;
    setEditingEnabled(false);
    profileName.textContent = "Loading profile…";
    showEmoji(DEFAULT_AVATAR);

    try {
      const profileRef = doc(db, "users", user.uid, "profile", "settings");
      const snapshot = await getDoc(profileRef);
      if (auth.currentUser?.uid !== user.uid) return;

      if (snapshot.exists()) {
        applyProfile(snapshot.data());
      } else {
        const initialProfile = {
          displayName: user.displayName?.trim().slice(0, 24) || DEFAULT_NAME,
          avatarEmoji: DEFAULT_AVATAR,
          avatarImage: "",
          updatedAt: serverTimestamp()
        };
        await setDoc(profileRef, initialProfile);
        if (auth.currentUser?.uid !== user.uid) return;
        applyProfile(initialProfile);
      }

      profileReady = true;
      setEditingEnabled(true);
      // Clear old shared profile values after the account-specific profile is loaded.
      try {
        localStorage.removeItem("flameDragonProfileName");
        localStorage.removeItem("flameDragonProfileImage");
        localStorage.removeItem("flameDragonProfileAvatar");
      } catch (_) {}
    } catch (error) {
      console.error("Could not load account profile:", error);
      if (auth.currentUser?.uid === user.uid) {
        profileName.textContent = DEFAULT_NAME;
        showEmoji(DEFAULT_AVATAR);
        setEditingEnabled(false);
        alert("Couldn't load your saved profile. Please check your connection and refresh the page.");
      }
    }
  });
})();
