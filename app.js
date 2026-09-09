import { brand } from "./brand-config.js";
import { categories } from "./categories-config.js";

// ===== Register service worker =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

// ===== State =====
const state = {
  route: "home",
  selectedCategory: null,
  selectedNoteItem: null,
  panelSubroute: null,
  editingClientCode: null,
  billSelections: {},
};

const app = document.getElementById("app");
const toastEl = document.getElementById("toast");

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2600);
}

// ===== PIN lock =====
function isUnlocked() { return sessionStorage.getItem("glambook_unlocked") === "1"; }
function unlock() { sessionStorage.setItem("glambook_unlocked", "1"); }
function lockApp() {
  sessionStorage.removeItem("glambook_unlocked");
  location.hash = "#/home";
  render();
}

function renderPinLock() {
  const tpl = document.getElementById("tpl-pin");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));
  document.querySelector(".topbar").style.visibility = "hidden";

  const input = document.getElementById("pinInput");
  const tryUnlock = () => {
    if (input.value === brand.appPin) {
      unlock();
      document.querySelector(".topbar").style.visibility = "visible";
      applyBrand();
      render();
    } else {
      document.getElementById("pinError").textContent = "Wrong PIN";
    }
  };
  document.getElementById("pinConfirmBtn").addEventListener("click", tryUnlock);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
}

// ===== Apply branding =====
function applyBrand() {
  document.title = brand.appName;

  const brandEl = document.getElementById("brandName");
  const accent = brand.appNameAccent;
  const base = brand.appName.endsWith(accent) ? brand.appName.slice(0, -accent.length) : brand.appName;
  brandEl.innerHTML = `${escapeHtml(base)}<span>${escapeHtml(accent)}</span>`;

  const root = document.documentElement.style;
  const c = brand.colors;
  root.setProperty("--plum", c.primary);
  root.setProperty("--plum-light", c.primaryLight);
  root.setProperty("--ivory", c.background);
  root.setProperty("--rose", c.accent);
  root.setProperty("--rose-dark", c.accentDark);
  root.setProperty("--gold", c.highlight);
  root.setProperty("--ink", c.ink);
  root.setProperty("--muted", c.muted);
  root.setProperty("--border", c.border);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", c.primary);

  const logoEl = document.getElementById("brandLogo");
  if (brand.logoUrl) {
    logoEl.src = brand.logoUrl;
    logoEl.alt = brand.appName;
  }
  document.getElementById("brandPhone").textContent = brand.contactPhone || "";
}

// ===== Router =====
function setRoute(route) {
  state.route = route;
  render();
}

window.addEventListener("hashchange", () => {
  const hash = location.hash.replace("#/", "") || "home";
  if (hash.startsWith("category/")) {
    const catId = hash.split("/")[1];
    state.selectedCategory = categories.find(c => c.id === catId) || null;
    setRoute("category");
  } else if (hash.startsWith("panel/")) {
    state.panelSubroute = hash.split("/")[1];
    setRoute("panel");
  } else if (hash === "panel") {
    state.panelSubroute = null;
    setRoute("panel");
  } else {
    setRoute(hash);
  }
});

document.body.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-route]");
  if (btn) location.hash = "#/" + btn.dataset.route;
});

document.getElementById("lockBtn").addEventListener("click", lockApp);

// ===== Floating bill bar =====
function updateBillBar() {
  const bar = document.getElementById("billBar");
  const items = Object.values(state.billSelections);
  const onBillScreen = state.route === "panel" && state.panelSubroute === "bill";
  if (items.length === 0 || onBillScreen) { bar.style.display = "none"; return; }
  const total = items.reduce((sum, i) => sum + (i.price || 0), 0);
  document.getElementById("billBarText").textContent = `${items.length} service${items.length > 1 ? "s" : ""} · ₹${total}`;
  bar.style.display = "flex";
}

// ===== Render =====
function render() {
  if (!isUnlocked()) { renderPinLock(); return; }

  if (state.route === "home") renderHome();
  else if (state.route === "category") renderCategory();
  else if (state.route === "note") renderNote();
  else if (state.route === "panel") renderPanel();
  updateBillBar();
}

// ---- Home: category grid ----
function renderHome() {
  const tpl = document.getElementById("tpl-home");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  document.getElementById("heroTagline").textContent = brand.tagline;
  document.getElementById("heroSubTagline").textContent = brand.subTagline;

  renderBackupReminder();

  const grid = document.getElementById("categoryGrid");
  grid.innerHTML = categories.map(cat => `
    <div class="category-tile" data-cat="${cat.id}">
      <span class="category-icon">${cat.icon}</span>
      <span class="category-tile-name">${escapeHtml(cat.name)}</span>
    </div>
  `).join("") + `
    <div class="category-tile" data-academy="1">
      <span class="category-icon">${icons.academy}</span>
      <span class="category-tile-name">Academy</span>
    </div>
  `;

  grid.querySelectorAll(".category-tile[data-cat]").forEach(tile => {
    tile.addEventListener("click", () => { location.hash = "#/category/" + tile.dataset.cat; });
  });
  grid.querySelector("[data-academy]").addEventListener("click", () => { location.hash = "#/panel/academy"; });
}

