import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, limit, doc, getDoc, setDoc, addDoc, Timestamp, serverTimestamp, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
const banByUser = new Map();
const loadedBanUsers = new Set();
const banLoadErrors = new Map();
const moderationBusy = new Set();
let moderationLogEntries = [];
const DISMISSED_MODERATION_KEY = "fdhDismissedModerationLogs";
function getDismissedModerationIds() {
  try {
    const value = JSON.parse(localStorage.getItem(DISMISSED_MODERATION_KEY) || "[]");
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}
function dismissModerationNotice(id) {
  const dismissed = getDismissedModerationIds();
  dismissed.add(String(id));
  try {
    localStorage.setItem(DISMISSED_MODERATION_KEY, JSON.stringify([...dismissed]));
  } catch (error) {
    console.warn("Could not save dismissed moderation notices:", error);
  }
}

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
    return "Firestore denied this read. Open Firebase Console, project flame-dragon-hub, "
      + "Firestore Database, Rules, and publish the latest firestore.rules file from this repository. "
      + "The account moderation controls will not work until those rules are published.";
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
function timestampMillis(value) {
  return value?.toMillis?.() || 0;
}
function createCopyButton(value, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dev-button dev-copy";
  button.textContent = "Copy " + label;
  button.addEventListener("click", async () => {
    const text = String(value || "");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      button.textContent = copied ? "Copied" : "Select manually";
    }
    setTimeout(() => { button.textContent = "Copy " + label; }, 1400);
  });
  return button;
}
function isBanActive(record) {
  if (!record?.active) return false;
  if (!record.expiresAt?.toMillis) return true;
  return record.expiresAt.toMillis() > Date.now();
}

async function loadBanStatus(uid) {
  // Do not automatically retry a denied read on every render. That caused a
  // render -> read -> error -> render loop and made Details appear impossible to close.
  if (loadedBanUsers.has(uid) || banLoadErrors.has(uid)) return;
  loadedBanUsers.add(uid);
  try {
    const snapshot = await getDoc(doc(db, "userBans", uid));
    banByUser.set(uid, snapshot.exists() ? snapshot.data() : null);
    banLoadErrors.delete(uid);
  } catch (error) {
    loadedBanUsers.delete(uid);
    banLoadErrors.set(uid, error);
    showReadError("Could not load moderation status. Publish the latest firestore.rules, then retry. " + (error?.message || error));
  }
  if (expandedAccounts.has(uid)) renderUsers();
}

function waitForModeration(promise, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + " timed out after 15 seconds. Check your connection and Firestore Rules.")), 15000);
    })
  ]).finally(() => clearTimeout(timer));
}

async function runModerationAction(uid, action, reason, duration) {
  if (!auth.currentUser || !isAdminUser(auth.currentUser) || uid === auth.currentUser.uid) {
    showReadError("This moderation action is not allowed.");
    return;
  }
  if (moderationBusy.has(uid)) return;
  moderationBusy.add(uid);
  renderUsers();
  try {
    const ref = doc(db, "userBans", uid);
    const base = { updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid };
    let localRecord;

    if (action === "kick") {
      await waitForModeration(setDoc(ref, {
        ...base, active: false, reason: "", expiresAt: null, kickAt: serverTimestamp()
      }, { merge: true }), "Kick");
      localRecord = { active: false, reason: "", expiresAt: null, kickAt: Timestamp.fromDate(new Date()) };
    } else if (action === "ban") {
      const durations = { "1d": 1, "7d": 7, "30d": 30 };
      const expiresAt = duration === "permanent"
        ? null
        : Timestamp.fromDate(new Date(Date.now() + (durations[duration] || 1) * 86400000));
      await waitForModeration(setDoc(ref, {
        ...base, active: true, reason: String(reason || "").slice(0, 300),
        expiresAt, kickAt: serverTimestamp()
      }, { merge: true }), "Ban");
      localRecord = { active: true, reason: String(reason || "").slice(0, 300), expiresAt };
    } else if (action === "unban") {
      await waitForModeration(setDoc(ref, {
        ...base, active: false, reason: "", expiresAt: null
      }, { merge: true }), "Unban");
      localRecord = { active: false, reason: "", expiresAt: null };
    } else {
      throw new Error("Unknown moderation action.");
    }

    // Update the UI from the confirmed write; do not make a second read that
    // can leave the interface stuck if that read is denied or the network drops.
    banByUser.set(uid, localRecord);
    loadedBanUsers.add(uid);
    banLoadErrors.delete(uid);
    let auditSaved = true;
    try {
      await addDoc(collection(db, "moderationLogs"), {
        action,
        targetUid: uid,
        targetEmail: cachedUsers.find(user => user.uid === uid)?.email || "",
        actorUid: auth.currentUser.uid,
        reason: String(reason || "").slice(0, 300),
        duration: String(duration || ""),
        createdAt: serverTimestamp()
      });
    } catch (logError) {
      auditSaved = false;
      console.warn("Moderation succeeded but its audit entry could not be saved:", logError);
    }
    clearReadError();
    if (!auditSaved) {
      showReadError("The account action succeeded, but its audit entry was not saved. Publish the latest firestore.rules to enable the Admin Activity log.");
    }
    renderBanManagement();
    loadModerationActivity();
  } catch (error) {
    console.error("Account moderation failed:", error);
    showReadError("Could not update this account. Publish the latest firestore.rules and check the connection. " + (error?.message || error));
  } finally {
    moderationBusy.delete(uid);
    if (expandedAccounts.has(uid)) renderUsers();
  }
}

