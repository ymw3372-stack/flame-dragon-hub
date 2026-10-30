import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, query, orderBy, limit
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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);
const gate = $("devGate");
const content = $("devContent");
const status = $("devStatus");
const usersTable = $("usersTable");
const activityTable = $("activityTable");
const searchInput = $("userSearch");

const ADMIN_UID = "mPYAzTPWOkZTpzB0caXXXzNHDdg2";

let cachedUsers = [];

function showGate(message, title = "Administrator access required") {
  content?.classList.add("dev-hidden");
  if (gate) {
    gate.classList.remove("dev-hidden");
    const heading = gate.querySelector("h2");
    if (heading) heading.textContent = title;
    if (status) status.textContent = message;
  }
}

function showDashboard() {
  gate?.classList.add("dev-hidden");
  content?.classList.remove("dev-hidden");
}

function safeText(value) {
  return String(value ?? "—");
}

function formatDate(value) {
  if (!value?.toDate) return "—";
  return value.toDate().toLocaleString();
}

function cell(value) {
  const td = document.createElement("td");
  td.textContent = safeText(value);
  return td;
}

function renderUsers() {
  if (!usersTable) return;
  const term = (searchInput?.value || "").trim().toLowerCase();
  const filtered = cachedUsers.filter(user =>
    [user.email, user.displayName, user.uid].some(value =>
      String(value || "").toLowerCase().includes(term)
    )
  );

  usersTable.replaceChildren();
  if (!filtered.length) {
    const row = document.createElement("tr");
    const td = cell("No matching accounts.");
    td.colSpan = 4;
    row.append(td);
    usersTable.append(row);
  } else {
    for (const user of filtered) {
      const row = document.createElement("tr");
      row.append(
        cell(user.displayName || user.email || user.uid),
        cell(user.provider),
        cell(user.emailVerified ? "Verified" : "Not verified"),
        cell(formatDate(user.lastSignInAt))
      );
      usersTable.append(row);
    }
  }
  const count = $("userCount");
  if (count) count.textContent = `Showing ${filtered.length} of ${cachedUsers.length} stored account records.`;
}

async function loadDashboard() {
  if (!auth.currentUser) {
    showGate("Sign in with the account that has the administrator role.");
    return;
  }

  // Match the same owner UID and verified-email requirement enforced by Firestore rules.
  if (auth.currentUser.uid !== ADMIN_UID || auth.currentUser.emailVerified !== true) {
    showGate("This area is reserved for the site owner. You do not have permission to access it.");
    return;
  }

  showDashboard();
  if (usersTable) usersTable.innerHTML = '<tr><td colspan="4">Loading accounts…</td></tr>';
  if (activityTable) activityTable.innerHTML = '<tr><td colspan="4">Loading activity…</td></tr>';

  const usersQuery = query(collection(db, "users"), orderBy("lastSignInAt", "desc"), limit(100));
  const snapshot = await getDocs(usersQuery);
  cachedUsers = snapshot.docs.map(item => ({ uid: item.id, ...item.data() }));

  $("totalUsers").textContent = String(cachedUsers.length);
  $("emailUsers").textContent = String(cachedUsers.filter(user => user.provider === "password").length);
  $("googleUsers").textContent = String(cachedUsers.filter(user => user.provider === "google.com").length);
  $("verifiedUsers").textContent = String(cachedUsers.filter(user => user.emailVerified === true).length);
  renderUsers();

  const events = [];
  for (const user of cachedUsers.slice(0, 100)) {
    const activityQuery = query(
      collection(db, "users", user.uid, "activity"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const activitySnapshot = await getDocs(activityQuery);
    for (const item of activitySnapshot.docs) {
      events.push({ ...item.data(), email: user.email || user.uid });
    }
  }

  events.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  activityTable.replaceChildren();
  const latest = events.slice(0, 30);
  if (!latest.length) {
    const row = document.createElement("tr");
    const td = cell("No activity records yet.");
    td.colSpan = 4;
    row.append(td);
    activityTable.append(row);
  } else {
    for (const event of latest) {
      const row = document.createElement("tr");
      row.append(cell(event.email), cell(event.type), cell(event.provider), cell(formatDate(event.createdAt)));
      activityTable.append(row);
    }
  }
}

searchInput?.addEventListener("input", renderUsers);
$("refreshUsers")?.addEventListener("click", () => {
  loadDashboard().catch(error => showGate(`Could not load dashboard data: ${error.message}`, "Dashboard error"));
});

onAuthStateChanged(auth, user => {
  if (!user) {
    showGate("Please sign in first, then return to this page.");
    return;
  }
  loadDashboard().catch(error => {
    console.error("Developer dashboard error:", error);
    showGate("Could not load dashboard data. Check your administrator access and Firestore rules.", "Dashboard error");
  });
});
