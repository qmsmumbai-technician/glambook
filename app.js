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
  selectedService: null,
  bookingMode: null,
  selectedTime: null,
  panelSubroute: null,
  editingClientCode: null,
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

// ===== Render =====
function render() {
  if (!isUnlocked()) { renderPinLock(); return; }

  if (state.route === "home") return renderHome();
  if (state.route === "category") return renderCategory();
  if (state.route === "book") return renderBook();
  if (state.route === "panel") return renderPanel();
}

// ---- Home: category grid ----
function renderHome() {
  const tpl = document.getElementById("tpl-home");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  document.getElementById("heroTagline").textContent = brand.tagline;
  document.getElementById("heroSubTagline").textContent = brand.subTagline;

  const grid = document.getElementById("categoryGrid");
  grid.innerHTML = categories.map(cat => `
    <div class="category-tile" data-cat="${cat.id}">
      <span class="category-icon">${cat.icon}</span>
      <span class="category-tile-name">${escapeHtml(cat.name)}</span>
    </div>
  `).join("");

  grid.querySelectorAll(".category-tile").forEach(tile => {
    tile.addEventListener("click", () => { location.hash = "#/category/" + tile.dataset.cat; });
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
          <span class="menu-item-name">${escapeHtml(item.name)}</span>
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
    });
  });

  wrap.querySelectorAll(".menu-item").forEach(row => {
    row.addEventListener("click", () => {
      const group = cat.groups.find(g => g.items.some(i => i.id === row.dataset.item));
      const item = group.items.find(i => i.id === row.dataset.item);
      state.selectedService = {
        id: item.id,
        name: item.name,
        price: effectivePrice(item),
        duration: item.duration || "",
        mode: item.mode || "both",
        categoryName: cat.name,
      };
      state.bookingMode = null;
      state.selectedTime = null;
      location.hash = "#/book";
    });
  });
}

// ---- Booking log (local storage — this is your appointment book) ----
function getBookings() { return JSON.parse(localStorage.getItem("glambook_bookings") || "[]"); }
function saveBookings(list) { localStorage.setItem("glambook_bookings", JSON.stringify(list)); }
function addBooking(booking) {
  const list = getBookings();
  booking.id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
  list.push(booking);
  saveBookings(list);
}
function updateBookingStatus(id, status) {
  const list = getBookings();
  const b = list.find(x => x.id === id);
  if (b) b.status = status;
  saveBookings(list);
}

function renderBook() {
  if (!state.selectedService) { location.hash = "#/home"; return; }
  const tpl = document.getElementById("tpl-book");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  const s = state.selectedService;
  document.getElementById("bookServiceName").textContent = s.name;
  const priceText = s.price ? `₹${s.price}` : "Price on request";
  document.getElementById("bookServiceMeta").textContent = [priceText, s.duration, s.categoryName].filter(Boolean).join(" · ");

  const modeOpts = document.getElementById("modeOptions");
  const modes = s.mode === "both" ? ["home", "salon"] : [s.mode];
  modeOpts.innerHTML = modes.map(m =>
    `<button class="pill" data-mode="${m}">${m === "home" ? "At client's home" : "At the salon"}</button>`
  ).join("");
  if (modes.length === 1) {
    state.bookingMode = modes[0];
    modeOpts.querySelector(".pill").classList.add("selected");
    document.getElementById("addressGroup").style.display = modes[0] === "home" ? "block" : "none";
  }
  modeOpts.querySelectorAll(".pill").forEach(p => {
    p.addEventListener("click", () => {
      state.bookingMode = p.dataset.mode;
      modeOpts.querySelectorAll(".pill").forEach(x => x.classList.remove("selected"));
      p.classList.add("selected");
      document.getElementById("addressGroup").style.display = p.dataset.mode === "home" ? "block" : "none";
    });
  });

  document.querySelectorAll("#timeOptions .pill").forEach(p => {
    p.addEventListener("click", () => {
      state.selectedTime = p.dataset.time;
      document.querySelectorAll("#timeOptions .pill").forEach(x => x.classList.remove("selected"));
      p.classList.add("selected");
    });
  });

  const dateInput = document.getElementById("dateInput");
  dateInput.min = new Date().toISOString().split("T")[0];

  document.getElementById("confirmBookingBtn").addEventListener("click", submitBooking);
}