function renderUsers() {
  const table = $("usersTable");
  if (!table) return;
  const term = ($("userSearch")?.value || "").trim().toLowerCase();
  const statusFilter = $("accountStatusFilter")?.value || "all";
  const sortOrder = $("accountSortOrder")?.value || "newest";
  const filtered = cachedUsers.filter(user => {
    const matchesTerm = [user.email, user.displayName, user.uid]
      .some(value => String(value || "").toLowerCase().includes(term));
    const banned = isBanActive(banByUser.get(user.uid));
    const matchesStatus = statusFilter === "all"
      || (statusFilter === "banned" && banned)
      || (statusFilter === "active" && !banned)
      || (statusFilter === "unverified" && user.emailVerified !== true);
    return matchesTerm && matchesStatus;
  }).sort((a, b) => {
    const difference = timestampMillis(a.createdAt) - timestampMillis(b.createdAt);
    return sortOrder === "oldest" ? difference : -difference;
  });
  table.replaceChildren();
  if (!filtered.length) {
    const row = document.createElement("tr");
    const td = cell("No matching accounts.");
    td.colSpan = 5;
    row.append(td);
    table.append(row);
  } else {
    for (const user of filtered) {
      const banned = isBanActive(banByUser.get(user.uid));
      const row = document.createElement("tr");
      row.className = banned ? "dev-account-banned" : "dev-account-active";
      const accountCell = cell(user.displayName || user.email || user.uid);
      if (banned) {
        const badge = document.createElement("span");
        badge.className = "dev-banned-badge";
        badge.textContent = "BANNED";
        accountCell.append(document.createTextNode(" "), badge);
      }
      row.append(
        accountCell,
        cell(user.provider),
        cell(user.emailVerified ? "Verified" : "Not verified"),
        cell(formatDate(user.createdAt))
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
        detailCell.colSpan = 5;
        const panel = document.createElement("div");
        panel.className = "dev-account-detail";
        const email = document.createElement("strong");
        email.textContent = "Email: " + (user.email || "Not available");
        panel.append(email);
        const identityActions = document.createElement("div");
        identityActions.className = "dev-inline-actions";
        identityActions.append(createCopyButton(user.uid, "UID"));
        if (user.email) identityActions.append(createCopyButton(user.email, "Email"));
        panel.append(identityActions);
        const events = activityByUser.get(user.uid);
        const counts = document.createElement("div");
        counts.className = "dev-account-count-grid";
        const signIns = events ? events.filter(event => event.type === "sign_in").length : "—";
        const signOuts = events ? events.filter(event => event.type === "sign_out").length : "—";
        for (const [label, value] of [["Sign-ins", signIns], ["Sign-outs", signOuts]]) {
          const card = document.createElement("div");
          card.className = "dev-account-count";
          const caption = document.createElement("span");
          caption.textContent = label;
          const number = document.createElement("strong");
          number.textContent = String(value);
          card.append(caption, number);
          counts.append(card);
        }
        panel.append(counts);
        const timelineHeading = document.createElement("p");
        timelineHeading.style.fontWeight = "700";
        timelineHeading.textContent = "Recent account activity";
        panel.append(timelineHeading);
        const timeline = document.createElement("ul");
        timeline.className = "dev-account-event-list";
        if (events?.length) {
          for (const event of events.slice(0, 8)) {
            const item = document.createElement("li");
            const eventName = event.type === "sign_in" ? "Signed in" : "Signed out";
            item.textContent = eventName + " · " + formatDate(event.createdAt);
            timeline.append(item);
          }
        } else {
          const item = document.createElement("li");
          item.textContent = "No recorded sign-in activity available.";
          timeline.append(item);
        }
        panel.append(timeline);
        const moderation = document.createElement("div");
        moderation.className = "dev-moderation";
        const moderationHeading = document.createElement("h3");
        moderationHeading.textContent = "Account access";
        moderation.append(moderationHeading);
        const statusLine = document.createElement("p");
        statusLine.className = "dev-moderation-status";
        moderation.append(statusLine);
        const controls = document.createElement("div");
        controls.className = "dev-moderation-controls";
        moderation.append(controls);

        if (auth.currentUser?.uid === user.uid) {
          statusLine.textContent = "Owner account protected — moderation actions are disabled.";
        } else {
          const banStatusLoaded = loadedBanUsers.has(user.uid);
          const banLoadError = banLoadErrors.get(user.uid);
          const banRecord = banByUser.get(user.uid) || null;
          const banned = isBanActive(banRecord);

          if (moderationBusy.has(user.uid)) {
            statusLine.textContent = "Changing account status…";
          } else if (banLoadError) {
            statusLine.textContent = "Status unavailable — check Firestore Rules or connection.";
            const retryButton = document.createElement("button");
            retryButton.type = "button";
            retryButton.className = "dev-button";
            retryButton.textContent = "Retry status check";
            retryButton.addEventListener("click", () => {
              banLoadErrors.delete(user.uid);
              loadBanStatus(user.uid);
            });
            controls.append(retryButton);
          } else if (!banStatusLoaded) {
            statusLine.textContent = "Checking account status…";
            loadBanStatus(user.uid);
          } else {
            statusLine.textContent = banned
              ? "BANNED" + (banRecord.expiresAt?.toDate ? " until " + formatDate(banRecord.expiresAt) : " permanently")
                + (banRecord.reason ? " · Reason: " + banRecord.reason : "")
              : "Account is active.";
          }
          if (banned) statusLine.classList.add("is-banned");

          const reasonInput = document.createElement("input");
          reasonInput.type = "text";
          reasonInput.maxLength = 300;
          reasonInput.placeholder = "Reason (optional)";
          reasonInput.value = banRecord?.reason || "";
          reasonInput.setAttribute("aria-label", "Moderation reason");

          const durationSelect = document.createElement("select");
          durationSelect.setAttribute("aria-label", "Ban duration");
          for (const [value, label] of [
            ["1d", "1 day"], ["7d", "7 days"], ["30d", "30 days"], ["permanent", "Permanent"]
          ]) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            durationSelect.append(option);
          }

          const kickButton = document.createElement("button");
          kickButton.type = "button";
          kickButton.className = "dev-button kick";
          kickButton.textContent = "↪ Kick (sign out)";
          kickButton.disabled = moderationBusy.has(user.uid);
          kickButton.addEventListener("click", async () => {
            if (!confirm("Sign this account out? They can sign in again unless you also ban them.")) return;
            await runModerationAction(user.uid, "kick", "", null);
          });

          const banButton = document.createElement("button");
          banButton.type = "button";
          banButton.className = "dev-button danger";
          banButton.textContent = banned ? "Update ban" : "Ban account";
          banButton.disabled = moderationBusy.has(user.uid);
          banButton.addEventListener("click", async () => {
            const duration = durationSelect.value;
            const labels = { "1d": "1 day", "7d": "7 days", "30d": "30 days", permanent: "permanently" };
            if (!confirm("Ban this account " + labels[duration] + "? The account will be signed out.")) return;
            await runModerationAction(user.uid, "ban", reasonInput.value.trim(), duration);
          });

          controls.append(reasonInput, durationSelect);
          if (!banned || !banStatusLoaded) controls.append(kickButton);
          controls.append(banButton);

          if (banned || !banStatusLoaded || banLoadError) {
            const unbanButton = document.createElement("button");
            unbanButton.type = "button";
            unbanButton.className = "dev-button unban";
            unbanButton.textContent = "Unban account";
            unbanButton.disabled = moderationBusy.has(user.uid);
            unbanButton.addEventListener("click", async () => {
              if (!confirm("Remove the ban for this account?")) return;
              await runModerationAction(user.uid, "unban", "", null);
            });
            controls.append(unbanButton);
          }
        }
        panel.append(moderation);

        detailCell.append(panel);
        detailRow.append(detailCell);
        table.append(detailRow);
      }
    }
  }
  if ($("userCount")) $("userCount").textContent = `Showing ${filtered.length} of ${cachedUsers.length} stored account records (up to ${MAX_USERS} accounts).`;
}