// ---- Backup reminder ----
function getLastBackupAt() {
  const v = localStorage.getItem("glambook_last_backup");
  return v ? Number(v) : null;
}
function setLastBackupAt(ts) { localStorage.setItem("glambook_last_backup", String(ts)); }

function renderBackupReminder() {
  const el = document.getElementById("backupReminder");
  const dismissed = sessionStorage.getItem("glambook_reminder_dismissed") === "1";
  if (dismissed) { el.style.display = "none"; return; }

  const days = brand.backupReminderDays ?? 3;
  const last = getLastBackupAt();
  let due = false, text = "";

  if (!last) {
    due = true;
    text = "You haven't backed up yet";
  } else {
    const elapsed = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
    if (elapsed >= days) {
      due = true;
      text = elapsed === 0 ? "Back up recommended" : `Last backup ${elapsed} day${elapsed === 1 ? "" : "s"} ago`;
    }
  }

  if (!due) { el.style.display = "none"; return; }
  document.getElementById("lastBackupText").textContent = text;
  el.style.display = "flex";

  document.getElementById("dismissReminderBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    sessionStorage.setItem("glambook_reminder_dismissed", "1");
    el.style.display = "none";
  });
}

// ---- Category: grouped itemized menu ----
function getStoredPrice(itemId) {
  const raw = localStorage.getItem("glambook_prices");
  const prices = raw ? JSON.parse(raw) : {};
  return Object.prototype.hasOwnProperty.call(prices, itemId) ? prices[itemId] : null;
}
function setStoredPrice(itemId, price) {
  const raw = localStorage.getItem("glambook_prices");
  const prices = raw ? JSON.parse(raw) : {};
  if (price === null) delete prices[itemId];
  else prices[itemId] = price;
  localStorage.setItem("glambook_prices", JSON.stringify(prices));
}
function effectivePrice(item) {
  const stored = getStoredPrice(item.id);
  return stored !== null ? stored : item.price;
}

function getStoredHomeFlag(itemId) {
  const raw = localStorage.getItem("glambook_home_flags");
  const flags = raw ? JSON.parse(raw) : {};
  return Object.prototype.hasOwnProperty.call(flags, itemId) ? flags[itemId] : null;
}
function setStoredHomeFlag(itemId, val) {
  const raw = localStorage.getItem("glambook_home_flags");
  const flags = raw ? JSON.parse(raw) : {};
  flags[itemId] = val;
  localStorage.setItem("glambook_home_flags", JSON.stringify(flags));
}
function effectiveHomeFlag(item) {
  const stored = getStoredHomeFlag(item.id);
  if (stored !== null) return stored;
  return item.mode !== "salon";
}

function renderCategory() {
  const cat = state.selectedCategory;
  if (!cat) { location.hash = "#/home"; return; }

  const tpl = document.getElementById("tpl-category");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  document.getElementById("categoryIconLg").innerHTML = cat.icon;
  document.getElementById("categoryName").textContent = cat.name;

  const wrap = document.getElementById("menuGroups");
  wrap.innerHTML = cat.groups.map(group => `
    <div class="menu-group">
      ${group.name && group.name !== cat.name ? `<h3 class="menu-group-title">${escapeHtml(group.name)}</h3>` : ""}
      ${group.items.map(item => `
        <div class="menu-item" data-item="${item.id}">
          <label class="menu-item-check">
            <input type="checkbox" class="service-check" data-id="${item.id}" ${state.billSelections[item.id] ? "checked" : ""}>
          </label>
          <span class="menu-item-name service-link" data-noteid="${item.id}">${escapeHtml(item.name)}</span>
          <label class="flag-field" title="Available for Home service">
            <span class="flag-label">H</span>
            <input type="checkbox" class="home-check" data-id="${item.id}" ${effectiveHomeFlag(item) ? "checked" : ""}>
          </label>
          <span class="price-field">
            <span class="rupee">₹</span>
            <input class="price-input" type="number" min="0" inputmode="numeric"
              data-price-for="${item.id}"
              placeholder="Set price"
              value="${effectivePrice(item) ?? ""}">
          </span>
        </div>
      `).join("")}
    </div>
  `).join("");

  wrap.querySelectorAll(".price-input").forEach(input => {
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("change", () => {
      const val = input.value === "" ? null : Number(input.value);
      setStoredPrice(input.dataset.priceFor, val);
      if (state.billSelections[input.dataset.priceFor]) {
        state.billSelections[input.dataset.priceFor].price = val;
        updateBillBar();
      }
    });
  });

  wrap.querySelectorAll(".home-check").forEach(cb => {
    cb.addEventListener("click", (e) => e.stopPropagation());
    cb.addEventListener("change", () => {
      setStoredHomeFlag(cb.dataset.id, cb.checked);
    });
  });

  wrap.querySelectorAll(".service-check").forEach(cb => {
    cb.addEventListener("click", (e) => e.stopPropagation());
    cb.addEventListener("change", () => {
      const id = cb.dataset.id;
      const group = cat.groups.find(g => g.items.some(i => i.id === id));
      const item = group.items.find(i => i.id === id);
      if (cb.checked) {
        state.billSelections[id] = { name: item.name, price: effectivePrice(item), categoryName: cat.name };
      } else {
        delete state.billSelections[id];
      }
      updateBillBar();
    });
  });

  wrap.querySelectorAll(".service-link").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.noteid;
      state.selectedNoteItem = { id, name: el.textContent, categoryName: cat.name, categoryId: cat.id };
      location.hash = "#/note";
    });
  });

}

