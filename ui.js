// ============================================================
// ui.js — Rendering layer for Travel Expense Tracker
// Plain DOM rendering (no framework) so this deploys as static files
// on GitHub Pages with zero build step.
// ============================================================

// state, formatSGD, CATEGORIES, CURRENCY_PRESETS are already global from app.js

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
    default:
      root.appendChild(renderDashboard());
  }
}
window.render = render; // app.js calls this after state changes

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
      <h2 class="serif-h2">Your trips</h2>
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
      <div>
        <div style="font-weight:600;font-size:14.5px;">${escapeHtml(t.trip_name)}</div>
        <div class="muted" style="font-size:12.5px;margin-top:2px;">${escapeHtml(t.destination_country || "")}</div>
      </div>
      ${t.is_active ? '<span class="badge">Active</span>' : '<button class="btn btn--small">Switch</button>'}
    `;
    if (!t.is_active) {
      card.querySelector("button").onclick = () => window.AppData.setActiveTrip(t.id);
    }
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
      <button id="history-btn" class="btn btn--outline">History</button>
      <button id="rates-btn" class="btn btn--outline">💱 Rates</button>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px;">
      <button id="trips-btn" class="link-btn">Switch trip</button>
      <button id="signout-btn" class="link-btn">Sign out</button>
    </div>

    <div class="section-label" style="margin-top:26px;">By category</div>
    <div id="cat-list" style="margin-top:10px;display:flex;flex-direction:column;gap:9px;"></div>

    <div class="section-label" style="margin-top:24px;">By currency</div>
    <div id="cur-list" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;"></div>
  `;

  const catList = el.querySelector("#cat-list");
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

  const curList = el.querySelector("#cur-list");
  Object.entries(byCurrency).forEach(([code, v]) => {
    const row = document.createElement("div");
    row.className = "cur-row";
    row.innerHTML = `
      <div><span class="cur-code">${code}</span> <span class="num muted">${v.foreign.toLocaleString()} ${code}</span></div>
      <span class="num" style="font-weight:600;">${formatSGD(v.sgd)}</span>
    `;
    curList.appendChild(row);
  });

  el.querySelector("#add-btn").onclick = () => { state.view = "add"; state.scanResult = null; render(); };
  el.querySelector("#history-btn").onclick = () => { state.view = "history"; render(); };
  el.querySelector("#rates-btn").onclick = () => { state.view = "rates"; render(); };
  el.querySelector("#trips-btn").onclick = () => { state.view = "trips"; render(); };
  el.querySelector("#signout-btn").onclick = () => window.AppData.signOut();

  return el;
}

