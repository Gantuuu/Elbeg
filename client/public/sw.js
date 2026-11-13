const CACHE_NAME = "arvijikh-offline-v1";
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([
    OFFLINE_PAGE,
    "/icons/app-192.png",
  ])));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("arvijikh-offline-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "GET" && url.origin === self.location.origin && url.pathname === "/icons/app-192.png") {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => await cache.match(url.pathname) || fetch(event.request)));
    return;
  }
  // Never cache or intercept API/auth responses, product images, or POSTs.
  if (event.request.method !== "GET" || event.request.mode !== "navigate" ||
    url.origin !== self.location.origin || /^\/(api|uploads)(\/|$)/.test(url.pathname)) return;

  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(OFFLINE_PAGE) || Response.error();
    }
  })());
});
