import { getApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(getApp());

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

// Stores basic account metadata and an informational activity event.
// Passwords, tokens, and authentication secrets are never stored in Firestore.
export async function recordAuthEvent(user, eventType) {
  if (!user?.uid) return;
  if (!["register", "sign_in", "sign_out"].includes(eventType)) {
    throw new Error("Unsupported account activity event.");
  }

  const { provider, email, emailVerified } = await getVerifiedAuthMetadata(user);
  const activityRef = collection(db, "users", user.uid, "activity");

  // Signing out is an activity event, not a new sign-in. Do not change lastSignInAt.
  if (eventType === "sign_out") {
    await addDoc(activityRef, {
      type: eventType,
      provider,
      createdAt: serverTimestamp()
    });
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);
  const now = serverTimestamp();

  const accountData = {
    uid: user.uid,
    email,
    displayName: user.displayName || null,
    provider,
    emailVerified,
    lastSignInAt: now,
    updatedAt: now
  };

  if (!existing.exists()) {
    accountData.createdAt = now;
  }

  await setDoc(userRef, accountData, { merge: true });

  await addDoc(activityRef, {
    type: eventType,
    provider,
    createdAt: serverTimestamp()
  });
}
