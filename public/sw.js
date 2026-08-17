// ArteGO service worker — deliberately conservative scope: cache the app
// shell (static assets, icons, the offline fallback page) for resilience
// and speed, but NEVER cache API calls, server actions, or any
// authenticated/dynamic page. Caching a private/dynamic page could leak
// one user's data to the next person on a shared device, and the
// published-content pages must always read live/snapshot data, never a
// stale cached copy (publishing-snapshot.md, uat.md: "No private content
// leaks through search, URL guessing, caching or public feeds").

const CACHE_VERSION = "artego-v1";
const APP_SHELL = ["/offline", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever cache same-origin GET requests. POSTs (server actions),
  // cross-origin requests (Supabase, Cloudinary, the Anthropic API) and
  // anything else pass straight through to the network, untouched.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Page navigations: try the network first (so signed-in/dynamic pages
  // are always fresh), fall back to the cached offline page only when
  // the network request itself fails outright.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((res) => res ?? Response.error())),
    );
    return;
  }

  // Static, content-hashed build assets and icons: stale-while-revalidate
  // — serve from cache instantly if present, and refresh the cache in the
  // background for next time.
  const url = new URL(request.url);
  if (url.pathname.startsWith("/_next/static/") || APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached ?? networkFetch;
      }),
    );
  }
});