// ---- Service write-up / notes ----
function getNotes() { return JSON.parse(localStorage.getItem("glambook_notes") || "{}"); }
function getNote(id) { return getNotes()[id] || ""; }
function saveNote(id, text) {
  const notes = getNotes();
  if (text) notes[id] = text; else delete notes[id];
  localStorage.setItem("glambook_notes", JSON.stringify(notes));
}

function renderNote() {
  const item = state.selectedNoteItem;
  if (!item) { location.hash = "#/home"; return; }

  app.innerHTML = `
    <section class="note-view">
      <h2>${escapeHtml(item.name)}</h2>
      <p class="muted">${escapeHtml(item.categoryName || "")}</p>
      <div class="field-group">
        <label>Write-up</label>
        <textarea id="noteText" rows="6" placeholder="Write anything about this service...">${escapeHtml(getNote(item.id))}</textarea>
      </div>
      <button class="primary-btn" id="noteSaveBtn">Add &amp; Save</button>
      <button class="small-btn note-prev-btn" id="notePrevBtn">Previous Screen</button>
    </section>
  `;

  document.getElementById("noteSaveBtn").addEventListener("click", () => {
    const text = document.getElementById("noteText").value.trim();
    saveNote(item.id, text);
    toast("Saved");
    location.hash = "#/category/" + item.categoryId;
  });
  document.getElementById("notePrevBtn").addEventListener("click", () => {
    location.hash = "#/category/" + item.categoryId;
  });
}

// ===== Panel =====
function renderPanel() {
  const tpl = document.getElementById("tpl-panel");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  const sub = state.panelSubroute;
  if (!sub) renderPanelDashboard();
  else if (sub === "clients") renderPanelClients();
  else if (sub === "discount") renderPanelDiscount();
  else if (sub === "history") renderPanelHistory();
  else if (sub === "bill") renderPanelBill();
  else if (sub === "reminder") renderPanelReminder();
  else if (sub === "backup") renderPanelBackup();
  else if (sub === "academy") renderPanelAcademy();
}

