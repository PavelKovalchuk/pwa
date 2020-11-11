var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require("./config-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwa-course-a001f.firebaseio.com/",
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(() => {
        webpush.setVapidDetails(
          "mailto:kovpavanat@gmail.com",
          "BNXAhiiGDSWg29o4i7EffNhatd4vR1QBf7jX13lVRcr_4R4M9uMs0nbK2D36JJwRVRlXYaE0DwSHlorNi1OQzi8",
          "XDmgU2TCXfmAcf0qfaCdjDd8RxN7BqiF0p9MilsE4JM"
        );
        return admin.database().ref("subscriptions").once("value");
      })
      .then((subscriptions) => {
        subscriptions.forEach((sub) => {
          // sub is from Firebase
          const pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };

          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New Post",
                content: "New Post added!",
                openUrl: "/help",
              })
            )
            .catch(function (err) {
              console.log(err);
            });
        });
        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })

      .catch((err) => {
        response.status(500).json({ error: err });
      });
  });
});
