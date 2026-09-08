import { db, auth } from "./firebase-config.js";
import { brand } from "./brand-config.js";
import { categories } from "./categories-config.js";
import {
  collection, doc, addDoc, getDocs, query, where, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===== Apply branding (the whole point of brand-config.js) =====
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
  isAdmin: false,
  adminUser: null,
  adminSubroute: null,
  editingClientCode: null,
};

const app = document.getElementById("app");
const toastEl = document.getElementById("toast");

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2600);
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
  } else if (hash.startsWith("admin/")) {
    state.adminSubroute = hash.split("/")[1];
    setRoute("admin");
  } else if (hash === "admin") {
    state.adminSubroute = null;
    setRoute("admin");
  } else {
    setRoute(hash);
  }
});

document.body.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-route]");
  if (btn) {
    location.hash = "#/" + btn.dataset.route;
  }
});

document.getElementById("loginBtn").addEventListener("click", () => {
  if (getMyPhone()) {
    if (confirm("Sign out of this device?")) {
      localStorage.removeItem("glambook_phone");
      localStorage.removeItem("glambook_name");
      toast("Signed out");
      setRoute("home");
    }
  } else {
    setRoute("login");
  }
});

// ===== Local "auth" for customers (phone number, no OTP yet) =====
function getMyPhone() { return localStorage.getItem("glambook_phone"); }
function getMyName() { return localStorage.getItem("glambook_name") || ""; }

// ===== Render =====
async function render() {
  updateNavActive();

  if (state.route === "home") return renderHome();
  if (state.route === "category") return renderCategory();
  if (state.route === "book") return renderBook();
  if (state.route === "bookings") return renderBookings();
  if (state.route === "login") return renderLogin();
  if (state.route === "admin") return renderAdminGate();
}

