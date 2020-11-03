self.addEventListener("install", (event) => {
  console.log("[Service Worker] INSTALL event ", event);
});
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] ACTIVATE event ", event);
  return self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  console.log("[Service Worker] FETCH event ", event);
  // to override the data
  event.respondWith(fetch(event.request));
});
