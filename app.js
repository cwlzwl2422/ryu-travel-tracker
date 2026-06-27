// ============================================================
// app.js — Travel Expense Tracker
// Real Supabase-backed logic. Requires config.js loaded first,
// and the Supabase JS client loaded via CDN in index.html.
// ============================================================

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORIES = [
  { id: "food", label: "Food", emoji: "🍜" },
  { id: "transport", label: "Transport", emoji: "🚕" },
  { id: "accommodation", label: "Accommodation", emoji: "🏨" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "sake_business", label: "Sake / Business", emoji: "🍶" },
  { id: "activities", label: "Activities", emoji: "🎫" },
  { id: "other", label: "Other", emoji: "📌" },
];

const CURRENCY_PRESETS = ["JPY", "USD", "EUR", "GBP", "THB", "KRW", "AUD"];

let state = {
  user: null,
  trips: [],
  activeTrip: null,
  expenses: [],
  lastRates: {}, // { JPY: 0.0089, ... } — most recently used rate per currency, this session
  tripRates: {}, // { JPY: 0.0089, ... } — fixed rates saved for the whole trip
  view: "login", // login | dashboard | add | history | trips | rates
  scanning: false,
  scanResult: null,
  pendingPhotoFile: null,
};

// ============================================================
// AUTH
// ============================================================
async function init() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    state.user = data.session.user;
    await loadTrips();
  } else {
    state.view = "login";
  }
  render();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    state.user = session?.user || null;
    if (!state.user) {
      state.view = "login";
      render();
    }
  });
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Sign in failed: " + error.message);
    return;
  }
  state.user = data.user;
  await loadTrips();
  render();
}

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    alert("Sign up failed: " + error.message);
    return;
  }
  alert("Account created. If email confirmation is enabled in your Supabase project, check your inbox before signing in.");
}

async function signOut() {
  await supabaseClient.auth.signOut();
  state.user = null;
  state.trips = [];
  state.activeTrip = null;
  state.expenses = [];
  state.view = "login";
  render();
}

// ============================================================
// TRIPS
// ============================================================
async function loadTrips() {
  const { data, error } = await supabaseClient
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  state.trips = data || [];
  state.activeTrip = state.trips.find((t) => t.is_active) || state.trips[0] || null;
  if (state.activeTrip) {
    await loadTripRates(state.activeTrip.id);
    await loadExpenses(state.activeTrip.id);
    state.view = "dashboard";
  } else {
    state.view = "trips"; // no trips yet — prompt to create one
  }
}

async function createTrip({ trip_name, destination_country, start_date, end_date }) {
  // Deactivate any currently active trip first, so only one is "active"
  if (state.trips.some((t) => t.is_active)) {
    await supabaseClient.from("trips").update({ is_active: false }).eq("user_id", state.user.id).eq("is_active", true);
  }
  const { data, error } = await supabaseClient
    .from("trips")
    .insert({
      user_id: state.user.id,
      trip_name,
      destination_country,
      start_date,
      end_date,
      is_active: true,
    })
    .select()
    .single();
  if (error) {
    alert("Could not create trip: " + error.message);
    return;
  }
  await loadTrips();
}

async function setActiveTrip(tripId) {
  await supabaseClient.from("trips").update({ is_active: false }).eq("user_id", state.user.id);
  await supabaseClient.from("trips").update({ is_active: true }).eq("id", tripId);
  await loadTrips();
}

// ============================================================
// TRIP RATES — fixed exchange rates set once for the whole trip
// ============================================================
async function loadTripRates(tripId) {
  const { data } = await supabaseClient
    .from("exchange_rates")
    .select("currency_code, rate_to_home")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (data) {
    const rates = {};
    for (const r of data) {
      if (!(r.currency_code in rates)) rates[r.currency_code] = Number(r.rate_to_home);
    }
    state.tripRates = rates;
    // Merge into lastRates so Add Expense auto-fills with these rates
    state.lastRates = { ...rates, ...state.lastRates };
  }
}

