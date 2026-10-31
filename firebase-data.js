import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhj1G--S8S2oqQxoi1PkPvI4Msmw_klq0",
  authDomain: "flame-dragon-hub.firebaseapp.com",
  projectId: "flame-dragon-hub",
  storageBucket: "flame-dragon-hub.firebasestorage.app",
  messagingSenderId: "1056871902074",
  appId: "1:105687190207:web:302726ca17cdf2dc6644c3",
  measurementId: "G-D96H7FXTTL"
};

// This module may be evaluated before auth.js. Initialize or reuse the same app safely.
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use the provider recorded in the signed Firebase ID token so it matches Firestore rules.
async function getVerifiedAuthMetadata(user) {
  await user.getIdToken(true);
  const tokenResult = await user.getIdTokenResult();
  return {
    provider: tokenResult.claims.firebase?.sign_in_provider || "password",
    email: tokenResult.claims.email ?? user.email ?? null,
    emailVerified: tokenResult.claims.email_verified === true
  };
}

// Ensure every authenticated user has a parent document in users/{uid}.
// This backfills users who were already signed in before account syncing was fixed.
export async function ensureAccountRecord(user) {
  if (!user?.uid) return;
  const { provider, email, emailVerified } = await getVerifiedAuthMetadata(user);
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);
  const accountData = {
    uid: user.uid,
    email,
    displayName: user.displayName || null,
    provider,
    emailVerified,
    lastSignInAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  if (!existing.exists()) {
    accountData.createdAt = serverTimestamp();
  }
  await setDoc(userRef, accountData, { merge: true });
}

// Store activity separately from the account record.
export async function recordAuthEvent(user, eventType) {
  if (!user?.uid) return;
  if (!["register", "sign_in", "sign_out"].includes(eventType)) {
    throw new Error("Unsupported account activity event.");
  }

  const { provider } = await getVerifiedAuthMetadata(user);
  if (eventType === "sign_out") {
    const userRef = doc(db, "users", user.uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) await ensureAccountRecord(user);
  } else {
    await ensureAccountRecord(user);
  }
  const activityRef = collection(db, "users", user.uid, "activity");
  await addDoc(activityRef, {
    type: eventType,
    provider,
    createdAt: serverTimestamp()
  });
}