const icons = {
  client: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6"/></svg>`,
  discount: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 12 4h8v8l-8 8-8-8Z"/><circle cx="14.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h13a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5Z"/><path d="M8 9h8M8 13h5"/></svg>`,
  bill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></svg>`,
  reminder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a5 5 0 0 0-5 5v3.5L5 15h14l-2-3.5V8a5 5 0 0 0-5-5Z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/></svg>`,
  backup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0-3.5-3.5M12 15l3.5-3.5"/><path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>`,
  academy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9 12 4l10 5-10 5-10-5Z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/></svg>`,
};

function renderPanelDashboard() {
  const content = document.getElementById("panelContent");
  content.innerHTML = `
    <button class="back-btn" data-route="home">&larr; Home</button>
    <h2>Panel</h2>
    <div class="admin-menu">
      <button class="admin-menu-btn" data-route="panel/clients"><span class="admin-menu-icon">${icons.client}</span><span>Client Details</span></button>
      <button class="admin-menu-btn" data-route="panel/discount"><span class="admin-menu-icon">${icons.discount}</span><span>Special Discount</span></button>
      <button class="admin-menu-btn" data-route="panel/history"><span class="admin-menu-icon">${icons.history}</span><span>Client History</span></button>
      <button class="admin-menu-btn" data-route="panel/bill"><span class="admin-menu-icon">${icons.bill}</span><span>Bill Generation</span></button>
      <button class="admin-menu-btn" data-route="panel/reminder"><span class="admin-menu-icon">${icons.reminder}</span><span>Reminder</span></button>
      <button class="admin-menu-btn" data-route="panel/backup"><span class="admin-menu-icon">${icons.backup}</span><span>Backup & Restore</span></button>
      <button class="admin-menu-btn" data-route="panel/academy"><span class="admin-menu-icon">${icons.academy}</span><span>Academy</span></button>
    </div>
    <p class="fine-print" style="margin-top:20px">Everything here is stored only on this device.</p>
  `;
}

// ---- Academy: separate price list + course duration ----
function getStoredAcademyPrice(itemId) {
  const raw = localStorage.getItem("glambook_academy_prices");
  const prices = raw ? JSON.parse(raw) : {};
  return Object.prototype.hasOwnProperty.call(prices, itemId) ? prices[itemId] : null;
}
function setStoredAcademyPrice(itemId, price) {
  const raw = localStorage.getItem("glambook_academy_prices");
  const prices = raw ? JSON.parse(raw) : {};
  if (price === null) delete prices[itemId];
  else prices[itemId] = price;
  localStorage.setItem("glambook_academy_prices", JSON.stringify(prices));
}
function getStoredAcademyDuration(itemId) {
  const raw = localStorage.getItem("glambook_academy_durations");
  const durations = raw ? JSON.parse(raw) : {};
  return Object.prototype.hasOwnProperty.call(durations, itemId) ? durations[itemId] : "";
}
function setStoredAcademyDuration(itemId, text) {
  const raw = localStorage.getItem("glambook_academy_durations");
  const durations = raw ? JSON.parse(raw) : {};
  if (text) durations[itemId] = text; else delete durations[itemId];
  localStorage.setItem("glambook_academy_durations", JSON.stringify(durations));
}

function renderPanelAcademy() {
  const content = document.getElementById("panelContent");

  const listHtml = categories.map(cat => `
    <div class="menu-group">
      <h3 class="menu-group-title">${escapeHtml(cat.name)}</h3>
      ${cat.groups.map(g => `
        ${g.name && g.name !== cat.name ? `<p class="academy-subgroup-title">${escapeHtml(g.name)}</p>` : ""}
        ${g.items.map(item => `
          <div class="academy-item-row">
            <span class="academy-item-name">${escapeHtml(item.name)}</span>
            <label class="flag-field academy-duration-field" title="Academic duration">
              <span class="flag-label">D</span>
              <input type="text" class="academy-duration-input" data-id="${item.id}"
                placeholder="e.g. 2-3 Month"
                value="${escapeHtml(getStoredAcademyDuration(item.id))}">
            </label>
            <span class="price-field">
              <span class="rupee">₹</span>
              <input class="price-input academy-price-input" type="number" min="0" inputmode="numeric"
                data-id="${item.id}"
                placeholder="Set price"
                value="${getStoredAcademyPrice(item.id) ?? ""}">
            </span>
          </div>
        `).join("")}
      `).join("")}
    </div>
  `).join("");

  content.innerHTML = `
    <button class="back-btn" data-route="panel">&larr; Panel</button>
    <h2>Academy</h2>
    <p class="muted">Separate pricing and course duration for training purposes — independent of the regular service prices.</p>
    ${listHtml}
  `;

  content.querySelectorAll(".academy-price-input").forEach(input => {
    input.addEventListener("change", () => {
      const val = input.value === "" ? null : Number(input.value);
      setStoredAcademyPrice(input.dataset.id, val);
    });
  });
  content.querySelectorAll(".academy-duration-input").forEach(input => {
    input.addEventListener("change", () => {
      setStoredAcademyDuration(input.dataset.id, input.value.trim());
    });
  });
}

// ---- Local CRM storage ----
function getClients() { return JSON.parse(localStorage.getItem("glambook_clients") || "{}"); }
function saveClientRecord(client) {
  const clients = getClients();
  clients[client.clientCode] = client;
  localStorage.setItem("glambook_clients", JSON.stringify(clients));
}
function deleteClientRecord(code) {
  const clients = getClients();
  delete clients[code];
  localStorage.setItem("glambook_clients", JSON.stringify(clients));
}
function getClient(code) { return getClients()[code] || null; }

function getDiscounts() { return JSON.parse(localStorage.getItem("glambook_discounts") || "{}"); }
function saveDiscounts(d) { localStorage.setItem("glambook_discounts", JSON.stringify(d)); }

function getBills() { return JSON.parse(localStorage.getItem("glambook_bills") || "[]"); }
function saveBillRecord(bill) {
  const bills = getBills();
  bills.push(bill);
  localStorage.setItem("glambook_bills", JSON.stringify(bills));
}
function getBillsForClient(code) {
  return getBills().filter(b => b.clientCode === code).sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---- Send helpers ----
function normalizeIndianMobile(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  return digits;
}
function sendViaWhatsApp(mobile, message) {
  const num = normalizeIndianMobile(mobile);
  if (!num) return toast("Enter a valid mobile number first");
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, "_blank");
}
function sendViaSMS(mobile, message) {
  if (!mobile) return toast("Enter a valid mobile number first");
  window.location.href = `sms:${mobile}?body=${encodeURIComponent(message)}`;
}

// ---- Client Details ----
function renderPanelClients() {
  const content = document.getElementById("panelContent");
  const editing = state.editingClientCode ? getClient(state.editingClientCode) : null;

  content.innerHTML = `
    <button class="back-btn" data-route="panel">&larr; Panel</button>
    <h2>Client Details</h2>
    <div class="field-group"><label>Name of Client</label><input id="cName" value="${editing ? escapeHtml(editing.name) : ""}"></div>
    <div class="field-group"><label>Client Code</label><input id="cCode" placeholder="e.g. CL001" value="${editing ? escapeHtml(editing.clientCode) : ""}" ${editing ? "disabled" : ""}></div>
    <div class="field-group"><label>Mobile Number</label><input id="cMobile" type="tel" value="${editing ? escapeHtml(editing.mobile) : ""}"></div>
    <div class="field-group"><label>Birth Date</label><input id="cBirth" type="date" value="${editing ? editing.birthDate || "" : ""}"></div>
    <div class="field-group"><label>Wedding Anniversary Date</label><input id="cAnniv" type="date" value="${editing ? editing.anniversaryDate || "" : ""}"></div>
    <button class="primary-btn" id="saveClientBtn">${editing ? "Update Client" : "Save Client"}</button>
    ${editing ? `<button class="small-btn danger" id="cancelEditBtn" style="margin-top:8px">Cancel edit</button>` : ""}
    <h3 class="admin-subheading">Saved Clients</h3>
    <div id="clientListWrap"></div>
  `;

  renderClientList();

  document.getElementById("saveClientBtn").addEventListener("click", () => {
    const name = document.getElementById("cName").value.trim();
    const clientCode = document.getElementById("cCode").value.trim();
    const mobile = document.getElementById("cMobile").value.trim();
    const birthDate = document.getElementById("cBirth").value;
    const anniversaryDate = document.getElementById("cAnniv").value;

    if (!name || !clientCode) return toast("Name and Client Code are required");
    if (!editing && getClient(clientCode)) return toast("That Client Code already exists");

    saveClientRecord({ name, clientCode, mobile, birthDate, anniversaryDate });
    toast(editing ? "Client updated" : "Client saved");
    state.editingClientCode = null;
    renderPanelClients();
  });

  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => {
    state.editingClientCode = null;
    renderPanelClients();
  });
}

function renderClientList() {
  const wrap = document.getElementById("clientListWrap");
  const clients = Object.values(getClients());
  if (clients.length === 0) {
    wrap.innerHTML = `<p class="muted">No clients saved yet.</p>`;
    return;
  }
  wrap.innerHTML = clients.map(c => `
    <div class="admin-list-row" data-code="${escapeHtml(c.clientCode)}">
      <div>
        <strong>${escapeHtml(c.name)}</strong>
        <p class="muted">${escapeHtml(c.clientCode)} · ${escapeHtml(c.mobile || "no number")}</p>
      </div>
      <div class="admin-actions">
        <button class="small-btn" data-edit="${escapeHtml(c.clientCode)}">Edit</button>
        <button class="small-btn danger" data-del="${escapeHtml(c.clientCode)}">Delete</button>
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.editingClientCode = btn.dataset.edit;
      renderPanelClients();
    });
  });
  wrap.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this client?")) return;
      deleteClientRecord(btn.dataset.del);
      toast("Client deleted");
      renderClientList();
    });
  });
}

