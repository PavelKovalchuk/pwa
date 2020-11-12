importScripts("/src/js/idb.js");
importScripts("/src/js/db_utility.js");

const TRIM_ITEMS_NUMBER = 3;
const CACHE_STATIC = "static-v30";
const CACHE_DYNAMIC = "dynamic-v2";
const SYNC_EVENT_NEW_POST = "sync-new-post";
const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/db_utility.js",
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
        clearAllData(DBU_STORE_NAME_POSTS)
          .then(() => {
            return clonedResponse.json();
          })
          .then((data) => {
            for (let key in data) {
              writeData(DBU_STORE_NAME_POSTS, data[key]);

              // For demonstration remove single item
              /* .then(() => {
                deleteItemFromData(DBU_STORE_NAME_POSTS, data[key].id);
              }); */
            }
          });

        return response;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    // Cache only for static files
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

self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Background syncing", event);
  if (event.tag === SYNC_EVENT_NEW_POST) {
    console.log("[Service Worker] Syncing new Posts");
    event.waitUntil(
      readAllData(DBU_STORE_NAME_SYNC_POSTS).then((data) => {
        for (let datum of data) {
          // Create post data in Form format
          const postData = new FormData();
          postData.append("id", datum.id);
          postData.append("title", datum.title);
          postData.append("location", datum.location);
          postData.append("file", datum.picture, datum.id + ".png");
          postData.append("rawLocationLat", datum.rawLocation.lat);
          postData.append("rawLocationLng", datum.rawLocation.lng);

          fetch(
            "https://us-central1-pwa-course-a001f.cloudfunctions.net/storePostData",
            {
              method: "POST",
              body: postData,
            }
          )
            .then((res) => {
              console.log("Sent data", res);
              if (res.ok) {
                res.json().then((resData) => {
                  deleteItemFromData(DBU_STORE_NAME_SYNC_POSTS, resData.id);
                });
              }
            })
            .catch((err) => {
              console.log("Error while sending data", err);
            });
        }
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;

  console.log(notification);

  // action is set in displayConfirmNotification function (options)
  if (action === "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then((allClients) => {
        const client = allClients.find((item) => {
          return item.visibilityState === "visible";
        });

        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification was closed", event);
});

self.addEventListener("push", (event) => {
  console.log("Push Notification received", event);

  let data = {
    title: "New!",
    content: "Something new happened!",
    openUrl: "/",
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
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
