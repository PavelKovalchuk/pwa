const DOMAIN = "http://localhost:3001";
const CACHE_STATIC = "static-v14";
const CACHE_DYNAMIC = "dynamic";
const STATIC_FILES = [
  DOMAIN + "/",
  DOMAIN + "/index.html",
  DOMAIN + "/offline.html",
  DOMAIN + "/src/js/app.js",
  DOMAIN + "/src/js/feed.js",
  DOMAIN + "/src/js/promise.js",
  DOMAIN + "/src/js/fetch.js",
  DOMAIN + "/src/js/material.min.js",
  DOMAIN + "/src/css/app.css",
  DOMAIN + "/src/css/feed.css",
  DOMAIN + "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

function isInArray(string, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === string) {
      return true;
    }
  }
  return false;
}

self.addEventListener("install", (event) => {
  console.log("[Service Worker] INSTALL event ", event);
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log("[Service Worker] Precaching App shell ", cache);
      cache.addAll(STATIC_FILES);
    })
  );
});
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] ACTIVATE event ", event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            console.log("[Service Worker] Removing old cache key", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Cache then Network strategy
// self.addEventListener("fetch", (event) => {
// to override the data
// event.respondWith(fetch(event.request));
/* event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then((res) => {
            return caches.open(CACHE_DYNAMIC).then((cache) => {
              cache.put(event.request.url, res.clone());
              return res;
            });
          })
          .catch((error) => {
            return caches.open(CACHE_STATIC).then((cache) => {
              return cache.match("/offline.html");
            });
          });
      }
    })
  ); */
// });

// Strategy: cache only
/* self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request));
}); */

// Network only strategy
/* self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
}); */

// Network with cache fallback strategy
/* self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        return caches.open(CACHE_DYNAMIC).then((cache) => {
          cache.put(event.request.url, res.clone());
          return res;
        });
      })
      .catch((error) => {
        return caches.match(event.request);
      })
  );
}); */

// Cache then Network & Dynamic cache
self.addEventListener("fetch", (event) => {
  const urlFetch = "https://httpbin.org/get";
  if (event.request.url.indexOf(urlFetch) > -1) {
    event.respondWith(
      caches.open(CACHE_DYNAMIC).then((cache) => {
        return fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    // Cache only for static files
    console.log(
      "[Service Worker] static file in cache only: ",
      event.request.url
    );
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then((res) => {
              return caches.open(CACHE_DYNAMIC).then((cache) => {
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch((error) => {
              return caches.open(CACHE_STATIC).then((cache) => {
                if (event.request.url.indexOf("/help")) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
    );
  }
});
