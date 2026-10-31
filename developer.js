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

// Administrator identity, by verified email. This is the check that worked before
// commit 2bdb7f38 swapped it for a UID placeholder ("...caXXXzN...") which matched
// no real account, so the gate could never open. Firestore enforces the same email.
const ADMIN_EMAILS = ["ymw3372@gmail.com"];
// Optional extra allowlist. Both lists are accepted.
const ADMIN_UIDS = [];
function isAdminUser(user) {
  if (!user) return false;
  if (user.emailVerified !== true) return false;
  const email = (user.email || "").trim().toLowerCase();
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

// A failed read is not an access denial. Keep the dashboard open and report the
// problem inline, so a Firestore rules issue never looks like "not the owner".
function showReadError(message) {
  const content = $("devContent");
  if (!content) return;
  let box = $("devReadError");
  if (!box) {
    box = document.createElement("div");
    box.id = "devReadError";
    box.className = "dev-message";
    content.prepend(box);
  }
  box.textContent = message;
}
function clearReadError() {
  $("devReadError")?.remove();
}
function describeReadError(error) {
  const code = error?.code || "";
  const raw = error?.message || String(error);
  if (code === "permission-denied" || /insufficient permissions/i.test(raw)) {
    return "Authorized as owner, but Firestore denied the read. The rules deployed in "
      + "Firebase Console still contain the old placeholder UID. Open Firebase Console, "
      + "project flame-dragon-hub, Firestore Database, Rules, paste the updated "
      + "firestore.rules from this repo and press Publish.";
  }
  if (code === "failed-precondition") {
    return "Authorized as owner, but the query needs a Firestore index. Open the browser "
      + "console for the exact index link, or check the users collection is populated. Details: " + raw;
  }
  return "Authorized as owner, but loading account data failed: " + raw;
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

// Falls back to an unordered read when orderBy cannot be served.
async function readUsers() {
  try {
    const ordered = query(collection(db, "users"), orderBy("lastSignInAt", "desc"), limit(MAX_USERS));
    return await getDocs(ordered);
  } catch (error) {
    if (error?.code === "permission-denied") throw error;
    return await getDocs(query(collection(db, "users"), limit(MAX_USERS)));
  }
}

async function loadDashboard() {
  const user = auth.currentUser;
  if (!user) {
    showGate("Please sign in first, then return to this page.");
    return;
  }
  if (!isAdminUser(user)) {
    showGate(
      "This area is reserved for the verified site owner."
      + ` Signed in as ${user.email || "(no email)"}, UID ${user.uid},`
      + ` email verified: ${user.emailVerified === true ? "yes" : "no"}.`
    );
    return;
  }

  // Authorized: open the dashboard first, then load. Reads must not re-lock it.
  showDashboard();
  clearReadError();
  if ($("usersTable")) $("usersTable").innerHTML = '<tr><td colspan="5">Loading accounts...</td></tr>';
  if ($("activityTable")) $("activityTable").innerHTML = '<tr><td colspan="4">Loading activity...</td></tr>';

  try {
    const snapshot = await readUsers();
    cachedUsers = snapshot.docs.map(item => ({ uid: item.id, ...item.data() }));
    if ($("totalUsers")) $("totalUsers").textContent = String(cachedUsers.length);
    if ($("emailUsers")) $("emailUsers").textContent = String(cachedUsers.filter(u => u.provider === "password").length);
    if ($("googleUsers")) $("googleUsers").textContent = String(cachedUsers.filter(u => u.provider === "google.com").length);
    if ($("verifiedUsers")) $("verifiedUsers").textContent = String(cachedUsers.filter(u => u.emailVerified === true).length);
    renderUsers();
  } catch (error) {
    console.error("Developer dashboard read error:", error);
    if ($("usersTable")) $("usersTable").innerHTML = '<tr><td colspan="5">Accounts could not be loaded.</td></tr>';
    showReadError(describeReadError(error));
    return;
  }

  try {
    const activitySnapshots = await Promise.all(cachedUsers.slice(0, ACTIVITY_SAMPLE).map(user =>
      getDocs(query(collection(db, "users", user.uid, "activity"), orderBy("createdAt", "desc"), limit(5)))
    ));
    const events = [];
    activitySnapshots.forEach((snap, index) => {
      for (const item of snap.docs) events.push({ ...item.data(), email: cachedUsers[index].email || cachedUsers[index].uid });
    });
    events.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    if ($("totalEvents")) $("totalEvents").textContent = String(events.length);
    if ($("latestActivity")) $("latestActivity").textContent = events[0]?.createdAt?.toDate?.().toLocaleDateString() || "No events";
    const table = $("activityTable");
    if (!table) return;
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
  } catch (error) {
    console.error("Developer dashboard activity error:", error);
    const table = $("activityTable");
    if (table) {
      table.replaceChildren();
      const row = document.createElement("tr");
      const td = cell("Activity could not be loaded.");
      td.colSpan = 4;
      row.append(td);
      table.append(row);
    }
    showReadError(describeReadError(error));
  }
}

$("userSearch")?.addEventListener("input", renderUsers);
$("refreshUsers")?.addEventListener("click", () => { loadDashboard(); });
onAuthStateChanged(auth, user => {
  if (!user) {
    showGate("Please sign in first, then return to this page.");
    return;
  }
  loadDashboard();
});