// ---- Special Discount ----
function renderPanelDiscount() {
  const content = document.getElementById("panelContent");
  const d = getDiscounts();
  content.innerHTML = `
    <button class="back-btn" data-route="panel">&larr; Panel</button>
    <h2>Special Discount</h2>
    <div class="field-group"><label>Festival Discount</label><input id="dFestival" placeholder="e.g. 10% or ₹200" value="${escapeHtml(d.festivalDiscount || "")}"></div>
    <div class="field-group"><label>Client Anniversary Discount</label><input id="dAnniv" placeholder="e.g. 15% or ₹300" value="${escapeHtml(d.clientAnniversaryDiscount || "")}"></div>
    <button class="primary-btn" id="saveDiscountBtn">Save</button>
  `;
  document.getElementById("saveDiscountBtn").addEventListener("click", () => {
    saveDiscounts({
      festivalDiscount: document.getElementById("dFestival").value.trim(),
      clientAnniversaryDiscount: document.getElementById("dAnniv").value.trim(),
    });
    toast("Discounts saved");
  });
}

// ---- Client History ----
function renderPanelHistory() {
  const content = document.getElementById("panelContent");
  content.innerHTML = `
    <button class="back-btn" data-route="panel">&larr; Panel</button>
    <h2>Client History</h2>
    <div class="field-group"><label>Enter Client Code</label><input id="hCode" placeholder="e.g. CL001"></div>
    <button class="primary-btn" id="searchHistoryBtn">Search</button>
    <div id="historyResult" style="margin-top:20px"></div>
  `;
  document.getElementById("searchHistoryBtn").addEventListener("click", () => {
    const code = document.getElementById("hCode").value.trim();
    const result = document.getElementById("historyResult");
    const client = getClient(code);
    if (!client) { result.innerHTML = `<p class="muted">No client found with that code.</p>`; return; }

    const bills = getBillsForClient(code);
    result.innerHTML = `
      <div class="admin-list-row">
        <div>
          <strong>${escapeHtml(client.name)}</strong>
          <p class="muted">${escapeHtml(client.mobile || "")}</p>
          <p class="muted">Birthday: ${client.birthDate || "—"} · Anniversary: ${client.anniversaryDate || "—"}</p>
        </div>
      </div>
      <h3 class="admin-subheading">Visit History</h3>
      ${bills.length === 0 ? `<p class="muted">No bills recorded yet.</p>` : bills.map(b => `
        <div class="admin-list-row">
          <div>
            <strong>₹${b.totalAmount}</strong>
            <p class="muted">${b.date}</p>
            <p class="muted">${escapeHtml(b.servicesTaken)}</p>
            ${b.additionalCharges ? `<p class="muted">Additional charges: ₹${b.additionalCharges}</p>` : ""}
            ${b.discount ? `<p class="muted">Discount applied: ${escapeHtml(b.discount)}</p>` : ""}
          </div>
        </div>
      `).join("")}
    `;
  });
}

