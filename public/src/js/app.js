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
  console.log("--- displayConfirmNotification");
  const options = {
    body: "You successfully subscribed to our Notification service!",
  };
  new Notification("Successfully subscribed!", options);
}

function askForNotificationPermission() {
  Notification.requestPermission((result) => {
    console.log("User Choice", result);
    if (result !== "granted") {
      console.log("No notification permission granted!");
    } else {
      displayConfirmNotification();
    }
  });
}

if ("Notification" in window) {
  for (let i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermission
    );
  }
}
