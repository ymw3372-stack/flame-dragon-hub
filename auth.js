
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { recordAuthEvent } from "./firebase-data.js";

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
  sendPasswordResetEmail,
  sendEmailVerification,
  reload
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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
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
const resendVerificationButton = document.getElementById("resendVerification");
const refreshVerificationButton = document.getElementById("refreshVerification");

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
    !signOutButton ||
    !resendVerificationButton ||
    !refreshVerificationButton
  ) {
    return;
  }

  function showMessage(message) {
    status.textContent = message;
  }

  async function recordAuthEventSafely(user, eventType) {
    try {
      await recordAuthEvent(user, eventType);
      return "";
    } catch (error) {
      // Authentication may succeed while Firestore fails. Never hide this:
      // the owner needs the exact reason because the dashboard reads Firestore.
      console.error("Could not save account activity:", error);
      const detail = [error?.code, error?.message].filter(Boolean).join(" — ");
      return "Your account is active, but its activity could not be saved. "
        + "The Developer Dashboard may not show it yet. " + (detail || "Check Firestore Rules.");
    }
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
      "auth/network-request-failed": "Network error. Check your internet connection.",
      "auth/too-many-requests": "Too many attempts. Please wait a while and try again.",
      "auth/requires-recent-login": "Please sign in again, then retry this action."
    };

    showMessage(messages[error.code] || "Something went wrong. Please try again.");
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value
      );
      const saveWarning = await recordAuthEventSafely(credential.user, "sign_in");
      if (saveWarning) showMessage(saveWarning);
    } catch (error) {
      errorMessage(error);
    }
  });

  createButton.addEventListener("click", async () => {
    if (!form.reportValidity()) return;

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value
      );
      const saveWarning = await recordAuthEventSafely(credential.user, "register");
      await sendEmailVerification(credential.user);
      showMessage(saveWarning || ("Account created! We sent a verification link to " + credential.user.email + ". Check your inbox and spam folder."));
    } catch (error) {
      errorMessage(error);
    }
  });

  googleButton.addEventListener("click", async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const saveWarning = await recordAuthEventSafely(credential.user, "sign_in");
      if (saveWarning) showMessage(saveWarning);
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

  resendVerificationButton.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      showMessage("Sign in first to resend the verification email.");
      return;
    }

    try {
      await sendEmailVerification(user);
      showMessage("A new verification email has been sent. Check your inbox and spam folder.");
    } catch (error) {
      errorMessage(error);
    }
  });

  refreshVerificationButton.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await reload(user);
      await renderAccountState(auth.currentUser);
    } catch (error) {
      errorMessage(error);
    }
  });

  signOutButton.addEventListener("click", async () => {
    try {
      if (auth.currentUser) {
        await recordAuthEventSafely(auth.currentUser, "sign_out");
      }
      await signOut(auth);
    } catch (error) {
      errorMessage(error);
    }
  });

  async function renderAccountState(user) {
    const signedIn = Boolean(user);
    const verified = Boolean(user && user.emailVerified);

    if (!signedIn) {
      showMessage("Sign in or create your account");
      form.hidden = false;
      googleButton.hidden = false;
      resetButton.hidden = false;
      createButton.hidden = false;
      signOutButton.hidden = true;
      resendVerificationButton.hidden = true;
      refreshVerificationButton.hidden = true;
      return;
    }

    form.hidden = true;
    googleButton.hidden = true;
    resetButton.hidden = true;
    createButton.hidden = true;
    signOutButton.hidden = false;
    resendVerificationButton.hidden = !user.email || verified;
    refreshVerificationButton.hidden = !user.email || verified;

    if (verified) {
      showMessage("Your account is verified. Signed in as " + (user.email || "Google user"));
    } else {
      showMessage("Your account was created, but your email is not verified yet. Open the verification link we sent to " + (user.email || "your email") + ". Then click 'I've verified my email'.");
    }
  }

  onAuthStateChanged(auth, user => {
    renderAccountState(user).catch(errorMessage);
  });
}

startAuth().catch(error => {
  console.error("Firebase initialization error:", error);

  if (status) {
    status.textContent = "Could not initialize account. Check your connection and Firebase settings.";
  }
});