// ---- Bill Generation ----
function renderPanelBill() {
  const content = document.getElementById("panelContent");
  const items = Object.entries(state.billSelections).map(([id, v]) => ({ id, ...v }));

  if (items.length === 0) {
    content.innerHTML = `
      <button class="back-btn" data-route="panel">&larr; Panel</button>
      <h2>Bill Generation</h2>
      <p class="muted">No services selected yet. Go to a category and tick the checkbox next to each service the customer's having — it shows up here.</p>
    `;
    return;
  }

  content.innerHTML = `
    <button class="back-btn" data-route="panel">&larr; Panel</button>
    <h2>Bill Generation</h2>
    <div class="field-group"><label>Client Code</label><input id="bCode" placeholder="e.g. CL001"></div>
    <p class="fine-print" id="bClientPreview"></p>

    <h3 class="admin-subheading">Selected services</h3>
    <div id="billReviewList">
      ${items.map(it => `
        <div class="bill-review-row" data-id="${it.id}">
          <span class="bill-item-info">
            <span class="bill-item-name">${escapeHtml(it.name)}</span>
            <span class="bill-item-desc">${escapeHtml(it.categoryName || "")}</span>
          </span>
          <span class="bill-item-price">₹${it.price ?? 0}</span>
          <button class="remove-item-btn" data-remove="${it.id}" title="Remove">&times;</button>
        </div>
      `).join("")}
    </div>

    <div class="bill-summary">
      <div class="bill-summary-row"><span>Subtotal</span><span id="billSubtotal">₹0</span></div>
      <div class="field-group">
        <label>Additional Charges</label>
        <input id="billAdditional" type="number" min="0" placeholder="e.g. 50">
      </div>
      <div class="field-group">
        <label>Discount</label>
        <input id="billDiscount" placeholder="e.g. 10% or ₹200">
      </div>
      <div class="bill-summary-row bill-final"><span>Final Total</span><span id="billFinalTotal">₹0</span></div>
    </div>

    <div class="admin-actions" style="margin-top:16px">
      <button class="primary-btn" id="saveBillBtn" style="margin-top:0">Save Bill</button>
      <button class="small-btn danger" id="discardBillBtn">Discard</button>
    </div>
    <div class="admin-actions" style="margin-top:12px">
      <button class="small-btn" id="sendBillWhatsApp">Confirm &amp; Send via WhatsApp</button>
      <button class="small-btn" id="sendBillSMS">Confirm &amp; Send via SMS</button>
    </div>
  `;

  const codeInput = document.getElementById("bCode");
  const additionalInput = document.getElementById("billAdditional");
  const discountInput = document.getElementById("billDiscount");
  let saved = false;

  codeInput.addEventListener("input", () => {
    saved = false;
    const c = getClient(codeInput.value.trim());
    document.getElementById("bClientPreview").textContent = c ? `${c.name} · ${c.mobile || "no number on file"}` : "";
  });

  document.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      delete state.billSelections[btn.dataset.remove];
      updateBillBar();
      renderPanelBill();
    });
  });

  function computeTotals() {
    const current = Object.entries(state.billSelections).map(([id, v]) => ({ id, ...v }));
    const subtotal = current.reduce((sum, i) => sum + (i.price || 0), 0);

    const additional = parseFloat(additionalInput.value) || 0;
    const withAdditional = subtotal + additional;

    const raw = discountInput.value.trim();
    let discountAmount = 0;
    if (raw.endsWith("%")) {
      const pct = parseFloat(raw);
      if (!isNaN(pct)) discountAmount = (withAdditional * pct) / 100;
    } else if (raw) {
      const flat = parseFloat(raw.replace(/[^\d.]/g, ""));
      if (!isNaN(flat)) discountAmount = flat;
    }

    const final = Math.max(0, Math.round(withAdditional - discountAmount));
    document.getElementById("billSubtotal").textContent = "₹" + subtotal;
    document.getElementById("billFinalTotal").textContent = "₹" + final;
    return { items: current, subtotal, additional, discountAmount, final, raw };
  }

  additionalInput.addEventListener("input", () => { saved = false; computeTotals(); });
  discountInput.addEventListener("input", () => { saved = false; computeTotals(); });
  computeTotals();

  function billMessage(totals) {
    const lines = totals.items.map(i => `- ${i.name} (${i.categoryName || "-"}): ₹${i.price ?? 0}`).join("\n");
    const additionalLine = totals.additional ? `\nAdditional Charges: ₹${totals.additional}` : "";
    const discountLine = totals.discountAmount ? `\nDiscount: -₹${Math.round(totals.discountAmount)}` : "";
    return `Hi! Here's your bill from ${brand.appName}:\n${lines}\nSubtotal: ₹${totals.subtotal}${additionalLine}${discountLine}\nFinal Total: ₹${totals.final}\nThank you for visiting!`;
  }
  function resolvedMobile() {
    const c = getClient(codeInput.value.trim());
    return c ? c.mobile : "";
  }
  function doSave(totals) {
    saveBillRecord({
      clientCode: codeInput.value.trim(),
      servicesTaken: totals.items.map(i => `${i.name} (${i.categoryName || "-"})`).join(", "),
      additionalCharges: totals.additional || null,
      totalAmount: totals.final,
      discount: totals.raw || null,
      date: new Date().toISOString().split("T")[0],
    });
    saved = true;
  }
  function finishAndReset() {
    state.billSelections = {};
    updateBillBar();
    renderPanelBill();
  }
  function validate(totals) {
    if (!codeInput.value.trim()) { toast("Enter a Client Code"); return false; }
    if (totals.items.length === 0) { toast("No services selected"); return false; }
    return true;
  }

  document.getElementById("saveBillBtn").addEventListener("click", () => {
    const totals = computeTotals();
    if (!validate(totals)) return;
    doSave(totals);
    toast("Bill saved");
    finishAndReset();
  });

  document.getElementById("discardBillBtn").addEventListener("click", () => {
    if (!confirm("Discard this bill? Everything ticked will be cleared without saving.")) return;
    finishAndReset();
  });

  document.getElementById("sendBillWhatsApp").addEventListener("click", () => {
    const totals = computeTotals();
    if (!validate(totals)) return;
    if (!saved) doSave(totals);
    sendViaWhatsApp(resolvedMobile(), billMessage(totals));
    finishAndReset();
  });
  document.getElementById("sendBillSMS").addEventListener("click", () => {
    const totals = computeTotals();
    if (!validate(totals)) return;
    if (!saved) doSave(totals);
    sendViaSMS(resolvedMobile(), billMessage(totals));
    finishAndReset();
  });
}

