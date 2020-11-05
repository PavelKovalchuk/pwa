var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

function openCreatePostModal() {
  createPostArea.style.display = "block";
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
  createPostArea.style.display = "none";
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
  cardTitle.style.height = "180px";
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
  console.log("DBU_STORE_NAME_POSTS ", DBU_STORE_NAME_POSTS);
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
