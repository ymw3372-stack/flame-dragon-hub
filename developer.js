import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, query, orderBy, limit,
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp
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
const ADMIN_UID = "mPYAzTPWOkZTpzB0caXXXzNHDdg2";
let cachedUsers = [];
let cachedAnnouncements = [];

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
function safeText(value) { return String(value ?? "—"); }
function formatDate(value) {
  if (!value?.toDate) return "—";
  return value.toDate().toLocaleString();
}
function cell(value) {
  const td = document.createElement("td");
  td.textContent = safeText(value);
  return td;
}
function setStatus(id, message, isError = false) {
  const node = $(id);
  if (!node) return;
  node.textContent = message;
  node.style.color = isError ? "#ff9da7" : "#b8aab8";
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
  if ($("userCount")) $("userCount").textContent = `Showing ${filtered.length} of ${cachedUsers.length} stored account records (up to 100 most recently active).`;
}
function renderAnnouncements() {
  const list = $("announcementList");
  if (!list) return;
  list.replaceChildren();
  const published = cachedAnnouncements.filter(item => item.published).length;
  $("publishedCount").textContent = String(published);
  if (!cachedAnnouncements.length) {
    const empty = document.createElement("p");
    empty.className = "dev-section-note";
    empty.textContent = "No announcements yet.";
    list.append(empty);
    return;
  }
  for (const item of cachedAnnouncements) {
    const card = document.createElement("article");
    card.className = "dev-item";
    const top = document.createElement("div");
    top.className = "dev-item-top";
    const title = document.createElement("strong");
    title.textContent = item.title || "Untitled announcement";
    const state = document.createElement("span");
    state.className = "dev-status";
    state.textContent = item.published ? "PUBLISHED" : "HIDDEN";
    top.append(title, state);
    const body = document.createElement("p");
    body.textContent = item.body || "";
    const actions = document.createElement("div");
    actions.className = "dev-form-actions";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "dev-button";
    toggle.textContent = item.published ? "Hide announcement" : "Publish";
    toggle.addEventListener("click", async () => {
      toggle.disabled = true;
      try {
        await updateDoc(doc(db, "announcements", item.id), {
          published: !item.published,
          updatedAt: serverTimestamp()
        });
        await loadAnnouncements();
        setStatus("announcementStatus", "Announcement status updated.");
      } catch (error) {
        toggle.disabled = false;
        setStatus("announcementStatus", `Could not update: ${error.message}`, true);
      }
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "dev-button danger";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!confirm("Delete this announcement permanently?")) return;
      remove.disabled = true;
      try {
        await deleteDoc(doc(db, "announcements", item.id));
        await loadAnnouncements();
        setStatus("announcementStatus", "Announcement deleted.");
      } catch (error) {
        remove.disabled = false;
        setStatus("announcementStatus", `Could not delete: ${error.message}`, true);
      }
    });
    actions.append(toggle, remove);
    card.append(top, body, actions);
    list.append(card);
  }
}
async function loadAnnouncements() {
  try {
    const snap = await getDocs(query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(30)));
    cachedAnnouncements = snap.docs.map(item => ({ id: item.id, ...item.data() }));
    renderAnnouncements();
    setStatus("announcementStatus", "Announcement list is up to date.");
  } catch (error) {
    $("announcementList").textContent = "Announcements are not available yet. Publish the updated Firestore rules, then refresh this page.";
    setStatus("announcementStatus", `Firestore access: ${error.message}`, true);
  }
}
async function loadRelease() {
  try {
    const snap = await getDoc(doc(db, "siteConfig", "public"));
    const config = snap.exists() ? snap.data() : null;
    if (config) {
      $("siteVersion").value = config.version || "";
      $("releaseNotes").value = config.releaseNotes || "";
      $("currentVersion").textContent = config.version || "Not set";
    } else {
      $("currentVersion").textContent = "Not set";
    }
  } catch (error) {
    $("currentVersion").textContent = "Rules needed";
    setStatus("versionStatus", `Firestore access: ${error.message}. Publish the updated rules, then refresh.`, true);
  }
}
async function loadDashboard() {
  const user = auth.currentUser;
  if (!user) return showGate("Please sign in first, then return to this page.");
  if (user.uid !== ADMIN_UID || user.emailVerified !== true) {
    return showGate("This area is reserved for the verified site owner. You do not have permission to access it.");
  }
  showDashboard();
  $("usersTable").innerHTML = '<tr><td colspan="5">Loading accounts…</td></tr>';
  $("activityTable").innerHTML = '<tr><td colspan="4">Loading activity…</td></tr>';
  const usersQuery = query(collection(db, "users"), orderBy("lastSignInAt", "desc"), limit(100));
  const snapshot = await getDocs(usersQuery);
  cachedUsers = snapshot.docs.map(item => ({ uid: item.id, ...item.data() }));
  $("totalUsers").textContent = String(cachedUsers.length);
  $("emailUsers").textContent = String(cachedUsers.filter(user => user.provider === "password").length);
  $("googleUsers").textContent = String(cachedUsers.filter(user => user.provider === "google.com").length);
  $("verifiedUsers").textContent = String(cachedUsers.filter(user => user.emailVerified === true).length);
  renderUsers();

  const activitySnapshots = await Promise.all(cachedUsers.slice(0, 100).map(user =>
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
  await Promise.all([loadAnnouncements(), loadRelease()]);
}
$("userSearch")?.addEventListener("input", renderUsers);
$("refreshUsers")?.addEventListener("click", () => loadDashboard().catch(error => showGate(`Could not load dashboard data: ${error.message}`, "Dashboard error")));
$("refreshAnnouncements")?.addEventListener("click", loadAnnouncements);
$("announcementForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const title = $("announcementTitle").value.trim();
  const body = $("announcementBody").value.trim();
  if (!title || !body) return;
  const button = $("announcementForm").querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await addDoc(collection(db, "announcements"), {
      title, body, published: $("announcementPublished").checked,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: auth.currentUser.uid
    });
    $("announcementForm").reset();
    $("announcementPublished").checked = true;
    await loadAnnouncements();
    setStatus("announcementStatus", "Announcement saved successfully.");
  } catch (error) {
    setStatus("announcementStatus", `Could not save announcement: ${error.message}. Check that the new Firestore rules are published.`, true);
  } finally { button.disabled = false; }
});
$("versionForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const version = $("siteVersion").value.trim();
  const releaseNotes = $("releaseNotes").value.trim();
  if (!version) return;
  const button = $("versionForm").querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await setDoc(doc(db, "siteConfig", "public"), {
      version, releaseNotes, updatedAt: serverTimestamp()
    }, { merge: true });
    $("currentVersion").textContent = version;
    setStatus("versionStatus", "Release information saved and ready to display on Home.");
  } catch (error) {
    setStatus("versionStatus", `Could not save release information: ${error.message}. Publish the new Firestore rules first.`, true);
  } finally { button.disabled = false; }
});
onAuthStateChanged(auth, user => {
  if (!user) return showGate("Please sign in first, then return to this page.");
  loadDashboard().catch(error => {
    console.error("Developer dashboard error:", error);
    showGate("Could not load account data. Check administrator access and the existing users Firestore rules.", "Dashboard error");
  });
});