async function saveTripRates(rates) {
  // rates = { JPY: 0.0089, USD: 1.35 }
  const today = new Date().toISOString().slice(0, 10);
  const inserts = Object.entries(rates)
    .filter(([, v]) => v > 0)
    .map(([currency_code, rate_to_home]) => ({
      user_id: state.user.id,
      trip_id: state.activeTrip.id,
      currency_code,
      rate_to_home,
      rate_date: today,
    }));
  if (!inserts.length) { alert("Enter at least one valid rate."); return; }
  const { error } = await supabaseClient.from("exchange_rates").insert(inserts);
  if (error) { alert("Could not save rates: " + error.message); return; }
  // Merge into local state immediately
  for (const [k, v] of Object.entries(rates)) {
    if (v > 0) { state.tripRates[k] = v; state.lastRates[k] = v; }
  }
  state.view = "dashboard";
  render();
}

// ============================================================
// EXPENSES
// ============================================================
async function loadExpenses(tripId) {
  const { data, error } = await supabaseClient
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  state.expenses = data || [];

  // Rebuild lastRates from most recent entry per currency
  const rates = {};
  for (const e of state.expenses) {
    if (!(e.foreign_currency in rates)) rates[e.foreign_currency] = e.exchange_rate;
  }
  state.lastRates = rates;
}

async function saveExpense(form) {
  const foreignAmount = parseFloat(form.foreignAmount);
  const rate = parseFloat(form.rate);
  if (!foreignAmount || !rate || !state.activeTrip) return;

  const homeAmount = Math.round(foreignAmount * rate * 100) / 100;

  let receiptUrl = null;
  if (state.pendingPhotoFile) {
    receiptUrl = await uploadReceiptPhoto(state.pendingPhotoFile);
  }

  const { error } = await supabaseClient.from("expenses").insert({
    user_id: state.user.id,
    trip_id: state.activeTrip.id,
    expense_date: form.date,
    category: form.category,
    description: form.notes || null,
    merchant_name: form.merchant || null,
    foreign_amount: foreignAmount,
    foreign_currency: form.currency,
    exchange_rate: rate,
    home_amount: homeAmount,
    payment_method: form.paymentMethod || null,
    is_business_expense: !!form.business,
    receipt_image_url: receiptUrl,
    ocr_raw_text: form.ocrRawText || null,
  });

  if (error) {
    alert("Could not save expense: " + error.message);
    return;
  }

  // Log this rate for future "last used" suggestions
  await supabaseClient.from("exchange_rates").insert({
    user_id: state.user.id,
    trip_id: state.activeTrip.id,
    currency_code: form.currency,
    rate_to_home: rate,
    rate_date: form.date,
  });

  state.pendingPhotoFile = null;
  state.scanResult = null;
  await loadExpenses(state.activeTrip.id);
  state.view = "dashboard";
  render();
}

async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  const { error } = await supabaseClient.from("expenses").delete().eq("id", id);
  if (error) {
    alert("Could not delete: " + error.message);
    return;
  }
  await loadExpenses(state.activeTrip.id);
  render();
}

// ============================================================
// RECEIPT PHOTO — upload to Supabase Storage
// ============================================================
async function uploadReceiptPhoto(file) {
  const ext = file.name.split(".").pop() || "jpg";
  // Path convention {user_id}/{trip_id}/... matches the Storage RLS policies in 002_storage.sql
  const path = `${state.user.id}/${state.activeTrip.id}/${Date.now()}.${ext}`;
  const { error } = await supabaseClient.storage.from(RECEIPT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("Receipt upload failed:", error.message);
    return null;
  }
  // Bucket is private — store the storage PATH (not a public URL). Generate a signed URL
  // on demand when displaying the image (see getReceiptSignedUrl below).
  return path;
}

async function getReceiptSignedUrl(path) {
  if (!path) return null;
  const { data, error } = await supabaseClient.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7); // valid 7 days
  if (error) {
    console.error("Could not sign receipt URL:", error.message);
    return null;
  }
  return data.signedUrl;
}

// ============================================================
// OCR — calls the Supabase Edge Function (scan-receipt), which calls Anthropic safely
// ============================================================
async function scanReceipt(file) {
  state.scanning = true;
  state.pendingPhotoFile = file;
  render();

  try {
    const base64 = await fileToBase64(file);
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch(SCAN_RECEIPT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        image_base64: base64,
        media_type: file.type || "image/jpeg",
      }),
    });

    const result = await res.json();
    if (result.error) {
      alert("Receipt scan failed: " + result.error);
      state.scanning = false;
      render();
      return null;
    }

    state.scanResult = result;
    state.scanning = false;
    render();
    return result;
  } catch (err) {
    alert("Receipt scan failed: " + err.message);
    state.scanning = false;
    render();
    return null;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// DERIVED DATA (mirrors the prototype's 