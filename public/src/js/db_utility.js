const DBU_STORE_NAME_POSTS = "posts";
const DBU_STORE_NAME_SYNC_POSTS = "sync-posts";

const dbPromise = idb.open("posts-store", 1, (db) => {
  if (!db.objectStoreNames.contains(DBU_STORE_NAME_POSTS)) {
    db.createObjectStore(DBU_STORE_NAME_POSTS, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(DBU_STORE_NAME_SYNC_POSTS)) {
    db.createObjectStore(DBU_STORE_NAME_SYNC_POSTS, { keyPath: "id" });
  }
});

function writeData(storeName, data) {
  return dbPromise.then((db) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(data);
    return transaction.complete;
  });
}

function readAllData(storeName) {
  return dbPromise.then((db) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    return store.getAll();
  });
}

function clearAllData(storeName) {
  return dbPromise.then((db) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.clear();
    return transaction.complete;
  });
}

function deleteItemFromData(storeName, id) {
  dbPromise
    .then((db) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      store.delete(id);
      return transaction.complete;
    })
    .then(() => {
      console.log("Item deleted id", id);
    });
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  let ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeString });
  return blob;
}
