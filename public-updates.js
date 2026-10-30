import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
const db = getFirestore(app);
const root = document.getElementById("publicUpdates");
if (root) {
  const announcementsNode = document.getElementById("publicAnnouncements");
  const releaseNode = document.getElementById("publicRelease");
  const makeText = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value || "";
    return node;
  };
  try {
    const [releaseSnap, announcementSnap] = await Promise.all([
      getDoc(doc(db, "siteConfig", "public")),
      getDocs(query(collection(db, "announcements"), where("published", "==", true), limit(10)))
    ]);
    let hasContent = false;
    if (releaseSnap.exists()) {
      const data = releaseSnap.data();
      if (data.version || data.releaseNotes) {
        releaseNode.hidden = false;
        releaseNode.append(makeText("strong", "", `Version ${data.version || "—"}`));
        if (data.releaseNotes) releaseNode.append(makeText("p", "", data.releaseNotes));
        hasContent = true;
      }
    }
    const items = announcementSnap.docs.map(item => item.data()).sort((a,b) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    ).slice(0,5);
    for (const item of items) {
      const card = document.createElement("article");
      card.className = "public-announcement";
      card.append(makeText("h3", "", item.title || "FLAME DRAGON HUB update"));
      card.append(makeText("p", "", item.body || ""));
      announcementsNode.append(card);
      hasContent = true;
    }
    root.hidden = !hasContent;
  } catch (error) {
    console.warn("Public updates are not available yet. Check Firestore rules.", error);
  }
}
