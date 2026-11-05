import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
let unsubscribe = null;
let handling = false;

function showModerationNotice(message) {
  let notice = document.getElementById("fdh-account-access-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "fdh-account-access-notice";
    notice.setAttribute("role", "status");
    notice.style.cssText = "position:fixed;z-index:1000001;top:14px;left:50%;transform:translateX(-50%);width:min(520px,calc(100% - 28px));padding:14px 17px;border:1px solid rgba(239,194,105,.55);border-radius:13px;background:rgba(24,17,8,.97);color:#ffe4aa;box-shadow:0 12px 35px #0009;font:700 13px/1.6 Arial,sans-serif;text-align:center";
    document.body.appendChild(notice);
  }
  notice.textContent = message;
}

async function getBlockedMessage(user, data) {
  if (!data) return "";
  const activeBan = data.active === true &&
    (!data.expiresAt?.toMillis || data.expiresAt.toMillis() > Date.now());
  const token = await user.getIdTokenResult();
  const authTime = Date.parse(token.authTime || "") || 0;
  const kickTime = data.kickAt?.toMillis?.() || 0;
  if (activeBan) {
    return data.expiresAt?.toDate
      ? "This FLAME DRAGON HUB account is suspended until " + data.expiresAt.toDate().toLocaleString() + "."
      : "This FLAME DRAGON HUB account has been permanently banned.";
  }
  if (kickTime > authTime) {
    return "The site owner signed this account out. You can sign in again.";
  }
  return "";
}

async function enforceFromSnapshot(user, snapshot) {
  if (handling || auth.currentUser?.uid !== user.uid) return;
  const message = await getBlockedMessage(user, snapshot.exists() ? snapshot.data() : null);
  if (!message || auth.currentUser?.uid !== user.uid) return;
  handling = true;
  try {
    showModerationNotice(message);
    await signOut(auth);
  } catch (error) {
    console.warn("Could not sign out the moderated account:", error);
  } finally {
    handling = false;
  }
}

onAuthStateChanged(auth, async user => {
  unsubscribe?.();
  unsubscribe = null;
  if (!user) return;

  try {
    const ref = doc(db, "userBans", user.uid);
    const initial = await getDoc(ref);
    await enforceFromSnapshot(user, initial);
    if (auth.currentUser?.uid !== user.uid) return;
    unsubscribe = onSnapshot(ref, snapshot => {
      enforceFromSnapshot(user, snapshot).catch(error =>
        console.warn("Account moderation check failed:", error)
      );
    }, error => console.warn("Account moderation listener error:", error));
  } catch (error) {
    // A Firestore Rules deployment issue must not crash normal public hub pages.
    console.warn("Account moderation status is unavailable:", error);
  }
});
