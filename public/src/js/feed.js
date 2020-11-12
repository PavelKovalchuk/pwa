const SYNC_EVENT_NEW_POST = "sync-new-post";

const shareImageButton = document.querySelector("#share-image-button");
const createPostArea = document.querySelector("#create-post");
const closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
const sharedMomentsArea = document.querySelector("#shared-moments");
const form = document.querySelector("form");
const titleInput = document.querySelector("#title");
const locationInput = document.querySelector("#location");
const videoPlayer = document.querySelector("#player");
const canvasElement = document.querySelector("#canvas");
const captureButton = document.querySelector("#capture-btn");
const imagePicker = document.querySelector("#image-picker");
const imagePickerArea = document.querySelector("#pick-image");
let picture;

function initializeMedia() {
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!("getUserMedia" in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = (constraints) => {
      const getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      // Safari implementation OR Mozilla

      if (!getUserMedia) {
        return Promise.reject(new Error("getUserMedia is not implemented!"));
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = "block";
    })
    .catch(function (err) {
      imagePickerArea.style.display = "block";
    });
}

captureButton.addEventListener("click", (event) => {
  canvasElement.style.display = "block";
  videoPlayer.style.display = "none";
  captureButton.style.display = "none";
  const context = canvasElement.getContext("2d");

  context.drawImage(
    videoPlayer,
    0,
    0,
    canvas.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  );

  videoPlayer.srcObject.getVideoTracks().forEach((track) => {
    track.stop();
  });

  picture = dataURItoBlob(canvasElement.toDataURL());
});

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

function openCreatePostModal() {
  // createPostArea.style.display = "block";
  createPostArea.style.transform = "translateY(0)";
  initializeMedia();

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
      console.log("choiceResult.outcome: ", choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation.");
      } else {
        console.log("User added installation.");
      }
    });

    deferredPrompt = null;
  }

  // Remove and register Service worker
  if ("serviceWorker" in navigator) {
    /*  navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let i = 0; i < registrations.length; i++) {
        registrations[i].unregister();
      }
    }); */
  }
}

function closeCreatePostModal() {
  createPostArea.style.transform = "translateY(100vh)";
  imagePickerArea.style.display = "none";
  videoPlayer.style.display = "none";
  canvasElement.style.display = "none";
  // createPostArea.style.display = 'none';
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// Caching on user demand
function onSaveButtonClicked(event) {
  console.log("clicked");
  if ("caches" in window) {
    caches.open("user-requested").then((cache) => {
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg");
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url(" + data.image + ")";
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.color = "white";
  cardTitle.style.height = "240px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";

  // Caching on user demand
  var cardSaveButton = document.createElement("button");
  cardSaveButton.textContent = "Save";
  cardSaveButton.addEventListener("click", onSaveButtonClicked);
  cardSupportingText.appendChild(cardSaveButton);

  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

const urlFetch = "https://pwa-course-a001f.firebaseio.com/posts.json";
let isNetworkDataReceived = false;

fetch(urlFetch)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    isNetworkDataReceived = true;
    console.log("[FEED]: FROM WEB data received: ", data);
    clearCards();

    let dataArray = [];
    for (let key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

// Save data in indexedDB
if ("indexedDB" in window) {
  readAllData(DBU_STORE_NAME_POSTS).then((data) => {
    if (!isNetworkDataReceived) {
      console.log("[FEED]: FROM INDEXED_DB data received: ", data);
      updateUI(data);
    }
  });
}

// Cache then Network strategy
/* if ("caches" in window) {
  caches
    .match(urlFetch)
    .then((response) => {
      if (response) {
        return response.json();
      }
    })
    .then((data) => {
      console.log("[FEED]: FROM CACHE data received: ", data);
      if (!isNetworkDataReceived) {
        clearCards();

        let dataArray = [];
        for (let key in data) {
          dataArray.push(data[key]);
        }
        updateUI(dataArray);
      }
    });
} */

function sendData() {
  const id = new Date().toISOString();
  // Create post data in Form format
  const postData = new FormData();
  postData.append("id", id);
  postData.append("title", titleInput.value);
  postData.append("location", locationInput.value);
  postData.append("file", picture, id + ".png");

  fetch(
    "https://us-central1-pwa-course-a001f.cloudfunctions.net/storePostData",
    {
      method: "POST",
      body: postData,
    }
  ).then(function (res) {
    console.log("Sent data", res);
    updateUI();
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("Please enter valid data!");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((serviceWorker) => {
      const post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
      };
      writeData(DBU_STORE_NAME_SYNC_POSTS, post)
        .then(() => {
          return serviceWorker.sync.register(SYNC_EVENT_NEW_POST);
        })
        .then(() => {
          const snackbarContainer = document.querySelector(
            "#confirmation-toast"
          );
          const data = { message: "Your Post was saved for syncing!" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
});
