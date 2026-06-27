// ============================================================
// ui.js — Rendering layer for Travel Expense Tracker
// Plain DOM rendering (no framework) so this deploys as static files
// on GitHub Pages with zero build step.
// ============================================================

// state, formatSGD, CATEGORIES, CURRENCY_PRESETS are already global from app.js

// ── Utility helpers ──────────────────────────────────────────
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDateRange(start, end) {
  if (!start) return "";
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

function render() {
  const root = document.getElementById("app-root");
  root.innerHTML = "";

  if (!state.user) {
    root.appendChild(renderLogin());
    return;
  }

  switch (state.view) {
    case "trips":
      root.appendChild(renderTrips());
      break;
    case "add":
      root.appendChild(renderAddExpense());
      break;
    case "history":
      root.appendChild(renderHistory());
      break;
    case "rates":
      root.appendChild(renderRates());
      break;
    case "settings":
      root.appendChild(renderSettings());
      break;
    default:
      root.appendChild(renderDashboard());
  }
}
window.render = render; // app.js calls this after state changes

// ── Bottom navigation (persistent across all main screens) ──
const NAV_ICONS = {
  trips: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`,
  add: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>`,
  history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>`,
};

function renderBottomNav(activeView) {
  const nav = document.createElement("div");
  nav.className = "bottom-nav";
  // "trips" is the home screen — shows all trips, create/switch trip
  const items = [
    { view: "trips",    label: "Home"     },
    { view: "history",  label: "History"  },
    { view: "settings", label: "Settings" },
  ];
  nav.innerHTML = items.map(it => `
    <button class="bottom-nav__item${it.view === activeView ? " bottom-nav__item--active" : ""}" data-view="${it.view}">
      <span class="bottom-nav__icon">${NAV_ICONS[it.view]}</span>
      <span>${it.label}</span>
    </button>
  `).join("");
  nav.querySelectorAll(".bottom-nav__item").forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.view;
      if (v === "add") { state.scanResult = null; state.editingExpense = null; }
      state.view = v;
      render();
    };
  });
  return nav;
}


// ============================================================
// LOGIN
// ============================================================
function renderLogin() {
  const el = document.createElement("div");
  el.className = "screen screen--center";
  el.innerHTML = `
    <div class="login-card">
      <div class="eyebrow">Ryu</div>
      <h1 class="serif-title">Travel Expense Tracker</h1>
      <p class="muted">Sign in to track spend on your next trip.</p>
      <input id="login-email" type="email" placeholder="Email" class="input" />
      <input id="login-password" type="password" placeholder="Password" class="input" style="margin-top:10px" />
      <button id="login-btn" class="btn btn--primary" style="margin-top:16px">Sign in</button>
      <button id="signup-btn" class="btn btn--ghost" style="margin-top:8px">Create account</button>
    </div>
  `;
  el.querySelector("#login-btn").onclick = () => {
    const email = el.querySelector("#login-email").value.trim();
    const password = el.querySelector("#login-password").value;
    if (!email || !password) return alert("Enter email and password");
    window.AppData.signIn(email, password);
  };
  el.querySelector("#signup-btn").onclick = () => {
    const email = el.querySelector("#login-email").value.trim();
    const password = el.querySelector("#login-password").value;
    if (!email || !password) return alert("Enter email and password");
    window.AppData.signUp(email, password);
  };
  return el;
}

// ============================================================
// TRIPS (shown when no active trip exists, or via nav)
// ============================================================
function renderTrips() {
  const el = document.createElement("div");
  el.className = "screen";
  el.innerHTML = `
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="color:#C9A96E;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
        <h2 class="serif-h2" style="margin:0;">Your trips</h2>
      </div>
      <button id="signout-btn" class="link-btn">Sign out</button>
    </div>
    <div id="trip-list" style="margin-top:16px;display:flex;flex-direction:column;gap:10px;"></div>
    <div class="divider" style="margin:22px 0;"><span>NEW TRIP</span></div>
    <label class="mini-label">Trip name</label>
    <input id="trip-name" class="input" placeholder="e.g. Niigata Sake Sourcing Trip" />
    <label class="mini-label" style="margin-top:12px">Destination country</label>
    <input id="trip-country" class="input" placeholder="e.g. Japan" />
    <div style="display:flex;gap:10px;margin-top:12px;">
      <div style="flex:1">
        <label class="mini-label">Start date</label>
        <input id="trip-start" type="date" class="input" />
      </div>
      <div style="flex:1">
        <label class="mini-label">End date</label>
        <input id="trip-end" type="date" class="input" />
      </div>
    </div>
    <button id="create-trip-btn" class="btn btn--primary" style="margin-top:18px;width:100%;">Create trip</button>
  `;

  const list = el.querySelector("#trip-list");
  state.trips.forEach((t) => {
    const card = document.createElement("div");
    card.className = "trip-card" + (t.is_active ? " trip-card--active" : "");
    card.innerHTML = `
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:14.5px;">${escapeHtml(t.trip_name)}</div>
        <div class="muted" style="font-size:12.5px;margin-top:2px;">${escapeHtml(t.destination_country || "")}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
        ${t.is_active
          ? '<span class="badge">Active</span>'
          : '<button class="btn btn--small trip-switch-btn">Switch</button>'}
        <button class="btn btn--small trip-delete-btn" style="background:#fee2e2;color:#dc2626;border-color:#fca5a5;">Delete</button>
      </div>
    `;
    // Clicking the card itself navigates to dashboard (active) or switches trip (inactive)
    card.style.cursor = "pointer";
    card.onclick = (e) => {
      if (e.target.closest("button")) return; // don't intercept button clicks
      if (t.is_active) {
        state.view = "dashboard";
        render();
      } else {
        window.AppData.setActiveTrip(t.id);
      }
    };
    if (!t.is_active) {
      card.querySelector(".trip-switch-btn").onclick = () => window.AppData.setActiveTrip(t.id);
    }
    card.querySelector(".trip-delete-btn").onclick = () => {
      if (confirm("Delete \"" + t.trip_name + "\"? This will also delete all its expenses.")) {
        window.AppData.deleteTrip(t.id);
      }
    };
    list.appendChild(card);
  });

  el.querySelector("#signout-btn").onclick = () => window.AppData.signOut();
  el.querySelector("#create-trip-btn").onclick = () => {
    const trip_name = el.querySelector("#trip-name").value.trim();
    const destination_country = el.querySelector("#trip-country").value.trim();
    const start_date = el.querySelector("#trip-start").value || null;
    const end_date = el.querySelector("#trip-end").value || null;
    if (!trip_name) return alert("Enter a trip name");
    window.AppData.createTrip({ trip_name, destination_country, start_date, end_date });
  };

  return el;
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const trip = state.activeTrip;
  const { totalSGD, businessSGD } = window.AppData.getTotals();
  const byCategory = window.AppData.getByCategory();
  const byCurrency = window.AppData.getByCurrency();

  const el = document.createElement("div");
  el.className = "screen";
  el.innerHTML = `
    <div class="eyebrow"><span class="pin">📍</span> ${escapeHtml(trip?.destination_country || "")}</div>
    <h1 class="serif-title">${escapeHtml(trip?.trip_name || "No active trip")}</h1>
    <div class="muted" style="font-size:13px;">${fmtDateRange(trip?.start_date, trip?.end_date)}</div>

    <div class="total-card">
      <div class="total-card__label">Total spent</div>
      <div class="total-card__amount">${formatSGD(totalSGD)}</div>
      <div class="total-card__meta">
        <span>${state.expenses.length} entries</span>
        ${businessSGD > 0 ? `<span class="gold">${formatSGD(businessSGD)} business</span>` : ""}
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-top:16px;">
      <button id="add-btn" class="btn btn--primary" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;">+ Add expense</button>
      <button id="summary-btn" class="btn btn--outline">📊 Summary</button>
      <button id="history-btn" class="btn btn--outline">History</button>
      <button id="rates-btn" class="btn btn--outline">💱 Rates</button>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px;">
      <button id="trips-btn" class="link-btn">Switch trip</button>
      <button id="settings-btn" class="link-btn">⚙ Settings</button>
      <button id="signout-btn" class="link-btn">Sign out</button>
    </div>

    <div class="section-label" style="margin-top:26px;">By category</div>
    <div id="cat-list" style="margin-top:10px;display:flex;flex-direction:column;gap:9px;"></div>

    <div class="section-label" style="margin-top:24px;">By currency</div>
    <div id="cur-list" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;"></div>
  `;

  const catList = el.querySelector("#cat-list");
  if (byCategory.length === 0) {
    catList.innerHTML = `<div class="muted" style="font-size:13px;padding:10px 0;">No expenses yet — tap + Add expense to start.</div>`;
  } else {
    const maxAmt = byCategory[0]?.amt || 1;
    byCategory.forEach(({ cat, amt, meta }) => {
      const row = document.createElement("div");
      row.className = "cat-row";
      row.innerHTML = `
        <div class="cat-row__emoji">${meta?.emoji || "📌"}</div>
        <div style="flex:1">
          <div class="cat-row__top"><span>${meta?.label || cat}</span><span class="num">${formatSGD(amt)}</span></div>
          <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100, (amt / maxAmt) * 100)}%"></div></div>
        </div>
      `;
      catList.appendChild(row);
    });
  }

  const curList = el.querySelector("#cur-list");
  const curEntries = Object.entries(byCurrency);
  if (curEntries.length === 0) {
    curList.innerHTML = `<div class="muted" style="font-size:13px;padding:10px 0;">Currency breakdown will appear after your first expense.</div>`;
  } else {
    curEntries.forEach(([code, v]) => {
      const row = document.createElement("div");
      row.className = "cur-row";
      row.innerHTML = `
        <div><span class="cur-code">${code}</span> <span class="num muted">${v.foreign.toLocaleString()} ${code}</span></div>
        <span class="num" style="font-weight:600;">${formatSGD(v.sgd)}</span>
      `;
      curList.appendChild(row);
    });
  }

  el.querySelector("#add-btn").onclick = () => { state.view = "add"; state.scanResult = null; render(); };
  el.querySelector("#summary-btn").onclick = () => { state.view = "summary"; render(); };
  el.querySelector("#history-btn").onclick = () => { state.view = "history"; render(); };
  el.querySelector("#rates-btn").onclick = () => { state.view = "rates"; render(); };
  el.querySelector("#trips-btn").onclick = () => { state.view = "trips"; render(); };
  el.querySelector("#settings-btn").onclick = () => { state.view = "settings"; render(); };
  el.querySelector("#signout-btn").onclick = () => window.AppData.signOut();

  el.appendChild(document.createElement("div")).className = "bottom-nav__spacer";
  el.appendChild(renderBottomNav("trips"));
  return el;
}

// ============================================================
// HISTORY
// ============================================================
function renderHistory() {
  let selectedId = null;

  const el = document.createElement("div");
  el.className = "screen";
  el.innerHTML = `
    <div class="topbar">
      <button id="back-btn" class="icon-btn">←</button>
      <h2 class="serif-h2">All expenses</h2>
      <span class="muted" style="font-size:12.5px;margin-left:auto;">Tap to select</span>
    </div>
    <div id="history-list" style="margin-top:18px;display:flex;flex-direction:column;gap:10px;"></div>
    <!-- Action bar (shown when row selected) -->
    <div id="action-bar" style="display:none;position:fixed;bottom:68px;left:50%;transform:translateX(-50%);
      width:calc(100% - 40px);max-width:420px;background:#1B2A4A;border-radius:16px;
      padding:12px 16px;display:none;align-items:center;justify-content:space-between;
      box-shadow:0 4px 20px rgba(0,0,0,0.25);z-index:99;">
      <span id="action-label" style="color:#C9A96E;font-size:13px;font-weight:600;"></span>
      <div style="display:flex;gap:10px;">
        <button id="action-edit" class="btn btn--small" style="background:#C9A96E;color:#1B2A4A;">✏️ Edit</button>
        <button id="action-delete" class="btn btn--small" style="background:#B5453F;color:#fff;">🗑 Delete</button>
        <button id="action-cancel" class="btn btn--small" style="background:#56607D;">✕</button>
      </div>
    </div>
  `;

  const list = el.querySelector("#history-list");
  const actionBar = el.querySelector("#action-bar");
  const actionLabel = el.querySelector("#action-label");

  function selectRow(id) {
    // Deselect all
    list.querySelectorAll(".history-row").forEach(r => r.classList.remove("history-row--selected"));
    if (selectedId === id) {
      // Tap again = deselect
      selectedId = null;
      actionBar.style.display = "none";
      return;
    }
    selectedId = id;
    const selected = state.expenses.find(e => e.id === id);
    // Highlight selected row
    list.querySelector(`[data-id="${id}"]`)?.classList.add("history-row--selected");
    actionLabel.textContent = escapeHtml(selected?.merchant_name || "Expense");
    actionBar.style.display = "flex";
  }

  state.expenses.forEach((e) => {
    const meta = CATEGORIES.find((c) => c.id === e.category);
    const row = document.createElement("div");
    row.className = "history-row";
    row.dataset.id = e.id;
    row.style.cursor = "pointer";
    row.innerHTML = `
      <div class="history-row__emoji">${meta?.emoji || "📌"}</div>
      <div style="flex:1">
        <div class="history-row__top">
          <span style="font-weight:600;">${escapeHtml(e.merchant_name || "Unnamed expense")}</span>
          <span class="num" style="font-weight:700;">${formatSGD(Number(e.home_amount))}</span>
        </div>
        <div class="muted" style="font-size:12.5px;margin-top:2px;">
          ${new Date(e.expense_date).toLocaleDateString("en-SG", { month: "short", day: "numeric" })}
          &nbsp;·&nbsp;<span class="num">${Number(e.foreign_amount).toLocaleString()} ${e.foreign_currency}</span>
          &nbsp;·&nbsp;<span class="num">${e.foreign_currency === "SGD" ? "" : "rate " + e.exchange_rate}</span>
          ${e.is_business_expense ? '&nbsp;·&nbsp;<span class="gold" style="font-weight:700;">Biz</span>' : ""}
        </div>
        ${e.description ? `<div class="muted" style="font-size:12.5px;margin-top:2px;">${escapeHtml(e.description)}</div>` : ""}
      </div>
      <div style="width:10px;height:10px;border-radius:50%;background:transparent;border:1.5px solid #E7DECC;flex-shrink:0;" class="row-dot"></div>
    `;
    row.onclick = () => selectRow(e.id);
    list.appendChild(row);
  });

  if (!state.expenses.length) {
    list.innerHTML = `<div class="muted" style="text-align:center;padding:40px 0;font-size:14px;">No expenses yet.<br>Tap + Add to get started.</div>`;
  }

  el.querySelector("#action-edit").onclick = () => {
    const exp = state.expenses.find(e => e.id === selectedId);
    if (!exp) return;
    state.editingExpense = exp;
    state.view = "add";
    render();
  };
  el.querySelector("#action-delete").onclick = () => {
    if (selectedId) window.AppData.deleteExpense(selectedId);
  };
  el.querySelector("#action-cancel").onclick = () => {
    selectedId = null;
    list.querySelectorAll(".history-row").forEach(r => r.classList.remove("history-row--selected"));
    actionBar.style.display = "none";
  };

  el.querySelector("#back-btn").onclick = () => { state.view = "dashboard"; render(); };
  const hSpacer = document.createElement("div"); hSpacer.className = "bottom-nav__spacer";
  el.appendChild(hSpacer);
  el.appendChild(renderBottomNav("history"));
  return el;
}

// ============================================================
// ADD EXPENSE
// ============================================================
function renderAddExpense() {
  const editing = state.editingExpense;
  const form = {
    merchant:     editing ? (editing.merchant_name || "") : (state.scanResult?.merchant || ""),
    category:     editing ? editing.category : (state.scanResult?.category_guess || "food"),
    foreignAmount:editing ? String(editing.foreign_amount) : (state.scanResult?.amount ? String(state.scanResult.amount) : ""),
    currency:     editing ? editing.foreign_currency : (state.scanResult?.currency || "JPY"),
    rate:         editing ? String(editing.exchange_rate) : "",
    business:     editing ? !!editing.is_business_expense : false,
    notes:        editing ? (editing.description || "") : "",
    date:         editing ? editing.expense_date : (state.scanResult?.date || new Date().toISOString().slice(0, 10)),
    paymentMethod:editing ? (editing.payment_method || "") : "",
    ocrRawText:   editing ? "" : (state.scanResult?.raw_text || ""),
    receiptUrl:   editing ? (editing.receipt_image_url || null) : null,
  };
  if (!editing && state.lastRates[form.currency]) form.rate = String(state.lastRates[form.currency]);

  const el = document.createElement("div");
  el.className = "screen";
  el.innerHTML = `
    <div class="topbar">
      <button id="back-btn" class="icon-btn">←</button>
      <h2 class="serif-h2">Add expense</h2>
    </div>

    <input type="file" id="receipt-input" accept="image/*" capture="environment" style="display:none" />
    <button id="scan-btn" class="btn btn--dark" style="margin-top:18px;width:100%;display:flex;align-items:center;justify-content:center;gap:9px;">
      📷 ${state.scanning ? "Reading receipt…" : "Scan receipt with AI"}
    </button>
    ${state.scanResult && !state.scanning ? `<div class="scan-success">✓ Filled from receipt — review before saving</div>` : ""}

    <div class="divider" style="margin:20px 0;"><span>OR ENTER MANUALLY</span></div>

    <label class="mini-label">Merchant / description</label>
    <input id="f-merchant" class="input" placeholder="e.g. Hakkaisan Brewery" value="${escapeAttr(form.merchant)}" />

    <label class="mini-label" style="margin-top:16px;">Category</label>
    <div id="cat-picker" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:5px;"></div>

    <div class="conversion-ticket">
      <div class="ticket-label">Currency conversion</div>
      <div style="display:flex;gap:10px;">
        <div style="flex:1">
          <label class="mini-label">Amount paid</label>
          <input id="f-amount" type="number" inputmode="decimal" class="input" placeholder="0" value="${escapeAttr(form.foreignAmount)}" />
        </div>
        <div style="width:92px;">
          <label class="mini-label">Currency</label>
          <select id="f-currency" class="input">
            ${CURRENCY_PRESETS.map((c) => `<option value="${c}" ${c === form.currency ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="ticket-arrow">↓</div>
      <label class="mini-label" id="rate-label">Exchange rate</label>
      <input id="f-rate" type="number" inputmode="decimal" step="0.0001" class="input" placeholder="1 ${form.currency} = ? SGD" value="${escapeAttr(form.rate)}" />
      <div class="ticket-result">
        <span>= SGD amount</span>
        <span id="ticket-computed" class="serif-amount">—</span>
      </div>
    </div>

    <label class="mini-label" style="margin-top:16px;">Date</label>
    <input id="f-date" type="date" class="input" value="${form.date}" />

    <button id="business-toggle" class="business-toggle">
      <span class="checkbox"></span>
      <span>Tag as Business (RYU)</span>
    </button>

    <label class="mini-label" style="margin-top:14px;">Notes (optional)</label>
    <textarea id="f-notes" class="input" rows="2" placeholder="Any context worth remembering"></textarea>

    <button id="save-btn" class="btn btn--primary" style="margin-top:22px;margin-bottom:30px;width:100%;" disabled>Save expense</button>
  `;

  // Category picker
  const catPicker = el.querySelector("#cat-picker");
  let selectedCategory = form.category;
  CATEGORIES.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "cat-pill" + (c.id === selectedCategory ? " cat-pill--active" : "");
    btn.innerHTML = `${c.emoji} ${c.label}`;
    btn.onclick = () => {
      selectedCategory = c.id;
      catPicker.querySelectorAll(".cat-pill").forEach((b) => b.classList.remove("cat-pill--active"));
      btn.classList.add("cat-pill--active");
    };
    catPicker.appendChild(btn);
  });

  let businessTagged = false;
  let pendingPhotoFile = null;

  const amountInput = el.querySelector("#f-amount");
  const rateInput = el.querySelector("#f-rate");
  const currencySelect = el.querySelector("#f-currency");
  const computedEl = el.querySelector("#ticket-computed");
  const saveBtn = el.querySelector("#save-btn");
  if (editing) saveBtn.textContent = "Save changes";
  const rateLabel = el.querySelector("#rate-label");

  function updateComputed() {
    const amt = parseFloat(amountInput.value);
    const rate = parseFloat(rateInput.value);
    if (amt && rate) {
      computedEl.textContent = formatSGD(Math.round(amt * rate * 100) / 100);
      saveBtn.disabled = false;
    } else {
      computedEl.textContent = "—";
      saveBtn.disabled = true;
    }
  }
  amountInput.oninput = updateComputed;
  rateInput.oninput = updateComputed;
  currencySelect.onchange = () => {
    const cur = currencySelect.value;
    rateInput.placeholder = `1 ${cur} = ? SGD`;
    if (state.lastRates[cur]) {
      rateInput.value = state.lastRates[cur];
      rateLabel.textContent = `Exchange rate (last used: ${state.lastRates[cur]})`;
    } else {
      rateLabel.textContent = "Exchange rate";
    }
    updateComputed();
  };
  if (form.rate) updateComputed();
  if (state.lastRates[form.currency]) rateLabel.textContent = `Exchange rate (last used: ${state.lastRates[form.currency]})`;

  el.querySelector("#business-toggle").onclick = (e) => {
    businessTagged = !businessTagged;
    e.currentTarget.classList.toggle("business-toggle--active", businessTagged);
  };

  const fileInput = el.querySelector("#receipt-input");
  el.querySelector("#scan-btn").onclick = () => fileInput.click();
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingPhotoFile = file;
    await window.AppData.scanReceipt(file);
    // render() is called inside scanReceipt; renderAddExpense will be re-invoked with scanResult populated
  };

  el.querySelector("#back-btn").onclick = () => { state.editingExpense = null; state.view = editing ? "history" : "dashboard"; render(); };

  saveBtn.onclick = () => {
    const payload = {
      merchant: el.querySelector("#f-merchant").value.trim(),
      category: selectedCategory,
      foreignAmount: amountInput.value,
      currency: currencySelect.value,
      rate: rateInput.value,
      business: businessTagged,
      notes: el.querySelector("#f-notes").value.trim(),
      date: el.querySelector("#f-date").value,
      ocrRawText: form.ocrRawText,
      receiptUrl: form.receiptUrl,
    };
    if (editing) {
      window.AppData.updateExpense(editing.id, payload);
    } else {
      window.AppData.saveExpense(payload);
    }
  };

  return el;
}

