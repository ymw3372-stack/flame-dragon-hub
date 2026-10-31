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

// Stores basic account metadata and informational activity only.
// Passwords, tokens, and authentication secrets are never stored in Firestore.
export async function recordAuthEvent(user, eventType) {
  if (!user?.uid) return;
  if (!["register", "sign_in", "sign_out"].includes(eventType)) {
    throw new Error("Unsupported account activity event.");
  }

  const { provider, email, emailVerified } = await getVerifiedAuthMetadata(user);
  const activityRef = collection(db, "users", user.uid, "activity");
  const userRef = doc(db, "users", user.uid);
  const now = serverTimestamp();

  // Every event upserts the parent account document. The dashboard lists accounts
  // from the users collection and reads activity per account, so activity written
  // under a uid with no account document would never be reachable. Signing out
  // keeps the existing lastSignInAt, which is why it is read before the write.
  if (eventType === "sign_out") {
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName: user.displayName || null,
        provider,
        emailVerified,
        createdAt: now,
        lastSignInAt: now,
        updatedAt: now
      }, { merge: true });
    }
  } else {
    const existing = await getDoc(userRef);
    const accountData = {
      uid: user.uid,
      email,
      displayName: user.displayName || null,
      provider,
      emailVerified,
      lastSignInAt: now,
      updatedAt: now
    };
    if (!existing.exists()) accountData.createdAt = now;
    await setDoc(userRef, accountData, { merge: true });
  }

  await addDoc(activityRef, {
    type: eventType,
    provider,
    createdAt: serverTimestamp()
  });
}
