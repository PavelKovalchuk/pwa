self.addEventListener("install", (event) => {
  console.log("[Service Worker] INSTALL event ", event);
  event.waitUntil(
    caches.open("static").then((cache) => {
      console.log("[Service Worker] Precaching App shell ", cache);
      cache.addAll([
        "/",
        "/index.html",
        "/src/js/app.js",
        "/src/js/feed.js",
        "/src/js/promise.js",
        "/src/js/fetch.js",
        "/src/js/material.min.js",
        "/src/css/app.css",
        "/src/css/feed.css",
        "/src/images/main-image.jpg",
        "https://fonts.googleapis.com/css?family=Roboto:400,700",
        "https://fonts.googleapis.com/icon?family=Material+Icons",
        "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
      ]);
    })
  );
});
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] ACTIVATE event ", event);
  return self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  // to override the data
  // event.respondWith(fetch(event.request));

  event.respondWith(
    caches.match(event.request).then((response) => {
      console.log("response ", response);
      if (response) {
        return response;
      } else {
        return fetch(event.request);
      }
    })
  );
});
