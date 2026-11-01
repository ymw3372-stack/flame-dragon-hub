import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
const ADMIN_EMAILS = ["ymw3372@gmail.com"];
const MAX_USERS = 10000;
let users = [];

function isAdmin(user) {
  return Boolean(user && user.emailVerified === true &&
    ADMIN_EMAILS.includes((user.email || "").trim().toLowerCase()));
}
function gate(message, title = "Administrator access required") {
  $("devContent")?.classList.add("dev-hidden");
  $("devGate")?.classList.remove("dev-hidden");
  if ($("devGate")?.querySelector("h2")) $("devGate").querySelector("h2").textContent = title;
  if ($("devStatus")) $("devStatus").textContent = message;
}
function showError(message) {
  let box = $("devReadError");
  if (!box) {
    box = document.createElement("div");
    box.id = "devReadError";
    box.className = "dev-message";
    $("devContent")?.prepend(box);
  }
  if (box) box.textContent = message;
}
function td(value) {
  const cell = document.createElement("td");
  cell.textContent = String(value ?? "—");
  return cell;
}
function date(value) {
  if (!value) return "—";
  const d = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
function render() {
  const body = $("usersTable");
  if (!body) return;
  const search = ($("userSearch")?.value || "").trim().toLowerCase();
  const shown = users.filter(u =>
    [u.email, u.displayName, u.uid].some(v => String(v || "").toLowerCase().includes(search))
  );
  body.replaceChildren();
  if (!shown.length) {
    const row = document.createElement("tr");
    const empty = td("No matching accounts.");
    empty.colSpan = 5;
    row.append(empty);
    body.append(row);
  } else {
    for (const user of shown) {
      const row = document.createElement("tr");
      row.append(
        td(user.email || user.displayName || user.uid),
        td(date(user.createdAt)),
        td(user.provider === "google.com" ? "Google" : user.provider === "password" ? "Email & password" : user.provider),
        td(user.emailVerified ? "Verified" : "Not verified"),
        td(date(user.lastSignInAt))
      );
      body.append(row);
    }
  }
  if ($("userCount")) $("userCount").textContent =
    `Showing ${shown.length} of ${users.length} registered accounts (maximum ${MAX_USERS}).`;
  if ($("totalUsers")) $("totalUsers").textContent = String(users.length);
}
async function load() {
  const user = auth.currentUser;
  if (!user) return gate("Please sign in first, then return to this page.");
  if (!isAdmin(user)) return gate("This area is reserved for the verified site owner.");
  $("devGate")?.classList.add("dev-hidden");
  $("devContent")?.classList.remove("dev-hidden");
  $("usersTable").innerHTML = '<tr><td colspan="5">Loading accounts...</td></tr>';
  $("devReadError")?.remove();
  try {
    const snapshot = await getDocs(query(collection(db, "users"), limit(MAX_USERS)));
    users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    render();
  } catch (error) {
    console.error("Could not load developer account list:", error);
    showError(error?.code === "permission-denied"
      ? "Firestore denied this read. Check that the deployed Firestore Rules allow the verified owner email to read users."
      : "Could not load accounts: " + (error?.message || error));
    $("usersTable").innerHTML = '<tr><td colspan="5">Accounts could not be loaded.</td></tr>';
  }
}
$("userSearch")?.addEventListener("input", render);
$("refreshUsers")?.addEventListener("click", load);
onAuthStateChanged(auth, () => load());