// ============================================================
// RATES — set fixed exchange rates for the whole trip
// ============================================================
const CURRENCY_FLAGS = {
  JPY: "🇯🇵", USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧",
  THB: "🇹🇭", KRW: "🇰🇷", AUD: "🇦🇺", SGD: "🇸🇬",
};

const CURRENCY_NAMES = {
  JPY: "Japanese Yen", USD: "US Dollar", EUR: "Euro", GBP: "British Pound",
  THB: "Thai Baht", KRW: "Korean Won", AUD: "Australian Dollar", SGD: "Singapore Dollar",
};

function makeCurrencyOptions(selected) {
  return ["JPY","USD","EUR","GBP","THB","KRW","AUD"].map(c =>
    `<option value="${c}" ${c === selected ? "selected" : ""}>${CURRENCY_FLAGS[c] || ""} ${c} – ${CURRENCY_NAMES[c] || c}</option>`
  ).join("");
}

function renderRates() {
  const el = document.createElement("div");
  el.className = "screen";

  const FLAGS = {JPY:"🇯🇵", USD:"🇺🇸", EUR:"🇪🇺",
    GBP:"🇬🇧", THB:"🇹🇭", KRW:"🇰🇷",
    AUD:"🇦🇺", TWD:"🇹🇼", MYR:"🇲🇾"
  };
  const NAMES = {
    JPY:"Japanese Yen", USD:"US Dollar", EUR:"Euro",
    GBP:"British Pound", THB:"Thai Baht", KRW:"Korean Won",
    AUD:"Australian Dollar", TWD:"Taiwan Dollar", MYR:"Malaysian Ringgit"
  };

  el.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="rates-back">&#8592;</button>
      <div>
        <div class="eyebrow">Trip Rates</div>
        <h2 class="serif-h2">${state.activeTrip ? escapeHtml(state.activeTrip.trip_name) : "Set Rates"}</h2>
      </div>
    </div>
    <p style="font-size:13px;color:#8A7B5C;margin:14px 0 18px;">
      Enter the SGD value of 1 unit of each currency. Leave blank to skip.
    </p>
    <div id="rate-rows" style="display:flex;flex-direction:column;gap:10px;"></div>
    <button class="btn btn--primary" id="rc-save-btn" style="width:100%;margin-top:22px;">Save Rates</button>
  `;

  const container = el.querySelector("#rate-rows");
  CURRENCY_PRESETS.forEach(cur => {
    const saved = state.tripRates[cur];
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:10px;background:#FFFDF8;border:1px solid #E7DECC;border-radius:12px;padding:12px 14px;";
    const flag = FLAGS[cur] || "";
    const name = NAMES[cur] || "";
    const val  = saved != null ? saved : "";
    row.innerHTML =
      "<span style=\"font-size:22px;line-height:1;\">" + flag + "</span>" +
      "<div style=\"flex:1;min-width:0;\">" +
        "<div style=\"font-weight:700;font-size:13px;color:#1B2A4A;\">" + cur + "</div>" +
        "<div style=\"font-size:11px;color:#8A7B5C;\">" + name + "</div>" +
      "</div>" +
      "<div style=\"display:flex;align-items:center;gap:6px;\">" +
        "<input data-from=\"" + cur + "\" type=\"number\" min=\"0.01\" step=\"any\" class=\"input from-input\"" +
          " value=\"1\" placeholder=\"1\"" +
          " style=\"width:60px;padding:8px 8px;text-align:right;font-size:14px;margin:0;\" />" +
        "<span style=\"font-size:12px;color:#8A7B5C;white-space:nowrap;\">" + cur + " =</span>" +
        "<input data-cur=\"" + cur + "\" type=\"number\" min=\"0\" step=\"any\" class=\"input rate-input\"" +
          " value=\"" + val + "\" placeholder=\"0.00\"" +
          " style=\"width:80px;padding:8px 8px;text-align:right;font-size:14px;margin:0;\" />" +
        "<span style=\"font-size:12px;color:#8A7B5C;\">SGD</span>" +
      "</div>";
    container.appendChild(row);
  });

  el.querySelector("#rc-save-btn").onclick = function() {
    var rates = {};
    el.querySelectorAll(".rate-input").forEach(function(inp) {
      var sgd  = parseFloat(inp.value);
      var from = parseFloat(el.querySelector(".from-input[data-from=\"" + inp.dataset.cur + "\"]").value) || 1;
      if (sgd > 0) rates[inp.dataset.cur] = sgd / from;
    });
    if (!Object.keys(rates).length) { alert("Enter at least one rate."); return; }
    window.AppData.saveTripRates(rates);
  };

  el.querySelector("#rates-back").onclick = function() { state.view = "dashboard"; render(); };

  var spacer = document.createElement("div");
  spacer.className = "bottom-nav__spacer";
  el.appendChild(spacer);
  el.appendChild(renderBottomNav("rates"));
  return el;
}

// ============================================================
// TRIP SUMMARY
// ============================================================
function renderSummary() {
  const { getTotals, getByCategory, getByCurrency, formatSGD } = window.AppData;
  const { totalSGD, businessSGD } = getTotals();
  const personalSGD = totalSGD - businessSGD;
  const byCategory  = getByCategory();
  const byCurrency  = getByCurrency();
  const trip = state.activeTrip;
  const count = state.expenses.length;

  // Daily average
  let days = 0;
  if (trip && trip.start_date && trip.end_date) {
    days = Math.max(1, Math.round((new Date(trip.end_date) - new Date(trip.start_date)) / 86400000) + 1);
  }
  const dailyAvg = days > 0 ? totalSGD / days : 0;

  const el = document.createElement("div");
  el.className = "screen";
  el.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="summary-back">&#8592;</button>
      <div>
        <div class="eyebrow">Trip Summary</div>
        <h2 class="serif-h2" style="margin:0;">${escapeHtml(trip ? trip.trip_name : "")}</h2>
      </div>
    </div>

    <!-- Hero total -->
    <div style="background:linear-gradient(135deg,#1B2A4A 0%,#2C4270 100%);border-radius:20px;padding:28px 24px;margin-top:18px;text-align:center;color:#fff;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;color:#C9A96E;margin-bottom:8px;">TOTAL SPENT</div>
      <div style="font-family:'Newsreader',serif;font-size:42px;font-weight:600;letter-spacing:-0.01em;">${formatSGD(totalSGD)}</div>
      <div style="font-size:13px;color:#8A9BBF;margin-top:8px;">${count} expense${count !== 1 ? "s" : ""}${days > 0 ? " &nbsp;·&nbsp; " + days + " days" : ""}</div>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:1fr 1fr${dailyAvg > 0 ? " 1fr" : ""};gap:10px;margin-top:12px;">
      <div style="background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;padding:14px;text-align:center;">
        <div style="font-size:11px;color:#8A7B5C;font-weight:700;letter-spacing:0.06em;margin-bottom:6px;">PERSONAL</div>
        <div style="font-family:'Newsreader',serif;font-size:18px;font-weight:600;color:#1B2A4A;">${formatSGD(personalSGD)}</div>
      </div>
      <div style="background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;padding:14px;text-align:center;">
        <div style="font-size:11px;color:#8A7B5C;font-weight:700;letter-spacing:0.06em;margin-bottom:6px;">BUSINESS</div>
        <div style="font-family:'Newsreader',serif;font-size:18px;font-weight:600;color:#1B2A4A;">${formatSGD(businessSGD)}</div>
      </div>
      ${dailyAvg > 0 ? `
      <div style="background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;padding:14px;text-align:center;">
        <div style="font-size:11px;color:#8A7B5C;font-weight:700;letter-spacing:0.06em;margin-bottom:6px;">PER DAY</div>
        <div style="font-family:'Newsreader',serif;font-size:18px;font-weight:600;color:#1B2A4A;">${formatSGD(dailyAvg)}</div>
      </div>` : ""}
    </div>

    <!-- By Category -->
    <div class="section-label" style="margin-top:26px;margin-bottom:10px;">By Category</div>
    <div id="sum-cat-list" style="display:flex;flex-direction:column;gap:8px;"></div>

    <!-- By Currency -->
    <div class="section-label" style="margin-top:24px;margin-bottom:10px;">By Currency</div>
    <div id="sum-cur-list" style="display:flex;flex-direction:column;gap:8px;"></div>
  `;

  // Category rows
  const catList = el.querySelector("#sum-cat-list");
  if (!byCategory.length) {
    catList.innerHTML = '<div class="muted" style="font-size:13px;padding:8px 0;">No expenses yet.</div>';
  } else {
    const max = byCategory[0].amt;
    byCategory.forEach(({ cat, amt, meta }) => {
      const pct = totalSGD > 0 ? Math.round((amt / totalSGD) * 100) : 0;
      const row = document.createElement("div");
      row.style.cssText = "background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;padding:14px 16px;";
      row.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:20px;">' + (meta ? meta.emoji : '📌') + '</span>' +
            '<span style="font-weight:600;font-size:14px;color:#1B2A4A;">' + (meta ? meta.label : cat) + '</span>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<span style="font-weight:700;font-size:14px;color:#1B2A4A;">' + formatSGD(amt) + '</span>' +
            '<span style="font-size:11px;color:#C9A96E;margin-left:6px;font-weight:700;">' + pct + '%</span>' +
          '</div>' +
        '</div>' +
        '<div style="background:#E7DECC;border-radius:99px;height:6px;">' +
          '<div style="background:#C9A96E;border-radius:99px;height:6px;width:' + Math.min(100, (amt/max)*100) + '%;transition:width 0.4s;"></div>' +
        '</div>';
      catList.appendChild(row);
    });
  }

  // Currency rows
  const curList = el.querySelector("#sum-cur-list");
  const curEntries = Object.entries(byCurrency);
  if (!curEntries.length) {
    curList.innerHTML = '<div class="muted" style="font-size:13px;padding:8px 0;">No currency data yet.</div>';
  } else {
    curEntries.sort((a, b) => b[1].sgd - a[1].sgd).forEach(([code, v]) => {
      const pct = totalSGD > 0 ? Math.round((v.sgd / totalSGD) * 100) : 0;
      const row = document.createElement("div");
      row.style.cssText = "background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;";
      row.innerHTML =
        '<div>' +
          '<div style="font-weight:700;font-size:14px;color:#1B2A4A;">' + code + '</div>' +
          '<div style="font-size:12px;color:#8A7B5C;margin-top:2px;">' + v.foreign.toLocaleString() + ' ' + code + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-weight:700;font-size:14px;color:#1B2A4A;">' + formatSGD(v.sgd) + '</div>' +
          '<div style="font-size:11px;color:#C9A96E;font-weight:700;">' + pct + '%</div>' +
        '</div>';
      curList.appendChild(row);
    });
  }

  el.querySelector("#summary-back").onclick = () => { state.view = "dashboard"; render(); };
  var spacer = document.createElement("div");
  spacer.className = "bottom-nav__spacer";
  el.appendChild(spacer);
  el.appendChild(renderBottomNav("summary"));
  return el;
}


