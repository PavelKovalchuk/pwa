importScripts("/src/js/idb.js");
importScripts("/src/js/db_utility.js");

const TRIM_ITEMS_NUMBER = 3;
const CACHE_STATIC = "static-v16";
const CACHE_DYNAMIC = "dynamic";
const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/idb.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

function isInArray(string, array) {
  let cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log("matched ", string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

function trimCache(cacheName, maxItems) {
  /* caches.open(cacheName).then(function (cache) {
    return cache.keys().then(function (keys) {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  }); */
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

// Cache then Network & Dynamic cache
self.addEventListener("fetch", (event) => {
  const urlFetch = "https://pwa-course-a001f.firebaseio.com/posts.json";
  if (event.request.url.indexOf(urlFetch) > -1) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const clonedResponse = response.clone();
        clonedResponse.json().then((data) => {
          for (let key in data) {
            writeData(DBU_STORE_NAME_POSTS, data[key]);
          }
        });
        return response;
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
                trimCache(CACHE_DYNAMIC, TRIM_ITEMS_NUMBER);
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch((error) => {
              return caches.open(CACHE_STATIC).then((cache) => {
                if (event.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
    );
  }
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
