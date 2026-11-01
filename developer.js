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
const ACTIVITY_SAMPLE = 1000;
let cachedUsers = [];
let activityByUser = new Map();
const expandedAccounts = new Set();

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
    td.colSpan = 6;
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
      const actionCell = document.createElement("td");
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "dev-button dev-account-toggle";
      toggle.textContent = expandedAccounts.has(user.uid) ? "⌃ Details" : "⌄ Details";
      toggle.setAttribute("aria-expanded", expandedAccounts.has(user.uid) ? "true" : "false");
      toggle.addEventListener("click", () => {
        if (expandedAccounts.has(user.uid)) expandedAccounts.delete(user.uid);
        else expandedAccounts.add(user.uid);
        renderUsers();
      });
      actionCell.append(toggle);
      row.append(actionCell);
      table.append(row);

      if (expandedAccounts.has(user.uid)) {
        const detailRow = document.createElement("tr");
        detailRow.className = "dev-account-detail-row";
        const detailCell = document.createElement("td");
        detailCell.colSpan = 6;
        const panel = document.createElement("div");
        panel.className = "dev-account-detail";
        const email = document.createElement("strong");
        email.textContent = "Email: " + (user.email || "Not available");
        panel.append(email);
        const events = activityByUser.get(user.uid);
        const heading = document.createElement("p");
        heading.className = "dev-section-note";
        heading.textContent = "Sign-in / sign-out history";
        panel.append(heading);
        if (!events) {
          const loading = document.createElement("p");
          loading.textContent = "Loading account activity…";
          panel.append(loading);
        } else if (!events.length) {
          const empty = document.createElement("p");
          empty.textContent = "No recorded sign-in or sign-out events.";
          panel.append(empty);
        } else {
          const list = document.createElement("ul");
          list.className = "dev-account-event-list";
          for (const event of events) {
            const item = document.createElement("li");
            item.textContent = (event.type === "sign_in" ? "Sign-in" : "Sign-out")
              + " — " + formatDate(event.createdAt);
            list.append(item);
          }
          panel.append(list);
        }
        detailCell.append(panel);
        detailRow.append(detailCell);
        table.append(detailRow);
      }
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
    activityByUser = new Map();
    expandedAccounts.clear();
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
      getDocs(collection(db, "users", user.uid, "activity"))
    ));
    const accountStats = [];
    const failures = [];
    results.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        failures.push(`${sample[index].email || sample[index].uid}: ${result.reason?.code || result.reason?.message || result.reason}`);
        return;
      }
      let signIns = 0;
      let signOuts = 0;
      let latestTime = null;
      const userEvents = result.value.docs.map(item => ({ id: item.id, ...item.data() }))
        .filter(event => event.type === "sign_in" || event.type === "sign_out")
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      activityByUser.set(sample[index].uid, userEvents);
      for (const event of userEvents) {
        if (event.type === "sign_in") signIns += 1;
        if (event.type === "sign_out") signOuts += 1;
        if (event.createdAt?.toMillis && (!latestTime || event.createdAt.toMillis() > latestTime.toMillis())) {
          latestTime = event.createdAt;
        }
      }
      accountStats.push({
        email: sample[index].email || sample[index].uid,
        provider: sample[index].provider || "-",
        signIns,
        signOuts,
        latestTime
      });
    });
    if (failures.length) {
      console.warn("Activity unreadable for some accounts:", failures);
      showReadError(`Activity could not be read for ${failures.length} of ${sample.length} loaded accounts. First reason: ${failures[0]}`);
    }
    accountStats.sort((a, b) => (b.latestTime?.toMillis?.() || 0) - (a.latestTime?.toMillis?.() || 0));
    renderUsers();
    const totalEvents = accountStats.reduce((sum, account) => sum + account.signIns + account.signOuts, 0);
    if ($("totalEvents")) $("totalEvents").textContent = String(totalEvents);
    if ($("latestActivity")) $("latestActivity").textContent = (accountStats[0]?.latestTime?.toDate ? new Intl.DateTimeFormat("en-GB").format(accountStats[0].latestTime.toDate()) : "No events");
    const table = $("activityTable");
    if (!table) return;
    table.replaceChildren();
    if (!accountStats.length) {
      const row = document.createElement("tr");
      const td = cell("No activity records yet.");
      td.colSpan = 4;
      row.append(td);
      table.append(row);
    } else {
      for (const account of accountStats) {
        const row = document.createElement("tr");
        row.append(
          cell(account.email),
          cell(account.signIns),
          cell(account.signOuts),
          cell(account.provider)
        );
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

const toggleAllAccounts = $("toggleAllAccounts");
const accountsContent = $("accountsContent");
toggleAllAccounts?.addEventListener("click", () => {
  const isExpanded = toggleAllAccounts.getAttribute("aria-expanded") === "true";
  const nextExpanded = !isExpanded;
  toggleAllAccounts.setAttribute("aria-expanded", String(nextExpanded));
  accountsContent?.classList.toggle("dev-hidden", !nextExpanded);
  toggleAllAccounts.textContent = nextExpanded ? "⌃ Hide Accounts" : "⌄ Show Accounts";
});

const toggleLoginCounts = $("toggleLoginCounts");
const loginCountsContent = $("loginCountsContent");
toggleLoginCounts?.addEventListener("click", () => {
  const isExpanded = toggleLoginCounts.getAttribute("aria-expanded") === "true";
  const nextExpanded = !isExpanded;
  toggleLoginCounts.setAttribute("aria-expanded", String(nextExpanded));
  loginCountsContent?.classList.toggle("dev-hidden", !nextExpanded);
  toggleLoginCounts.textContent = nextExpanded
    ? "⌃ Hide Login & Logout Counts"
    : "⌄ Show Login & Logout Counts";
});

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
