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

const MAX_USERS = 10000;
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
  if ($("userCount")) $("userCount").textContent = `Showing ${filtered.length} of ${cachedUsers.length} stored account records (up to ${MAX_USERS} accounts).`;
}

// Firestore drops documents that lack the field used in orderBy, which hides any
// account whose document has no lastSignInAt yet. An unordered read is used first
// and the ordering is applied here, so no stored account can go missing.
async function readUsers() {
  let snapshot;
  try {
    snapshot = await getDocs(query(collection(db, "users"), limit(MAX_USERS)));
  } catch (error) {
    if (error?.code === "permission-denied") throw error;
    snapshot = await getDocs(query(collection(db, "users"), orderBy("lastSignInAt", "desc"), limit(MAX_USERS)));
  }
  return snapshot.docs
    .map(item => ({ uid: item.id, ...item.data() }))
    .sort((a, b) => (b.lastSignInAt?.toMillis?.() || 0) - (a.lastSignInAt?.toMillis?.() || 0));
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
    cachedUsers = await readUsers();
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
    // allSettled, not all: one unreadable account must not hide every other
    // account's activity, which is what previously made new sign-ins look missing.
    const sample = cachedUsers.slice(0, ACTIVITY_SAMPLE);
    const results = await Promise.allSettled(sample.map(user =>
      getDocs(query(collection(db, "users", user.uid, "activity"), orderBy("createdAt", "desc"), limit(5)))
    ));
    const events = [];
    const failures = [];
    results.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        failures.push(`${sample[index].email || sample[index].uid}: ${result.reason?.code || result.reason?.message || result.reason}`);
        return;
      }
      for (const item of result.value.docs) {
        events.push({ ...item.data(), email: sample[index].email || sample[index].uid });
      }
    });
    if (failures.length) {
      console.warn("Activity unreadable for some accounts:", failures);
      showReadError(`Activity could not be read for ${failures.length} of ${sample.length} loaded accounts. First reason: ${failures[0]}`);
    }
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

// New sign-ins happen on other tabs and on the site itself, so the dashboard
// reloads when this tab is focused again instead of waiting for a manual refresh.
let lastLoad = 0;
const RELOAD_INTERVAL = 15000;
function reloadIfStale() {
  if (!auth.currentUser || !isAdminUser(auth.currentUser)) return;
  if (document.visibilityState !== "visible") return;
  if (Date.now() - lastLoad < RELOAD_INTERVAL) return;
  lastLoad = Date.now();
  loadDashboard();
}
window.addEventListener("focus", reloadIfStale);
document.addEventListener("visibilitychange", reloadIfStale);

onAuthStateChanged(auth, user => {
  if (!user) {
    showGate("Please sign in first, then return to this page.");
    return;
  }
  lastLoad = Date.now();
  loadDashboard();
});
