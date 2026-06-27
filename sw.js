// ============================================================
// sw.js — Service Worker for Travel Expense Tracker (Ryu)
// Caches the app shell so the UI loads even without a network.
// Supabase API calls always go to the network (no offline data).
// ============================================================

const CACHE   = "ryu-travel-v1";
const SHELL   = [
  "./",
  "./index.html",
  "./app.js",
  "./ui.js",
  "./config.js",
  "./styles.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  "https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap",
];

// Install: pre-cache the app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve shell from cache, Supabase + API calls always from network
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Always network-first for Supabase API / Edge Functions / fonts
  const networkFirst =
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.com") ||
    url.hostname.includes("anthropic.com") ||
    url.hostname.includes("fonts.gstatic.com");

  if (networkFirst) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
