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

function getProvider(user) {
  return user.providerData?.[0]?.providerId || "password";
}

// Stores only basic account metadata. Passwords and authentication secrets are never stored here.
export async function recordAuthEvent(user, eventType) {
  if (!user?.uid) return;

  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);
  const provider = getProvider(user);
  const now = serverTimestamp();

  const accountData = {
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    provider,
    emailVerified: Boolean(user.emailVerified),
    lastSignInAt: now,
    updatedAt: now
  };

  if (!existing.exists()) {
    accountData.createdAt = now;
  }

  await setDoc(userRef, accountData, { merge: true });

  await addDoc(collection(db, "users", user.uid, "activity"), {
    type: eventType,
    provider,
    createdAt: serverTimestamp()
  });
}