// ---- Reminder ----
function renderPanelReminder() {
  const content = document.getElementById("panelContent");
  content.innerHTML = `
    <button class="back-btn" data-route="panel">&larr; Panel</button>
    <h2>Reminder</h2>
    <div class="field-group"><label>Client Mobile</label><input id="rMobile" type="tel" placeholder="10-digit number"></div>
    <p class="muted" style="text-align:center;margin:4px 0">— or —</p>
    <div class="field-group"><label>Client Code</label><input id="rCode" placeholder="e.g. CL001"></div>
    <div class="field-group"><label>Write a Statement</label><textarea id="rMessage" rows="3" placeholder="e.g. It's time for your monthly hair spa!"></textarea></div>
    <div class="admin-actions">
      <button class="small-btn" id="sendReminderWhatsApp">Send via WhatsApp</button>
      <button class="small-btn" id="sendReminderSMS">Send via SMS</button>
    </div>
  `;

  function resolvedMobile() {
    const direct = document.getElementById("rMobile").value.trim();
    if (direct) return direct;
    const code = document.getElementById("rCode").value.trim();
    const c = getClient(code);
    return c ? c.mobile : "";
  }

  document.getElementById("sendReminderWhatsApp").addEventListener("click", () => {
    sendViaWhatsApp(resolvedMobile(), document.getElementById("rMessage").value.trim());
  });
  document.getElementById("sendReminderSMS").addEventListener("click", () => {
    sendViaSMS(resolvedMobile(), document.getElementById("rMessage").value.trim());
  });
}

