let deferredPrompt;
const enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service worker registered");
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  console.log("beforeinstallprompt Fired event", event);
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    const options = {
      body: "You successfully subscribed to our Notification service!",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boat.jpg",
      dir: "ltr",
      lang: "en-US", // BCP 47,
      vibrate: [100, 50, 200],
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        {
          action: "confirm",
          title: "Okay",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
      ],
    };

    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(
        "Successfully subscribed (from SW)!",
        options
      );
    });
  }

  // Browser notification
  /* const options = {
    body: "You successfully subscribed to our Notification service!",
  };
  new Notification("Successfully subscribed!", options); */
}

function configurePushSubscription() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let reg;
  navigator.serviceWorker.ready
    .then((registration) => {
      reg = registration;
      return registration.pushManager.getSubscription();
    })
    .then((sub) => {
      if (sub === null) {
        // Create a new subscription
        // https://blog.mozilla.org/services/2016/04/04/using-vapid-with-webpush/
        const vapidPublicKey =
          "BNXAhiiGDSWg29o4i7EffNhatd4vR1QBf7jX13lVRcr_4R4M9uMs0nbK2D36JJwRVRlXYaE0DwSHlorNi1OQzi8";
        const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
        });
      } else {
        // We have a subscription
      }
    })
    .then((newSub) => {
      return fetch(
        "https://pwa-course-a001f.firebaseio.com/subscriptions.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newSub),
        }
      );
    })
    .then((res) => {
      if (res.ok) {
        displayConfirmNotification();
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function askForNotificationPermission() {
  Notification.requestPermission((result) => {
    if (result !== "granted") {
      console.log("No notification permission granted!");
    } else {
      // displayConfirmNotification();
      configurePushSubscription();
    }
  });
}

if ("Notification" in window && "serviceWorker" in navigator) {
  for (let i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermission
    );
  }
}
