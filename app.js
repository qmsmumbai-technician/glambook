import { db, auth } from "./firebase-config.js";
import { brand } from "./brand-config.js";
import { categories } from "./categories-config.js";
import {
  collection, doc, addDoc, getDocs, query, where, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged
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

// ---- Customer login (phone only, no OTP yet) ----
function renderLogin() {
  const tpl = document.getElementById("tpl-login");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  document.getElementById("loginConfirmBtn").addEventListener("click", () => {
    const phone = document.getElementById("loginPhone").value.trim();
    if (!/^\d{10}$/.test(phone)) return toast("Please enter a valid 10-digit phone number");
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
    else renderAdminLogin();
  });
}

function renderAdminLogin() {
  const tpl = document.getElementById("tpl-admin-login");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));

  document.getElementById("adminLoginBtn").addEventListener("click", async () => {
    const email = document.getElementById("adminEmail").value.trim();
    const pw = document.getElementById("adminPassword").value;
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      renderAdmin();
    } catch (err) {
      document.getElementById("adminLoginError").textContent = "Sign-in failed. Check your email/password.";
    }
  });
}

async function renderAdmin() {
  const tpl = document.getElementById("tpl-admin");
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));
  renderAdminBookings();
}

async function renderAdminBookings() {
  const content = document.getElementById("adminContent");
  content.innerHTML = `<p class="muted">Loading…</p>`;

  const snap = await getDocs(collection(db, "bookings"));
  const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (bookings.length === 0) {
    content.innerHTML = `<p class="muted">No bookings yet.</p>`;
    return;
  }

  content.innerHTML = bookings.map(b => `
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