// ---- Backup & Restore ----
function collectBackupData() {
  return {
    exportedAt: new Date().toISOString(),
    appName: brand.appName,
    prices: JSON.parse(localStorage.getItem("glambook_prices") || "{}"),
    notes: JSON.parse(localStorage.getItem("glambook_notes") || "{}"),
    homeFlags: JSON.parse(localStorage.getItem("glambook_home_flags") || "{}"),
    academyPrices: JSON.parse(localStorage.getItem("glambook_academy_prices") || "{}"),
    academyDurations: JSON.parse(localStorage.getItem("glambook_academy_durations") || "{}"),
    clients: JSON.parse(localStorage.getItem("glambook_clients") || "{}"),
    discounts: JSON.parse(localStorage.getItem("glambook_discounts") || "{}"),
    bills: JSON.parse(localStorage.getItem("glambook_bills") || "[]"),
  };
}
function downloadBackup() {
  const data = collectBackupData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `glambook-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function restoreBackup(fileText) {
  let data;
  try { data = JSON.parse(fileText); } catch { return false; }
  if (!data || typeof data !== "object") return false;
  localStorage.setItem("glambook_prices", JSON.stringify(data.prices || {}));
  localStorage.setItem("glambook_notes", JSON.stringify(data.notes || {}));
  localStorage.setItem("glambook_home_flags", JSON.stringify(data.homeFlags || {}));
  localStorage.setItem("glambook_academy_prices", JSON.stringify(data.academyPrices || {}));
  localStorage.setItem("glambook_academy_durations", JSON.stringify(data.academyDurations || {}));
  localStorage.setItem("glambook_clients", JSON.stringify(data.clients || {}));
  localStorage.setItem("glambook_discounts", JSON.stringify(data.discounts || {}));
  localStorage.setItem("glambook_bills", JSON.stringify(data.bills || []));
  return true;
}

function renderPanelBackup() {
  const content = document.getElementById("panelContent");
  content.innerHTML = `
    <button class="back-btn" data-route="panel">&larr; Panel</button>
    <h2>Backup & Restore</h2>

    <h3 class="admin-subheading">Export</h3>
    <p class="muted">Saves everything — bookings, clients, prices, discounts, bills — into one file. Keep it somewhere safe (email it to yourself, save to Google Drive, etc.).</p>
    <button class="primary-btn" id="exportBtn">Export Backup</button>

    <h3 class="admin-subheading">Restore</h3>
    <p class="muted">⚠️ This replaces everything currently on this device with what's in the file. Only do this if you're sure.</p>
    <div class="field-group"><input type="file" id="restoreFile" accept="application/json"></div>
    <button class="primary-btn" id="restoreBtn">Restore from File</button>
  `;

  document.getElementById("exportBtn").addEventListener("click", () => {
    downloadBackup();
    setLastBackupAt(Date.now());
    sessionStorage.removeItem("glambook_reminder_dismissed");
    toast("Backup downloaded");
  });

  document.getElementById("restoreBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("restoreFile");
    const file = fileInput.files[0];
    if (!file) return toast("Choose a backup file first");
    if (!confirm("This will replace all current data with the backup file. Continue?")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const ok = restoreBackup(reader.result);
      if (ok) {
        setLastBackupAt(Date.now());
        sessionStorage.removeItem("glambook_reminder_dismissed");
        toast("Restored — all data replaced");
      } else {
        toast("That file doesn't look like a valid backup");
      }
    };
    reader.onerror = () => toast("Couldn't read that file");
    reader.readAsText(file);
  });
}

// ===== Utils =====
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

// ===== Init =====
if (isUnlocked()) applyBrand();
const initialRoute = location.hash.replace("#/", "") || "home";
setRoute(initialRoute);