// ============================================================
// SETTINGS
// ============================================================
function renderSettings() {
  const { state, signOut, exportCSV, installApp } = window.AppData;

  const el = document.createElement("div");
  el.className = "screen";
  el.innerHTML = `
    <div class="topbar" style="margin-bottom:24px;">
      <button class="icon-btn" id="settings-back">←</button>
      <div>
        <div class="eyebrow">App</div>
        <h2 class="serif-h2">Settings</h2>
      </div>
    </div>

    <!-- Your Account -->
    <div class="section-label" style="margin-bottom:10px;">Your Account</div>
    <div style="background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;padding:14px 16px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:#1B2A4A;display:flex;align-items:center;justify-content:center;color:#C9A96E;font-weight:700;font-size:15px;">
          ${escapeHtml((state.user?.email?.[0] || "?").toUpperCase())}
        </div>
        <div>
          <div style="font-weight:600;font-size:14px;">${escapeHtml(state.user?.email || "")}</div>
          <div class="muted" style="font-size:12px;">Signed in</div>
        </div>
      </div>
      <button id="s-signout" class="btn btn--outline" style="width:100%;font-size:13.5px;padding:10px;">Sign out</button>
    </div>

    <!-- Data & App -->
    <div class="section-label" style="margin-bottom:10px;">Data & App</div>
    <div style="background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;overflow:hidden;margin-bottom:20px;">

      <div class="settings-row" id="s-export">
        <div class="settings-row__icon">📊</div>
        <div class="settings-row__body">
          <div class="settings-row__title">Export CSV</div>
          <div class="settings-row__sub">Download all expenses as a spreadsheet</div>
        </div>
        <div class="settings-row__action">↓</div>
      </div>

      <div style="height:1px;background:#E7DECC;margin:0 16px;"></div>

      <div class="settings-row" id="s-install">
        <div class="settings-row__icon">📲</div>
        <div class="settings-row__body">
          <div class="settings-row__title">Install App</div>
          <div class="settings-row__sub">Add to home screen for offline use</div>
        </div>
        <div class="settings-row__action">→</div>
      </div>
    </div>

    <!-- Trip -->
    <div class="section-label" style="margin-bottom:10px;">Trip</div>
    <div style="background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;overflow:hidden;margin-bottom:20px;">
      <div class="settings-row" id="s-rates">
        <div class="settings-row__icon">💱</div>
        <div class="settings-row__body">
          <div class="settings-row__title">Exchange Rates</div>
          <div class="settings-row__sub">Set fixed rates for ${escapeHtml(state.activeTrip?.trip_name || "this trip")}</div>
        </div>
        <div class="settings-row__action">→</div>
      </div>
      <div style="height:1px;background:#E7DECC;margin:0 16px;"></div>
      <div class="settings-row" id="s-trips">
        <div class="settings-row__icon">✈️</div>
        <div class="settings-row__body">
          <div class="settings-row__title">Manage Trips</div>
          <div class="settings-row__sub">Switch or create a new trip</div>
        </div>
        <div class="settings-row__action">→</div>
      </div>
    </div>

    <!-- About -->
    <div class="section-label" style="margin-bottom:10px;">About</div>
    <div style="background:#FFFDF8;border:1px solid #E7DECC;border-radius:14px;padding:16px;margin-bottom:8px;text-align:center;">
      <div style="font-family:'Newsreader',serif;font-size:22px;font-weight:600;color:#1B2A4A;margin-bottom:2px;">RYU Travel Expenses</div>
      <div style="font-size:12px;color:#C9A96E;font-weight:700;letter-spacing:0.07em;margin-bottom:8px;">RYU SAKE JOURNAL® · 酒の旅</div>
      <div class="muted" style="font-size:12.5px;">Version 1.0 · Built by Cheong Wai Lung</div>
      <div class="muted" style="font-size:12px;margin-top:4px;">Singapore · Travel Expense Tracker</div>
    </div>
  `;

  el.querySelector("#settings-back").onclick = () => { state.view = "dashboard"; render(); };
  el.querySelector("#s-signout").onclick = () => window.AppData.signOut();
  el.querySelector("#s-export").onclick = () => window.AppData.exportCSV();
  el.querySelector("#s-install").onclick = () => window.AppData.installApp();
  el.querySelector("#s-trips").onclick = () => { state.view = "trips"; render(); };

  el.appendChild(renderBottomNav("settings"));
  return el;
}

// ============================================================
// RENDER ROUTER
// ============================================================
function render() {
  const root = document.getElementById("app-root");
  if (!root) return;
  root.innerHTML = "";
  if (!state.user) { root.appendChild(renderLogin()); return; }
  switch (state.view) {
    case "trips":    root.appendChild(renderTrips());      break;
    case "add":      root.appendChild(renderAddExpense()); break;
    case "history":  root.appendChild(renderHistory());    break;
    case "rates":    root.appendChild(renderRates());      break;
    case "settings": root.appendChild(renderSettings());   break;
    case "summary":  root.appendChild(renderSummary());    break;
    default:         root.appendChild(renderDashboard());
  }
}

window.render = render;