// Load the moderation collection once so account filters and the Ban Management
// center use the same verified data rather than issuing one read per row.
async function loadBanManagementData() {
  try {
    const snapshot = await getDocs(query(collection(db, "userBans"), limit(MAX_USERS)));
    banByUser.clear();
    loadedBanUsers.clear();
    for (const item of snapshot.docs) {
      banByUser.set(item.id, item.data());
      loadedBanUsers.add(item.id);
    }
    for (const user of cachedUsers) loadedBanUsers.add(user.uid);
    renderUsers();
    renderBanManagement();
  } catch (error) {
    console.warn("Ban records could not be loaded:", error);
    const list = $("banManagementList");
    if (list) list.textContent = "Ban records unavailable. Check Firestore Rules and your connection.";
  }
}

function renderBanManagement() {
  const list = $("banManagementList");
  if (!list) return;
  const records = [...banByUser.entries()].map(([uid, record]) => ({
    uid, record,
    user: cachedUsers.find(item => item.uid === uid)
  })).filter(item => item.record && (
    item.record.active === true || item.record.updatedAt || item.record.kickAt || item.record.reason
  ));
  const now = Date.now();
  const active = records.filter(item => isBanActive(item.record));
  const expired = records.filter(item => item.record.active === true
    && item.record.expiresAt?.toMillis && item.record.expiresAt.toMillis() <= now);
  if ($("activeBanCount")) $("activeBanCount").textContent = String(active.length);
  if ($("expiredBanCount")) $("expiredBanCount").textContent = String(expired.length);
  if ($("moderationLogCount")) $("moderationLogCount").textContent = String(moderationLogEntries.length);
  const filter = $("banManagementFilter")?.value || "active";
  const visible = records.filter(item => {
    if (filter === "active") return isBanActive(item.record);
    if (filter === "expired") return item.record.active === true
      && item.record.expiresAt?.toMillis && item.record.expiresAt.toMillis() <= now;
    return true;
  }).sort((a,b) => timestampMillis(b.record.updatedAt) - timestampMillis(a.record.updatedAt));
  list.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "dev-section-note";
    empty.textContent = filter === "active" ? "There are no active bans." :
      filter === "expired" ? "There are no expired bans." : "No moderation records found.";
    list.append(empty);
    return;
  }
  for (const item of visible) {
    const card = document.createElement("article");
    card.className = "dev-item";
    const top = document.createElement("div");
    top.className = "dev-item-top";
    const title = document.createElement("strong");
    title.textContent = item.user?.displayName || item.user?.email || item.uid;
    const activeNow = isBanActive(item.record);
    const status = document.createElement("span");
    status.className = activeNow ? "dev-banned-badge" : "dev-status";
    status.textContent = activeNow ? "ACTIVE BAN" :
      (item.record.active === true ? "EXPIRED" : "NOT ACTIVE");
    top.append(title, status);
    const detail = document.createElement("p");
    detail.textContent = [
      "UID: " + item.uid,
      item.user?.email ? "Email: " + item.user.email : "",
      item.record.reason ? "Reason: " + item.record.reason : "No reason supplied",
      item.record.expiresAt?.toDate ? "Expires: " + formatDate(item.record.expiresAt) :
        (item.record.active ? "Permanent ban" : "No active expiry")
    ].filter(Boolean).join(" · ");
    card.append(top, detail);
    if (activeNow && item.uid !== auth.currentUser?.uid) {
      const actions = document.createElement("div");
      actions.className = "dev-inline-actions";
      const unban = document.createElement("button");
      unban.type = "button";
      unban.className = "dev-button";
      unban.textContent = "Unban account";
      unban.addEventListener("click", async () => {
        if (!confirm("Remove the ban for this account?")) return;
        await runModerationAction(item.uid, "unban", "", null);
      });
      actions.append(unban);
      card.append(actions);
    }
    list.append(card);
  }
}

