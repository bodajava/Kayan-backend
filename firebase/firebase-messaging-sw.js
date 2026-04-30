importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCKGJHrpmmQ3rzDqh3q8jGX8-1wE31qGGw",
  authDomain: "social-app-ef577.firebaseapp.com",
  projectId: "social-app-ef577",
  storageBucket: "social-app-ef577.firebasestorage.app",
  messagingSenderId: "20900836573",
  appId: "1:20900836573:web:fed36d56161738a00ad734",
  measurementId: "G-P5V10VL7NW"

});

const messaging = firebase.messaging();

// ✅ Background Notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message:", payload);

  self.registration.showNotification(
    payload.data?.title || "New Notification",
    {
      body: payload.data?.body || "You have a message",
      // icon: "/firebase-logo.png"
    }
  );
});