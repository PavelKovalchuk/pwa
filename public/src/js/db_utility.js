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