// ============================================================
// HISTORY
// ============================================================
function renderHistory() {
  const el = document.createElement("div");
  el.className = "screen";
  el.innerHTML = `
    <div class="topbar">
      <button id="back-btn" class="icon-btn">←</button>
      <h2 class="serif-h2">All expenses</h2>
    </div>
    <div id="history-list" style="margin-top:18px;display:flex;flex-direction:column;gap:10px;"></div>
  `;
  const list = el.querySelector("#history-list");
  state.expenses.forEach((e) => {
    const meta = CATEGORIES.find((c) => c.id === e.category);
    const row = document.createElement("div");
    row.className = "history-row";
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
          &nbsp;·&nbsp;rate <span class="num">${e.exchange_rate}</span>
          ${e.is_business_expense ? '&nbsp;·&nbsp;<span class="gold" style="font-weight:700;">Business</span>' : ""}
        </div>
        ${e.description ? `<div class="muted" style="font-size:12.5px;margin-top:3px;">${escapeHtml(e.description)}</div>` : ""}
        <button class="link-btn link-btn--danger" data-id="${e.id}" style="margin-top:4px;">Delete</button>
      </div>
    `;
    row.querySelector("button").onclick = () => window.AppData.deleteExpense(e.id);
    list.appendChild(row);
  });
  el.querySelector("#back-btn").onclick = () => { state.view = "dashboard"; render(); };
  return el;
}

// ============================================================
// ADD EXPENSE
// ============================================================
function renderAddExpense() {
  const form = {
    merchant: state.scanResult?.merchant || "",
    category: state.scanResult?.category_guess || "food",
    foreignAmount: state.scanResult?.amount ? String(state.scanResult.amount) : "",
    currency: state.scanResult?.currency || "JPY",
    rate: "",
    business: false,
    notes: "",
    date: state.scanResult?.date || new Date().toISOString().slice(0, 10),
    paymentMethod: "",
    ocrRawText: state.scanResult?.raw_text || "",
  };
  if (state.lastRates[form.currency]) form.rate = String(state.lastRates[form.currency]);

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

  el.querySelector("#back-btn").onclick = () => { state.view = "dashboard"; render(); };

  saveBtn.onclick = () => {
    window.AppData.saveExpense({
      merchant: el.querySelector("#f-merchant").value.trim(),
      category: selectedCategory,
      foreignAmount: amountInput.value,
      currency: currencySelect.value,
      rate: rateInput.value,
      business: businessTagged,
      notes: el.querySelector("#f-notes").value.trim(),
      date: el.querySelector("#f-date").value,
      ocrRawText: form.ocrRawText,
    });
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
  const { state, formatSGD, saveTripRates } = window.AppData;
  const saved = Object.keys(state.tripRates);
  const firstCur = saved[0] || "JPY";
  const savedRate = state.tripRates[firstCur] != null ? state.tripRates[firstCur] : null;

  const el = document.createElement("div");
  el.className = "screen";
  el.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="rates-back">←</button>
      <div>
        <div class="eyebrow">\u{1F4B1} Trip Rates</div>
        <h2 class="serif-h2">${state.activeTrip ? state.activeTrip.trip_name : "Set Rates"}</h2>
      </div>
    </div>

    <p style="font-size:13px;color:#8A7B5C;margin:14px 0 18px;">
      Set fixed exchange rates for this trip. These auto-fill when you add expenses.
    </p>

    <!-- Converter card -->
    <div class="rconv" id="rconv-card">
      <div class="rconv__panel rconv__panel--from">
        <div class="rconv__cap">From</div>
        <div class="rconv__body">
          <input class="rconv__amount-input" id="rc-from-amt" type="number" min="0" step="any" value="1" placeholder="100" />
          <div class="rconv__cur-wrap">
            <span class="rconv__flag" id="rc-flag">&#x1F1EF;&#x1F1F5;</span>
            <select class="rconv__select" id="rc-cur">
              ${makeCurrencyOptions(firstCur)}
            </select>
          </div>
        </div>
        <div class="rconv__preview" id="rc-preview"></div>
      </div>

      <div class="rconv__swap">⇄</div>

      <div class="rconv__panel">
        <div class="rconv__cap">To (SGD)</div>
        <div class="rconv__body">
          <input class="rconv__rate-input" id="rc-to-amt" type="number" min="0" step="any"
            value="${savedRate != null ? savedRate : ""}" placeholder="0.0089" />
          <div class="rconv__cur-wrap">
            <span class="rconv__flag">&#x1F1F8;&#x1F1EC;</span>
            <span class="rconv__sgd-label">SGD</span>
          </div>
        </div>
      </div>
    </div>

    <button class="btn btn--primary" id="rc-save-btn" style="width:100%;margin-top:18px;">Save Rate</button>

    ${saved.length ? `
    <div style="margin-top:28px;">
      <div class="section-label" style="margin-bottom:10px;">Saved Rates</div>
      ${Object.entries(state.tripRates).map(([cur, rate]) => `
        <div class="cur-row" style="margin-bottom:8px;">
          <span class="rconv__flag">${CURRENCY_FLAGS[cur] || ""}</span>
          <span class="cur-code" style="margin-left:6px;">${cur}</span>
          <span style="color:#8A7B5C;font-size:12.5px;margin-left:4px;">${CURRENCY_NAMES[cur] || ""}</span>
          <span style="margin-left:auto;font-family:'Newsreader',serif;font-size:15px;font-weight:600;color:#1B2A4A;">
            1 ${cur} = ${formatSGD(rate)}
          </span>
        </div>
      `).join("")}
    </div>
    ` : ""}
  `;

  // Wire currency select — auto-fill saved rate when switching currency
  const curSelect = el.querySelector("#rc-cur");
  const fromAmt   = el.querySelector("#rc-from-amt");
  const toAmt     = el.querySelector("#rc-to-amt");
  const flagSpan  = el.querySelector("#rc-flag");
  const preview   = el.querySelector("#rc-preview");

  function updateFlag() {
    const cur = curSelect.value;
    const flagMap = { JPY:"\u{1F1EF}\u{1F1F5}", USD:"\u{1F1FA}\u{1F1F8}", EUR:"\u{1F1EA}\u{1F1FA}", GBP:"\u{1F1EC}\u{1F1E7}", THB:"\u{1F1F9}\u{1F1ED}", KRW:"\u{1F1F0}\u{1F1F7}", AUD:"\u{1F1E6}\u{1F1FA}" };
    flagSpan.textContent = flagMap[cur] || "";
  }

  function updatePreview() {
    const from = parseFloat(fromAmt.value) || 0;
    const to   = parseFloat(toAmt.value)   || 0;
    if (!from || !to) { preview.textContent = ""; return; }
    const rate = to / from;
    const big  = 1000;
    preview.textContent = `1 ${curSelect.value} = ${formatSGD(rate)} · ${big.toLocaleString()} ${curSelect.value} = ${formatSGD(rate * big)}`;
  }

  curSelect.addEventListener("change", () => {
    updateFlag();
    const cur = curSelect.value;
    const saved = state.tripRates[cur];
    if (saved != null) {
      fromAmt.value = "1";
      toAmt.value   = String(saved);
    } else {
      toAmt.value = "";
    }
    updatePreview();
  });

  fromAmt.addEventListener("input", updatePreview);
  toAmt.addEventListener("input",   updatePreview);

  updateFlag();
  updatePreview();

  el.querySelector("#rc-save-btn").onclick = () => {
    const from = parseFloat(fromAmt.value);
    const to   = parseFloat(toAmt.value);
    if (!from || !to) { alert("Enter both amounts."); return; }
    const rate = to / from; // normalise to per-1 foreign unit
    const rates = {};
    rates[curSelect.value] = rate;
    window.AppData.saveTripRates(rates);
  };

  el.querySelector("#rates-back").onclick = () => { state.view = "dashboard"; render(); };

  return el;
}