async function loadModerationActivity() {
  const list = $("moderationActivityList");
  if (!list) return;
  try {
    const snapshot = await getDocs(query(collection(db, "moderationLogs"), limit(200)));
    moderationLogEntries = snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      .sort((a,b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
    if ($("moderationLogCount")) $("moderationLogCount").textContent = String(moderationLogEntries.length);
    list.replaceChildren();
    if (!moderationLogEntries.length) {
      const empty = document.createElement("p");
      empty.className = "dev-section-note";
      empty.textContent = "No moderation actions have been recorded yet.";
      list.append(empty);
      return;
    }
    const labels = { ban: "Account banned", unban: "Ban removed", kick: "Account signed out" };
    const dismissedIds = getDismissedModerationIds();
    const visibleEntries = moderationLogEntries.filter(entry => !dismissedIds.has(String(entry.id)));
    if (!visibleEntries.length) {
      const empty = document.createElement("p");
      empty.className = "dev-section-note";
      empty.textContent = moderationLogEntries.length
        ? "All moderation notifications are hidden. The audit records are still saved."
        : "No moderation actions have been recorded yet.";
      list.append(empty);
      return;
    }
    for (const entry of visibleEntries.slice(0, 40)) {
      const row = document.createElement("div");
      row.className = "dev-log-item";
      const time = document.createElement("span");
      time.className = "dev-log-time";
      time.textContent = formatDate(entry.createdAt);
      const body = document.createElement("div");
      const heading = document.createElement("div");
      heading.className = "dev-log-title";
      heading.textContent = labels[entry.action] || "Moderation action";
      const meta = document.createElement("div");
      meta.className = "dev-log-meta";
      meta.textContent = [
        entry.targetEmail || entry.targetUid || "Unknown account",
        "Target UID: " + (entry.targetUid || "—"),
        "Admin UID: " + (entry.actorUid || "—"),
        entry.reason ? "Reason: " + entry.reason : ""
      ].filter(Boolean).join(" · ");
      body.append(heading, meta);
      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.className = "dev-button dev-copy";
      dismiss.textContent = "Dismiss";
      dismiss.setAttribute("aria-label", "Hide this moderation notification");
      dismiss.addEventListener("click", () => {
        dismissModerationNotice(entry.id);
        row.remove();
        if (!list.querySelector(".dev-log-item")) {
          const empty = document.createElement("p");
          empty.className = "dev-section-note";
          empty.textContent = "All moderation notifications are hidden. The audit records are still saved.";
          list.append(empty);
        }
      });
      row.append(time, body, dismiss);
      list.append(row);
    }
  } catch (error) {
    console.warn("Moderation activity could not be loaded:", error);
    list.textContent = "Admin Activity is unavailable. Publish the latest firestore.rules to enable this protected log.";
  }
}

function exportAccountsCsv() {
  if (!isAdminUser(auth.currentUser)) return;
  const rows = [["UID","Email","Display name","Provider","Email verified","Created","Ban status","Ban reason"]];
  for (const user of cachedUsers) {
    const ban = banByUser.get(user.uid) || null;
    rows.push([
      user.uid, user.email || "", user.displayName || "", user.provider || "",
      user.emailVerified === true ? "yes" : "no", formatDate(user.createdAt),
      isBanActive(ban) ? "banned" : "active", ban?.reason || ""
    ]);
  }
  const csv = rows.map(row => row.map(value =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"'
  ).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "flame-dragon-accounts-" + new Date().toISOString().slice(0,10) + ".csv";
  link.click();
  URL.revokeObjectURL(url);
}

// Read stored accounts without sorting or displaying their last sign-in timestamps.
async function readUsers() {
  const snapshot = await getDocs(query(collection(db, "users"), limit(MAX_USERS)));
  return snapshot.docs.map(item => ({ uid: item.id, ...item.data() }));
}

async function loadDashboard() {
  lastLoad = Date.now();
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
    await loadBanManagementData();
    await loadModerationActivity();
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
      const userEvents = result.value.docs.map(item => ({ id: item.id, ...item.data() }))
        .filter(event => event.type === "sign_in" || event.type === "sign_out")
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      activityByUser.set(sample[index].uid, userEvents);
      for (const event of userEvents) {
        if (event.type === "sign_in") signIns += 1;
        if (event.type === "sign_out") signOuts += 1;
      }
      accountStats.push({
        email: sample[index].email || sample[index].uid,
        provider: sample[index].provider || "-",
        signIns,
        signOuts
      });
    });
    if (failures.length) {
      console.warn("Activity unreadable for some accounts:", failures);
      showReadError(`Activity could not be read for ${failures.length} of ${sample.length} loaded accounts. First reason: ${failures[0]}`);
    }
    renderUsers();
    const totalEvents = accountStats.reduce((sum, account) => sum + account.signIns + account.signOuts, 0);
    if ($("totalEvents")) $("totalEvents").textContent = String(totalEvents);
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


async function loadExtensionAnalytics() {
  const clicksEl = $("extensionDownloadClicks");
  const downloadsEl = $("extensionGitHubDownloads");
  const installsEl = $("extensionInstalls");
  const usageEl = $("extensionUsageSessions");
  const latestEl = $("extensionLastClick");
  const table = $("extensionEventsTable");
  if (!clicksEl || !downloadsEl || !installsEl || !usageEl || !latestEl || !table) return;

  const results = await Promise.allSettled([
    getDocs(query(collection(db, "extensionAnalytics"), limit(2000))),
    fetch("https://api.github.com/repos/ymw3372-stack/flame-dragon-hub/releases/latest", {
      headers: { "Accept": "application/vnd.github+json" },
      cache: "no-store"
    }).then(response => {
      if (!response.ok) throw new Error("GitHub release stats unavailable");
      return response.json();
    })
  ]);

  let events = [];
  if (results[0].status === "fulfilled") {
    events = results[0].value.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(event => ["download_click", "install", "usage_session"].includes(event.type))
      .sort((a, b) => {
        const at = a.createdAt?.toMillis?.() || 0;
        const bt = b.createdAt?.toMillis?.() || 0;
        return bt - at;
      });
    const clicks = events.filter(event => event.type === "download_click");
    const installEvents = events.filter(event => event.type === "install").length;
    const usageEvents = events.filter(event => event.type === "usage_session").length;
    installsEl.textContent = installEvents ? String(installEvents) : "Not tracked";
    usageEl.textContent = usageEvents ? String(usageEvents) : "Not tracked";
    clicksEl.textContent = String(clicks.length);
    latestEl.textContent = clicks[0]?.createdAt?.toDate
      ? clicks[0].createdAt.toDate().toLocaleString()
      : "No clicks yet";
  } else {
    clicksEl.textContent = "Unavailable";
    installsEl.textContent = "Unavailable";
    usageEl.textContent = "Unavailable";
    latestEl.textContent = "—";
    console.warn("Extension analytics could not be loaded:", results[0].reason);
  }

  if (results[1].status === "fulfilled") {
    const latestRelease = results[1].value;
    const expectedAssetName = `FLAME_DRAGON_HUB_${latestRelease.tag_name}.zip`;
    const asset = (latestRelease.assets || [])
      .find(item => item.name === expectedAssetName);
    downloadsEl.textContent = asset ? String(asset.download_count ?? 0) : "Unavailable";
  } else {
    downloadsEl.textContent = "Unavailable";
    console.warn("GitHub download count could not be loaded:", results[1].reason);
  }

  table.replaceChildren();
  if (results[0].status !== "fulfilled" || !events.length) {
    const row = document.createElement("tr");
    const td = cell(results[0].status === "fulfilled"
      ? "No extension events recorded yet."
      : "Extension events could not be loaded.");
    td.colSpan = 3;
    row.append(td);
    table.append(row);
    return;
  }

  const labels = {
    download_click: "Download button click",
    install: "Extension installation",
    usage_session: "EvoWorld usage session"
  };
  for (const event of events.slice(0, 50)) {
    const row = document.createElement("tr");
    row.append(
      cell(labels[event.type] || event.type),
      cell(event.source || "—"),
      cell(event.createdAt?.toDate ? event.createdAt.toDate().toLocaleString() : "-")
    );
    table.append(row);
  }
}

async function loadContactInbox() {
  const list = $("contactInboxList");
  if (!list || !isAdminUser(auth.currentUser)) return;
  list.textContent = "Loading messages…";
  try {
    const snapshot = await getDocs(query(collection(db,"contactMessages"),orderBy("createdAt","desc"),limit(100)));
    const selected = $("contactStatusFilter")?.value || "all";
    const messages = snapshot.docs.map(item => ({id:item.id,...item.data()}))
      .filter(item => selected === "all" || item.status === selected);
    list.replaceChildren();
    if (!messages.length) {
      const empty = document.createElement("p");
      empty.className = "dev-section-note";
      empty.textContent = "No messages found for this filter.";
      list.append(empty);
      return;
    }
    for (const item of messages) {
      const card = document.createElement("article");
      card.className = "dev-item";
      const top = document.createElement("div");
      top.className = "dev-item-top";
      const heading = document.createElement("strong");
      heading.textContent = item.topic + " · " + item.reference;
      const status = document.createElement("span");
      status.className = "dev-status";
      status.textContent = item.status || "New";
      top.append(heading,status);
      const details = document.createElement("p");
      details.textContent = [
        "From: " + (item.name || "—"),
        "Email: " + (item.email || "Not provided"),
        "Received: " + formatDate(item.createdAt),
        "",
        item.message || ""
      ].join("\\n");
      card.append(top,details);
      if (item.attachmentData) {
        const image = document.createElement("a");
        image.href = item.attachmentData;
        image.target = "_blank";
        image.rel = "noopener noreferrer";
        image.textContent = "View attachment: " + (item.attachmentName || "image");
        image.className = "dev-button";
        image.style.display = "inline-block";
        image.style.textDecoration = "none";
        card.append(image);
      }
      const controls = document.createElement("div");
      controls.className = "dev-inline-actions";
      const select = document.createElement("select");
      select.setAttribute("aria-label","Message status");
      for (const value of ["New","In Progress","Resolved"]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.append(option);
      }
      select.value = item.status || "New";
      const save = document.createElement("button");
      save.type = "button";
      save.className = "dev-button";
      save.textContent = "Save status";
      save.addEventListener("click",async () => {
        save.disabled = true;
        try {
          await updateDoc(doc(db,"contactMessages",item.id),{
            status:select.value,updatedAt:serverTimestamp()
          });
          status.textContent = select.value;
          save.textContent = "Saved";
        } catch (error) {
          console.error("Contact status update failed:",error);
          save.textContent = "Retry";
        } finally {
          save.disabled = false;
        }
      });
      controls.append(select,save);
      card.append(controls);
      list.append(card);
    }
  } catch (error) {
    console.error("Contact inbox could not be loaded:",error);
    list.textContent = "Inbox unavailable. Check Firestore Rules and the connection.";
  }
}

async function loadUniqueProgramVisitors() {
  const countEl = $("uniqueProgramVisitors");
  if (!countEl) return;
  countEl.textContent = "Loading…";
  try {
    const snapshot = await getDocs(collection(db, "programVisitors"));
    countEl.textContent = snapshot.size.toLocaleString();
  } catch (error) {
    countEl.textContent = "Unavailable";
    console.warn("Unique program visitors could not be loaded:", error);
  }
}

const toggleBanManagement = $("toggleBanManagement");
const banManagementContent = $("banManagementContent");
toggleBanManagement?.addEventListener("click", () => {
  const next = toggleBanManagement.getAttribute("aria-expanded") !== "true";
  toggleBanManagement.setAttribute("aria-expanded", String(next));
  banManagementContent?.classList.toggle("dev-hidden", !next);
  toggleBanManagement.textContent = next ? "⌃ Hide Ban Management" : "⌄ Show Ban Management";
});

const toggleAdminSecurity = $("toggleAdminSecurity");
const adminSecurityContent = $("adminSecurityContent");
toggleAdminSecurity?.addEventListener("click", () => {
  const next = toggleAdminSecurity.getAttribute("aria-expanded") !== "true";
  toggleAdminSecurity.setAttribute("aria-expanded", String(next));
  adminSecurityContent?.classList.toggle("dev-hidden", !next);
  toggleAdminSecurity.textContent = next ? "⌃ Hide Admin Security" : "⌄ Show Admin Security";
});

$("dismissSecurityNotice")?.addEventListener("click", () => $("securityStatus")?.remove());
$("dismissAllModerationNotices")?.addEventListener("click", () => {
  const ids = moderationLogEntries.map(entry => String(entry.id));
  try {
    localStorage.setItem(DISMISSED_MODERATION_KEY, JSON.stringify([...getDismissedModerationIds(), ...ids]));
  } catch (error) {
    console.warn("Could not save dismissed moderation notices:", error);
  }
  const list = $("moderationActivityList");
  if (list) {
    const empty = document.createElement("p");
    empty.className = "dev-section-note";
    empty.textContent = "All moderation notifications are hidden. The audit records are still saved.";
    list.replaceChildren(empty);
  }
});

const toggleAllAccounts = $("toggleAllAccounts");
const accountsContent = $("accountsContent");
toggleAllAccounts?.addEventListener("click", () => {
  const isExpanded = toggleAllAccounts.getAttribute("aria-expanded") === "true";
  const nextExpanded = !isExpanded;
  toggleAllAccounts.setAttribute("aria-expanded", String(nextExpanded));
  accountsContent?.classList.toggle("dev-hidden", !nextExpanded);
  toggleAllAccounts.textContent = nextExpanded ? "⌃ Hide Accounts" : "⌄ Show Accounts";
});

const toggleUniqueVisitors = $("toggleUniqueVisitors");
const uniqueVisitorsContent = $("uniqueVisitorsContent");
toggleUniqueVisitors?.addEventListener("click", () => {
  const isExpanded = toggleUniqueVisitors.getAttribute("aria-expanded") === "true";
  const nextExpanded = !isExpanded;
  toggleUniqueVisitors.setAttribute("aria-expanded", String(nextExpanded));
  uniqueVisitorsContent?.classList.toggle("dev-hidden", !nextExpanded);
  toggleUniqueVisitors.textContent = nextExpanded
    ? "⌃ Hide Unique Program Visitors"
    : "⌄ Show Unique Program Visitors";
  if (nextExpanded) loadUniqueProgramVisitors();
});

const toggleContactInbox = $("toggleContactInbox");
const contactInboxContent = $("contactInboxContent");
toggleContactInbox?.addEventListener("click", () => {
  const open = toggleContactInbox.getAttribute("aria-expanded") === "true";
  const next = !open;
  toggleContactInbox.setAttribute("aria-expanded",String(next));
  contactInboxContent?.classList.toggle("dev-hidden",!next);
  toggleContactInbox.textContent = next ? "⌃ Hide Contact Inbox" : "⌄ Show Contact Inbox";
  if (next) loadContactInbox();
});
$("refreshContactInbox")?.addEventListener("click",loadContactInbox);
$("contactStatusFilter")?.addEventListener("change",loadContactInbox);

const toggleExtensionAnalytics = $("toggleExtensionAnalytics");
const extensionAnalyticsContent = $("extensionAnalyticsContent");
toggleExtensionAnalytics?.addEventListener("click", () => {
  const isExpanded = toggleExtensionAnalytics.getAttribute("aria-expanded") === "true";
  const nextExpanded = !isExpanded;
  toggleExtensionAnalytics.setAttribute("aria-expanded", String(nextExpanded));
  extensionAnalyticsContent?.classList.toggle("dev-hidden", !nextExpanded);
  toggleExtensionAnalytics.textContent = nextExpanded
    ? "⌃ Hide Extension Analytics"
    : "⌄ Show Extension Analytics";
  if (nextExpanded) loadExtensionAnalytics();
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
$("accountStatusFilter")?.addEventListener("change", renderUsers);
$("accountSortOrder")?.addEventListener("change", renderUsers);
$("banManagementFilter")?.addEventListener("change", renderBanManagement);
$("refreshBanManagement")?.addEventListener("click", async () => {
  await loadBanManagementData();
  await loadModerationActivity();
});
$("exportAccounts")?.addEventListener("click", exportAccountsCsv);
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
