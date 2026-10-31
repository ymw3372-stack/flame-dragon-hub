import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
const $ = id => document.getElementById(id);
// Admin identity. The UID that was here before ("...caXXXzN...") was a placeholder
// that never matched a real account, which locked the owner out. Email is used now
// because it is what the owner actually knows, and Firestore rules verify it too.
const ADMIN_EMAILS = ["ymw3372@gmail.com"];
// Optional: add real UIDs here later. Both lists are accepted.
const ADMIN_UIDS = [];
function isAdminUser(user) {
  if (!user || user.emailVerified !== true) return false;
  const email = (user.email || "").toLowerCase();
  return ADMIN_EMAILS.includes(email) || ADMIN_UIDS.includes(user.uid);
}
const MAX_USERS = 100000;
// Activity is one read per user, run in parallel, so the sample stays capped.
const ACTIVITY_SAMPLE = 200;
let cachedUsers = [];

function showGate(message, title = "Administrator access required") {
  $("devContent")?.classList.add("dev-hidden");
  const gate = $("devGate");
  gate?.classList.remove("dev-hidden");
  if (gate?.querySelector("h2")) gate.querySelector("h2").textContent = title;
  if ($("devStatus")) $("devStatus").textContent = message;
}
function showDashboard() {
  $("devGate")?.classList.add("dev-hidden");
  $("devContent")?.classList.remove("dev-hidden");
}
function safeText(value) { return String(value ?? "-"); }
function formatDate(value) {
  if (!value?.toDate) return "-";
  return value.toDate().toLocaleString();
}
function cell(value) {
  const td = document.createElement("td");
  td.textContent = safeText(value);
  return td;
}
function renderUsers() {
  const table = $("usersTable");
  if (!table) return;
  const term = ($("userSearch")?.value || "").trim().toLowerCase();
  const filtered = cachedUsers.filter(user =>
    [user.email, user.displayName, user.uid].some(value => String(value || "").toLowerCase().includes(term))
  );
  table.replaceChildren();
  if (!filtered.length) {
    const row = document.createElement("tr");
    const td = cell("No matching accounts.");
    td.colSpan = 5;
    row.append(td);
    table.append(row);
  } else {
    for (const user of filtered) {
      const row = document.createElement("tr");
      row.append(
        cell(user.displayName || user.email || user.uid),
        cell(user.provider),
        cell(user.emailVerified ? "Verified" : "Not verified"),
        cell(formatDate(user.createdAt)),
        cell(formatDate(user.lastSignInAt))
      );
      table.append(row);
    }
  }
  if ($("userCount")) $("userCount").textContent = `Showing ${filtered.length} of ${cachedUsers.length} stored account records (up to ${MAX_USERS} most recently active).`;
}
async function loadDashboard() {
  const user = auth.currentUser;
  if (!user) return showGate("Please sign in first, then return to this page.");
  if (!isAdminUser(user)) {
    return showGate(
      `This area is reserved for the verified site owner.` +
      ` Signed in as ${user.email || "(no email)"}, UID ${user.uid},` +
      ` email verified: ${user.emailVerified === true ? "yes" : "no"}.`
    );
  }
  showDashboard();
  $("usersTable").innerHTML = '<tr><td colspan="5">Loading accounts...</td></tr>';
  $("activityTable").innerHTML = '<tr><td colspan="4">Loading activity...</td></tr>';
  const usersQuery = query(collection(db, "users"), orderBy("lastSignInAt", "desc"), limit(MAX_USERS));
  const snapshot = await getDocs(usersQuery);
  cachedUsers = snapshot.docs.map(item => ({ uid: item.id, ...item.data() }));
  $("totalUsers").textContent = String(cachedUsers.length);
  $("emailUsers").textContent = String(cachedUsers.filter(user => user.provider === "password").length);
  $("googleUsers").textContent = String(cachedUsers.filter(user => user.provider === "google.com").length);
  $("verifiedUsers").textContent = String(cachedUsers.filter(user => user.emailVerified === true).length);
  renderUsers();

  const activitySnapshots = await Promise.all(cachedUsers.slice(0, ACTIVITY_SAMPLE).map(user =>
    getDocs(query(collection(db, "users", user.uid, "activity"), orderBy("createdAt", "desc"), limit(5)))
  ));
  const events = [];
  activitySnapshots.forEach((snap, index) => {
    for (const item of snap.docs) events.push({ ...item.data(), email: cachedUsers[index].email || cachedUsers[index].uid });
  });
  events.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  $("totalEvents").textContent = String(events.length);
  $("latestActivity").textContent = events[0]?.createdAt?.toDate?.().toLocaleDateString() || "No events";
  const table = $("activityTable");
  table.replaceChildren();
  const latest = events.slice(0, 30);
  if (!latest.length) {
    const row = document.createElement("tr");
    const td = cell("No activity records yet.");
    td.colSpan = 4;
    row.append(td);
    table.append(row);
  } else {
    for (const event of latest) {
      const row = document.createElement("tr");
      row.append(cell(event.email), cell(event.type), cell(event.provider), cell(formatDate(event.createdAt)));
      table.append(row);
    }
  }
}
$("userSearch")?.addEventListener("input", renderUsers);
$("refreshUsers")?.addEventListener("click", () => loadDashboard().catch(error => showGate(`Could not load dashboard data: ${error.message}`, "Dashboard error")));
onAuthStateChanged(auth, user => {
  if (!user) return showGate("Please sign in first, then return to this page.");
  loadDashboard().catch(error => {
    console.error("Developer dashboard error:", error);
    showGate("Could not load account data. Check administrator access and the existing users Firestore rules.", "Dashboard error");
  });
});
