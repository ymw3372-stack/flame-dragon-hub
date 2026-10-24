
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhj1G--S8S2oqQxoi1PkPvI4Msmw_klq0",
  authDomain: "flame-dragon-hub.firebaseapp.com",
  projectId: "flame-dragon-hub",
  storageBucket: "flame-dragon-hub.firebasestorage.app",
  messagingSenderId: "1056871902074",
  appId: "1:105687190207:web:302726ca17cdf2dc6644c3",
  measurementId: "G-D96H7FXTTL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const form = document.getElementById("authForm");
const emailInput = document.getElementById("authEmail");
const passwordInput = document.getElementById("authPassword");
const status = document.getElementById("authStatus");
const createButton = document.getElementById("createAccount");
const googleButton = document.getElementById("googleSignIn");
const resetButton = document.getElementById("resetPassword");
const signOutButton = document.getElementById("signOut");

async function startAuth() {
  await setPersistence(auth, browserLocalPersistence);

  // الصفحة دي مفيهاش عناصر الحساب؟ ما تعملش حاجة.
  if (
    !form ||
    !emailInput ||
    !passwordInput ||
    !status ||
    !createButton ||
    !googleButton ||
    !resetButton ||
    !signOutButton
  ) {
    return;
  }

  function showMessage(message) {
    status.textContent = message;
  }

  function errorMessage(error) {
    const messages = {
      "auth/email-already-in-use": "This email already has an account.",
      "auth/invalid-email": "Please enter a valid email.",
      "auth/weak-password": "Choose a stronger password (at least 6 characters).",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      "auth/popup-blocked": "Allow popups for this site and try again.",
      "auth/unauthorized-domain": "Add this website to Firebase Authorized domains.",
      "auth/network-request-failed": "Network error. Check your internet connection."
    };

    showMessage(messages[error.code] || "Something went wrong. Please try again.");
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value
      );
    } catch (error) {
      errorMessage(error);
    }
  });

  createButton.addEventListener("click", async () => {
    if (!form.reportValidity()) return;

    try {
      await createUserWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value
      );
    } catch (error) {
      errorMessage(error);
    }
  });

  googleButton.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      errorMessage(error);
    }
  });

  resetButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    if (!email) {
      showMessage("Enter your email first, then click Forgot password.");
      emailInput.focus();
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showMessage("If the address is registered, a password reset email will be sent.");
    } catch (error) {
      errorMessage(error);
    }
  });

  signOutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      errorMessage(error);
    }
  });

  onAuthStateChanged(auth, user => {
    if (user) {
      showMessage("Signed in as " + (user.email || "Google user"));
      form.hidden = true;
      googleButton.hidden = true;
      resetButton.hidden = true;
      createButton.hidden = true;
      signOutButton.hidden = false;
    } else {
      showMessage("Sign in or create your account");
      form.hidden = false;
      googleButton.hidden = false;
      resetButton.hidden = false;
      createButton.hidden = false;
      signOutButton.hidden = true;
    }
  });
}

startAuth().catch(error => {
  console.error("Firebase initialization error:", error);

  if (status) {
    status.textContent = "Could not initialize account. Check your connection and Firebase settings.";
  }
});
