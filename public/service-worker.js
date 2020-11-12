importScripts("/src/js/idb.js");
importScripts("/src/js/db_utility.js");

importScripts("workbox-sw.prod.v2.1.3.js");

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "google-fonts",
    cacheExpiration: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  })
);

workboxSW.router.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "material-css",
  })
);

workboxSW.router.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "post-images",
  })
);

workboxSW.router.registerRoute(
  "https://pwa-course-a001f.firebaseio.com/posts.json",
  function (args) {
    return fetch(args.event.request).then(function (res) {
      var clonedRes = res.clone();
      clearAllData(DBU_STORE_NAME_POSTS)
        .then(function () {
          return clonedRes.json();
        })
        .then(function (data) {
          for (var key in data) {
            writeData(DBU_STORE_NAME_POSTS, data[key]);
          }
        });
      return res;
    });
  }
);

workboxSW.router.registerRoute(
  function (routeData) {
    return routeData.event.request.headers.get("accept").includes("text/html");
  },
  function (args) {
    return caches.match(args.event.request).then(function (response) {
      if (response) {
        return response;
      } else {
        return fetch(args.event.request)
          .then(function (res) {
            return caches.open("dynamic").then(function (cache) {
              cache.put(args.event.request.url, res.clone());
              return res;
            });
          })
          .catch(function (err) {
            return caches.match("/offline.html").then(function (res) {
              return res;
            });
          });
      }
    });
  }
);

workboxSW.precache([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "f7f2274d22f04fd1b27d172560a1aa51"
  },
  {
    "url": "manifest.json",
    "revision": "7b8fc58e1340735403b91d7d78746a62"
  },
  {
    "url": "offline.html",
    "revision": "f41ceda4c8c27200f6f2f72f243df1a4"
  },
  {
    "url": "service-worker.js",
    "revision": "487dff15087397afb9e0200bcced3dff"
  },
  {
    "url": "src/css/app.css",
    "revision": "59d917c544c1928dd9a9e1099b0abd71"
  },
  {
    "url": "src/css/feed.css",
    "revision": "bc3d5f4082f8e8740b5ee31f0aa74dab"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "2e71f9b419a76d9fb5c5af65e0d78529"
  },
  {
    "url": "src/js/db_utility.js",
    "revision": "a3621c812aef9cafdab21c5e86c8f10f"
  },
  {
    "url": "src/js/feed.js",
    "revision": "a701d6be371e34711b6a6029e2e0a87a"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "sw-base.js",
    "revision": "a3d493dcc19aee44560065cda7d81d21"
  },
  {
    "url": "sw.js",
    "revision": "bc6771fd24d0c20dadafd828a92a67ff"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

const SYNC_EVENT_NEW_POST = "sync-new-post";

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