function submitBooking() {
  const name = document.getElementById("nameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();
  const date = document.getElementById("dateInput").value;
  const address = document.getElementById("addressInput").value.trim();
  const notes = document.getElementById("notesInput").value.trim();

  if (!state.bookingMode) return toast("Please choose where the service will happen");
  if (!date) return toast("Please pick a date");
  if (!state.selectedTime) return toast("Please pick a time of day");
  if (!name) return toast("Please enter the client's name");
  if (!/^\d{10}$/.test(phone)) return toast("Please enter a valid 10-digit phone number");
  if (state.bookingMode === "home" && !address) return toast("Please enter the client's address");

  addBooking({
    serviceId: state.selectedService.id,
    serviceName: state.selectedService.name,
    price: state.selectedService.price,
    mode: state.bookingMode,
    date,
    timeOfDay: state.selectedTime,
    address: state.bookingMode === "home" ? address : "",
    notes,
    clientName: name,
    clientPhone: phone,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  });

  toast("Booking saved");
  location.hash = "#/panel/bookings";
}

// ===== Panel =====
function renderPanel() {
  const tpl = document.getElementById("tpl-panel");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  const sub = state.panelSubroute;
  if (!sub) renderPanelDashboard();
  else if (sub === "bookings") renderPanelBookings();
  else if (sub === "clients") renderPanelClients();
  else if (sub === "discount") renderPanelDiscount();
  else if (sub === "history") renderPanelHistory();
  else if (sub === "bill") renderPanelBill();
  else if (sub === "reminder") renderPanelReminder();
  else if (sub === "backup") renderPanelBackup();
}

const icons = {
  bookings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>`,
  client: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6"/></svg>`,
  discount: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 12 4h8v8l-8 8-8-8Z"/><circle cx="14.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h13a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5Z"/><path d="M8 9h8M8 13h5"/></svg>`,
  bill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></svg>`,
  reminder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a5 5 0 0 0-5 5v3.5L5 15h14l-2-3.5V8a5 5 0 0 0-5-5Z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/></svg>`,
  backup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0-3.5-3.5M12 15l3.5-3.5"/><path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>`,
};

function renderPanelDashboard() {
  const content = document.getElementById("panelContent");
  content.innerHTML = `
    <h2>Panel</h2>
    <div class="admin-menu">
      <button class="admin-menu-btn" data-route="panel/bookings"><span class="admin-menu-icon">${icons.bookings}</span><span>Bookings</span></button>
      <button class="admin-menu-btn" data-route="panel/clients"><span class="admin-menu-icon">${icons.client}</span><span>Client Details</span></button>
      <button class="admin-menu-btn" data-route="panel/discount"><span class="admin-menu-icon">${icons.discount}</span><span>Special Discount</span></button>
      <button class="admin-menu-btn" data-route="panel/history"><span class="admin-menu-icon">${icons.history}</span><span>Client History</span></button>
      <button class="admin-menu-btn" data-route="panel/bill"><span class="admin-menu-icon">${icons.bill}</span><span>Bill Generation</span></button>
      <button class="admin-menu-btn" data-route="panel/reminder"><span class="admin-menu-icon">${icons.reminder}</span><span>Reminder</span></button>
      <button class="admin-menu-btn" data-route="panel/backup"><span class="admin-menu-icon">${icons.backup}</span><span>Backup & Restore</span></button>
    </div>
    <p class="fine-print" style="margin-top:20px">Everything here is stored only on this device.</p>
  `;
}

// ---- Bookings ----
function renderPanelBookings() {
  const content = document.getElementById("panelContent");
  const backHtml = `<button class="back-btn" data-route="panel">&larr; Panel</button><h2>Bookings</h2>`;
  const bookings = getBookings().sort((a, b) => (a.date < b.date ? 1 : -1));

  if (bookings.length === 0) {
    content.innerHTML = backHtml + `<p class="muted">No bookings yet.</p>`;
    return;
  }

  content.innerHTML = backHtml + bookings.map(b => `
    <div class="admin-booking-row">
      <div class="admin-row-top">
        <strong>${escapeHtml(b.serviceName)}</strong>
        <span class="status-badge status-${b.status}">${capitalize(b.status)}</span>
      </div>
      <p class="muted">${escapeHtml(b.clientName)} · ${escapeHtml(b.clientPhone)}</p>
      <p class="muted">${b.date} · ${capitalize(b.timeOfDay)} · ${b.mode === "home" ? "At client's home" : "At salon"}</p>
      ${b.mode === "home" ? `<p class="muted">${escapeHtml(b.address)}</p>` : ""}
      ${b.notes ? `<p class="muted">Note: ${escapeHtml(b.notes)}</p>` : ""}
      <div class="admin-actions">
        ${b.status !== "cancelled" ? `<button class="small-btn danger" data-cancel="${b.id}">Cancel</button>` : ""}
      </div>
    </div>
  `).join("");

  content.querySelectorAll("[data-cancel]").forEach(btn => {
    btn.addEventListener("click", () => {
      updateBookingStatus(btn.dataset.cancel, "cancelled");
      toast("Booking cancelled");
      renderPanelBookings();
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

  const checklistHtml = categories.map(cat => `
    <div class="bill-cat-block">
      <h4 class="bill-cat-title">${escapeHtml(cat.name)}</h4>
      ${cat.groups.map(g => `
        ${g.name && g.name !== cat.name ? `<p class="bill-group-title">${escapeHtml(g.name)}</p>` : ""}
        ${g.items.map(item => {
          const price = effectivePrice(item);
          return `
            <label class="bill-item-row">
              <input type="checkbox" class="bill-check" data-id="${item.id}" data-price="${price ?? 0}" data-name="${escapeHtml(item.name)}">
              <span class="bill-item-name">${escapeHtml(item.name)}</span>
              <span class="bill-item-price">${price ? "₹" + price : "—"}</span>
            </label>
          `;
        }).join("")}
      `).join("")}
    </div>
  `).join("");

  content.innerHTML = `
    <button class="back-btn" data-route="panel">&larr; Panel</button>
    <h2>Bill Generation</h2>
    <div class="field-group"><label>Client Code</label><input id="bCode" placeholder="e.g. CL001"></div>
    <p class="fine-print" id="bClientPreview"></p>

    <h3 class="admin-subheading">Tick services taken</h3>
    <div id="billChecklist">${checklistHtml}</div>

    <div class="bill-summary">
      <div class="bill-summary-row"><span>Subtotal</span><span id="billSubtotal">₹0</span></div>
      <div class="field-group">
        <label>Discount</label>
        <input id="billDiscount" placeholder="e.g. 10% or ₹200">
      </div>
      <div class="bill-summary-row bill-final"><span>Final Total</span><span id="billFinalTotal">₹0</span></div>
    </div>

    <button class="primary-btn" id="saveBillBtn">Save Bill</button>
    <div class="admin-actions" style="margin-top:12px">
      <button class="small-btn" id="sendBillWhatsApp">Confirm &amp; Send via WhatsApp</button>
      <button class="small-btn" id="sendBillSMS">Confirm &amp; Send via SMS</button>
    </div>
  `;

  const codeInput = document.getElementById("bCode");
  const discountInput = document.getElementById("billDiscount");
  let saved = false;

  codeInput.addEventListener("input", () => {
    saved = false;
    const c = getClient(codeInput.value.trim());
    document.getElementById("bClientPreview").textContent = c ? `${c.name} · ${c.mobile || "no number on file"}` : "";
  });

  function computeTotals() {
    const checked = [...document.querySelectorAll(".bill-check:checked")];
    const subtotal = checked.reduce((sum, c) => sum + Number(c.dataset.price || 0), 0);

    const raw = discountInput.value.trim();
    let discountAmount = 0;
    if (raw.endsWith("%")) {
      const pct = parseFloat(raw);
      if (!isNaN(pct)) discountAmount = (subtotal * pct) / 100;
    } else if (raw) {
      const flat = parseFloat(raw.replace(/[^\d.]/g, ""));
      if (!isNaN(flat)) discountAmount = flat;
    }

    const final = Math.max(0, Math.round(subtotal - discountAmount));
    document.getElementById("billSubtotal").textContent = "₹" + subtotal;
    document.getElementById("billFinalTotal").textContent = "₹" + final;
    return { checked, subtotal, discountAmount, final, raw };
  }

  document.querySelectorAll(".bill-check").forEach(cb => {
    cb.addEventListener("change", () => { saved = false; computeTotals(); });
  });
  discountInput.addEventListener("input", () => { saved = false; computeTotals(); });
  computeTotals();

  function billMessage(totals) {
    const lines = totals.checked.map(c => `- ${c.dataset.name}: ₹${c.dataset.price}`).join("\n");
    const discountLine = totals.discountAmount ? `\nDiscount: -₹${Math.round(totals.discountAmount)}` : "";
    return `Hi! Here's your bill from ${brand.appName}:\n${lines}\nSubtotal: ₹${totals.subtotal}${discountLine}\nFinal Total: ₹${totals.final}\nThank you for visiting!`;
  }
  function resolvedMobile() {
    const c = getClient(codeInput.value.trim());
    return c ? c.mobile : "";
  }
  function doSave(totals) {
    const clientCode = codeInput.value.trim();
    saveBillRecord({
      clientCode,
      servicesTaken: totals.checked.map(c => c.dataset.name).join(", "),
      totalAmount: totals.final,
      discount: totals.raw || null,
      date: new Date().toISOString().split("T")[0],
    });
    saved = true;
  }
  function validate(totals) {
    if (!codeInput.value.trim()) { toast("Enter a Client Code"); return false; }
    if (totals.checked.length === 0) { toast("Tick at least one service"); return false; }
    return true;
  }

  document.getElementById("saveBillBtn").addEventListener("click", () => {
    const totals = computeTotals();
    if (!validate(totals)) return;
    doSave(totals);
    toast("Bill saved");
    renderPanelBill();
  });

  document.getElementById("sendBillWhatsApp").addEventListener("click", () => {
    const totals = computeTotals();
    if (!validate(totals)) return;
    if (!saved) doSave(totals);
    sendViaWhatsApp(resolvedMobile(), billMessage(totals));
    renderPanelBill();
  });
  document.getElementById("sendBillSMS").addEventListener("click", () => {
    const totals = computeTotals();
    if (!validate(totals)) return;
    if (!saved) doSave(totals);
    sendViaSMS(resolvedMobile(), billMessage(totals));
    renderPanelBill();
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
    bookings: JSON.parse(localStorage.getItem("glambook_bookings") || "[]"),
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
  localStorage.setItem("glambook_bookings", JSON.stringify(data.bookings || []));
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
      if (ok) toast("Restored — all data replaced");
      else toast("That file doesn't look like a valid backup");
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
