// Minimale service worker: maakt Plekk installeerbaar als app. Geen caching van boekingsdata.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
