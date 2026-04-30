const firebaseConfig = {
  apiKey: "AIzaSyCKGJHrpmmQ3rzDqh3q8jGX8-1wE31qGGw",
  authDomain: "social-app-ef577.firebaseapp.com",
  projectId: "social-app-ef577",
  storageBucket: "social-app-ef577.firebasestorage.app",
  messagingSenderId: "20900836573",
  appId: "1:20900836573:web:fed36d56161738a00ad734",
  measurementId: "G-P5V10VL7NW"

};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

export { messaging };