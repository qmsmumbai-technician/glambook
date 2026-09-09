const CACHE_NAME = "glambook-v4";
const PRECACHE = ["./", "index.html", "style.css", "app.js", "brand-config.js", "categories-config.js", "manifest.json", "logo.png", "category-hair.jpg", "category-skin.jpg", "category-grooming.jpg", "category-hands-feet.jpg", "category-makeup.jpg", "category-body.jpg", "category-academy.jpg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first, and bypass the browser's ordinary HTTP cache too (not just
// the service worker's) — GitHub Pages' default cache headers can otherwise
// serve a stale file even when this fetch handler tries the network "first".
// Falls back to the service worker cache only when truly offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