function updateNavActive() {
  document.getElementById("loginBtn").textContent = getMyPhone() ? "Sign out" : "Sign in";
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
    tile.addEventListener("click", () => {
      location.hash = "#/category/" + tile.dataset.cat;
    });
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

  // Editing price: stop the row-click (which would navigate to booking)
  wrap.querySelectorAll(".price-input").forEach(input => {
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("change", () => {
      const val = input.value === "" ? null : Number(input.value);
      setStoredPrice(input.dataset.priceFor, val);
    });
  });

  // Tapping the row (not the price field) goes to booking
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

// ---- Book flow ----
function renderBook() {
  if (!state.selectedService) { location.hash = "#/home"; return; }
  const tpl = document.getElementById("tpl-book");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  const s = state.selectedService;
  document.getElementById("bookServiceName").textContent = s.name;
  const priceText = s.price ? `₹${s.price}` : "Price on request";
  document.getElementById("bookServiceMeta").textContent = [priceText, s.duration, s.categoryName].filter(Boolean).join(" · ");

  // mode options
  const modeOpts = document.getElementById("modeOptions");
  const modes = s.mode === "both" ? ["home", "salon"] : [s.mode];
  modeOpts.innerHTML = modes.map(m =>
    `<button class="pill" data-mode="${m}">${m === "home" ? "At my home" : "At the salon"}</button>`
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

  // time options
  document.querySelectorAll("#timeOptions .pill").forEach(p => {
    p.addEventListener("click", () => {
      state.selectedTime = p.dataset.time;
      document.querySelectorAll("#timeOptions .pill").forEach(x => x.classList.remove("selected"));
      p.classList.add("selected");
    });
  });

  // prefill from local storage
  document.getElementById("nameInput").value = getMyName();
  document.getElementById("phoneInput").value = getMyPhone() || "";

  // min date = today
  const dateInput = document.getElementById("dateInput");
  dateInput.min = new Date().toISOString().split("T")[0];

  document.getElementById("confirmBookingBtn").addEventListener("click", submitBooking);
}

async function submitBooking() {
  const name = document.getElementById("nameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();
  const date = document.getElementById("dateInput").value;
  const address = document.getElementById("addressInput").value.trim();
  const notes = document.getElementById("notesInput").value.trim();

  if (!state.bookingMode) return toast("Please choose where you'd like the service");
  if (!date) return toast("Please pick a date");
  if (!state.selectedTime) return toast("Please pick a time of day");
  if (!name) return toast("Please enter your name");
  if (!/^\d{10}$/.test(phone)) return toast("Please enter a valid 10-digit phone number");
  if (state.bookingMode === "home" && !address) return toast("Please enter your address");

  const btn = document.getElementById("confirmBookingBtn");
  btn.disabled = true;
  btn.textContent = "Booking…";

  try {
    await addDoc(collection(db, "bookings"), {
      serviceId: state.selectedService.id,
      serviceName: state.selectedService.name,
      price: state.selectedService.price,
      mode: state.bookingMode,
      date,
      timeOfDay: state.selectedTime,
      address: state.bookingMode === "home" ? address : "",
      notes,
      customerName: name,
      customerPhone: phone,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem("glambook_phone", phone);
    localStorage.setItem("glambook_name", name);

    toast("Booking request sent!");
    location.hash = "#/bookings";
  } catch (err) {
    console.error(err);
    toast("Something went wrong. Please try again.");
    btn.disabled = false;
    btn.textContent = "Confirm booking";
  }
}

// ---- My bookings ----
async function renderBookings() {
  const tpl = document.getElementById("tpl-bookings");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  const phone = getMyPhone();
  const listEl = document.getElementById("bookingsList");

  if (!phone) {
    listEl.innerHTML = `<p class="muted">Sign in with your phone number to see your bookings.</p>`;
    return;
  }

  const q = query(collection(db, "bookings"), where("customerPhone", "==", phone));
  const snap = await getDocs(q);
  const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (bookings.length === 0) {
    listEl.innerHTML = `<p class="muted">No bookings yet. Go book something nice for yourself.</p>`;
    return;
  }

  listEl.innerHTML = bookings.map(b => `
    <div class="booking-item" data-id="${b.id}">
      <h4>${escapeHtml(b.serviceName)}</h4>
      <p>${b.date} · ${capitalize(b.timeOfDay)} · ${b.mode === "home" ? "At home" : "At salon"}</p>
      <p>₹${b.price}</p>
      <span class="status-badge status-${b.status}">${capitalize(b.status)}</span>
      ${b.status !== "cancelled" ? `<div><button class="cancel-link" data-cancel="${b.id}">Cancel booking</button></div>` : ""}
    </div>
  `).join("");

  listEl.querySelectorAll("[data-cancel]").forEach(link => {
    link.addEventListener("click", async () => {
      if (!confirm("Cancel this booking?")) return;
      await updateDoc(doc(db, "bookings", link.dataset.cancel), { status: "cancelled" });
      toast("Booking cancelled");
      renderBookings();
    });
  });
}

// ---- Customer / owner login (phone number, or phone+PIN for admin) ----
function renderLogin() {
  const tpl = document.getElementById("tpl-login");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  document.getElementById("loginConfirmBtn").addEventListener("click", async () => {
    const phone = document.getElementById("loginPhone").value.trim();
    const pin = document.getElementById("loginPin").value.trim();
    if (!/^\d{10}$/.test(phone)) return toast("Please enter a valid 10-digit phone number");

    const admin = brand.adminAccess;
    if (admin && phone === admin.phone && pin && pin === admin.pin) {
      const btn = document.getElementById("loginConfirmBtn");
      btn.disabled = true;
      btn.textContent = "Signing in…";
      try {
        await signInWithEmailAndPassword(auth, admin.firebaseEmail, admin.firebasePassword);
        toast("Welcome back");
        location.hash = "#/admin";
      } catch (err) {
        console.error(err);
        toast("Admin sign-in failed — check firebaseEmail/firebasePassword in brand-config.js");
        btn.disabled = false;
        btn.textContent = "Continue";
      }
      return;
    }

    localStorage.setItem("glambook_phone", phone);
    toast("Signed in");
    location.hash = "#/bookings";
  });
}

// ---- Admin ----
function renderAdminGate() {
  onAuthStateChanged(auth, (user) => {
    state.adminUser = user;
    if (user) renderAdmin();
    else {
      toast("Sign in with your phone + PIN from the home screen to access Admin");
      location.hash = "#/login";
    }
  });
}

async function renderAdmin() {
  const tpl = document.getElementById("tpl-admin");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  const sub = state.adminSubroute;
  if (!sub) renderAdminDashboard();
  else if (sub === "bookings") renderAdminBookings();
  else if (sub === "clients") renderAdminClients();
  else if (sub === "discount") renderAdminDiscount();
  else if (sub === "history") renderAdminHistory();
  else if (sub === "bill") renderAdminBill();
  else if (sub === "reminder") renderAdminReminder();
}

function renderAdminDashboard() {
  const content = document.getElementById("adminContent");
  content.innerHTML = `
    <h2>Admin Panel</h2>
    <div class="admin-menu">
      <button class="admin-menu-btn" data-route="admin/bookings">
        <span class="admin-menu-icon">${icons.bookings}</span>
        <span>Bookings</span>
      </button>
      <button class="admin-menu-btn" data-route="admin/clients">
        <span class="admin-menu-icon">${icons.client}</span>
        <span>Client Details</span>
      </button>
      <button class="admin-menu-btn" data-route="admin/discount">
        <span class="admin-menu-icon">${icons.discount}</span>
        <span>Special Discount</span>
      </button>
      <button class="admin-menu-btn" data-route="admin/history">
        <span class="admin-menu-icon">${icons.history}</span>
        <span>Client History</span>
      </button>
      <button class="admin-menu-btn" data-route="admin/bill">
        <span class="admin-menu-icon">${icons.bill}</span>
        <span>Bill Generation</span>
      </button>
      <button class="admin-menu-btn" data-route="admin/reminder">
        <span class="admin-menu-icon">${icons.reminder}</span>
        <span>Reminder</span>
      </button>
    </div>
    <p class="fine-print" style="margin-top:20px">Client details, discounts, bills, and reminders are stored only on this device — they won't appear if you open the admin panel on a different phone.</p>
    <button class="small-btn danger" id="adminSignOutBtn" style="margin-top:16px">Sign out of Admin</button>
  `;
  document.getElementById("adminSignOutBtn").addEventListener("click", async () => {
    await signOut(auth);
    toast("Signed out");
    location.hash = "#/home";
  });
}

const icons = {
  bookings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>`,
  client: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6"/></svg>`,
  discount: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 12 4h8v8l-8 8-8-8Z"/><circle cx="14.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h13a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5Z"/><path d="M8 9h8M8 13h5"/></svg>`,
  bill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></svg>`,
  reminder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a5 5 0 0 0-5 5v3.5L5 15h14l-2-3.5V8a5 5 0 0 0-5-5Z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/></svg>`,
};

// ===== Local CRM storage (device-only) =====
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

// ===== Send helpers: opens WhatsApp / SMS with the message pre-filled =====
// True silent auto-send isn't possible from a plain web app without a paid
// gateway (Twilio for SMS, WhatsApp Business API) — this is the closest
// equivalent: one tap in the native app to actually send.
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

// ---- 1. Client Details ----
function renderAdminClients() {
  const content = document.getElementById("adminContent");
  const editing = state.editingClientCode ? getClient(state.editingClientCode) : null;

  content.innerHTML = `
    <button class="back-btn" data-route="admin">&larr; Admin Panel</button>
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
    renderAdminClients();
  });

  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => {
    state.editingClientCode = null;
    renderAdminClients();
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
      renderAdminClients();
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

// ---- 2. Special Discount ----
function renderAdminDiscount() {
  const content = document.getElementById("adminContent");
  const d = getDiscounts();
  content.innerHTML = `
    <button class="back-btn" data-route="admin">&larr; Admin Panel</button>
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

// ---- 3. Client History ----
function renderAdminHistory() {
  const content = document.getElementById("adminContent");
  content.innerHTML = `
    <button class="back-btn" data-route="admin">&larr; Admin Panel</button>
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
          </div>
        </div>
      `).join("")}
    `;
  });
}

// ---- 4. Bill Generation ----
function renderAdminBill() {
  const content = document.getElementById("adminContent");
  content.innerHTML = `
    <button class="back-btn" data-route="admin">&larr; Admin Panel</button>
    <h2>Bill Generation</h2>
    <div class="field-group"><label>Client Code</label><input id="bCode" placeholder="e.g. CL001"></div>
    <p class="fine-print" id="bClientPreview"></p>
    <div class="field-group"><label>Services Taken</label><textarea id="bServices" rows="3" placeholder="e.g. Haircut, Hair Spa"></textarea></div>
    <div class="field-group"><label>Total Amount (₹)</label><input id="bAmount" type="number" min="0"></div>
    <button class="primary-btn" id="saveBillBtn">Save Bill</button>
    <div class="admin-actions" style="margin-top:12px">
      <button class="small-btn" id="sendBillWhatsApp">Send via WhatsApp</button>
      <button class="small-btn" id="sendBillSMS">Send via SMS</button>
    </div>
  `;

  const codeInput = document.getElementById("bCode");
  codeInput.addEventListener("input", () => {
    const c = getClient(codeInput.value.trim());
    document.getElementById("bClientPreview").textContent = c ? `${c.name} · ${c.mobile || "no number on file"}` : "";
  });

  function billMessage() {
    const services = document.getElementById("bServices").value.trim();
    const amount = document.getElementById("bAmount").value;
    return `Hi! Here's your bill from ${brand.appName}:\n${services}\nTotal: ₹${amount}\nThank you for visiting!`;
  }
  function resolvedMobile() {
    const c = getClient(codeInput.value.trim());
    return c ? c.mobile : "";
  }

  document.getElementById("saveBillBtn").addEventListener("click", () => {
    const clientCode = codeInput.value.trim();
    const servicesTaken = document.getElementById("bServices").value.trim();
    const totalAmount = document.getElementById("bAmount").value;
    if (!clientCode) return toast("Enter a Client Code");
    if (!servicesTaken || !totalAmount) return toast("Services and amount are required");

    saveBillRecord({ clientCode, servicesTaken, totalAmount, date: new Date().toISOString().split("T")[0] });
    toast("Bill saved");
  });

  document.getElementById("sendBillWhatsApp").addEventListener("click", () => sendViaWhatsApp(resolvedMobile(), billMessage()));
  document.getElementById("sendBillSMS").addEventListener("click", () => sendViaSMS(resolvedMobile(), billMessage()));
}

// ---- 5. Reminder ----
function renderAdminReminder() {
  const content = document.getElementById("adminContent");
  content.innerHTML = `
    <button class="back-btn" data-route="admin">&larr; Admin Panel</button>
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

async function renderAdminBookings() {
  const content = document.getElementById("adminContent");
  const backHtml = `<button class="back-btn" data-route="admin">&larr; Admin Panel</button><h2>Bookings</h2>`;
  content.innerHTML = backHtml + `<p class="muted">Loading…</p>`;

  const snap = await getDocs(collection(db, "bookings"));
  const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

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
      <p class="muted">${escapeHtml(b.customerName)} · ${b.customerPhone}</p>
      <p class="muted">${b.date} · ${capitalize(b.timeOfDay)} · ${b.mode === "home" ? "At home" : "At salon"}</p>
      ${b.mode === "home" ? `<p class="muted">${escapeHtml(b.address)}</p>` : ""}
      ${b.notes ? `<p class="muted">Note: ${escapeHtml(b.notes)}</p>` : ""}
      <div class="admin-actions">
        ${b.status === "pending" ? `<button class="small-btn confirm" data-confirm="${b.id}">Confirm</button>` : ""}
        ${b.status !== "cancelled" ? `<button class="small-btn danger" data-cancel="${b.id}">Cancel</button>` : ""}
      </div>
    </div>
  `).join("");

  content.querySelectorAll("[data-confirm]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await updateDoc(doc(db, "bookings", btn.dataset.confirm), { status: "confirmed" });
      toast("Booking confirmed");
      renderAdminBookings();
    });
  });
  content.querySelectorAll("[data-cancel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await updateDoc(doc(db, "bookings", btn.dataset.cancel), { status: "cancelled" });
      toast("Booking cancelled");
      renderAdminBookings();
    });
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
applyBrand();
const initialRoute = location.hash.replace("#/", "") || "home";
setRoute(initialRoute);
