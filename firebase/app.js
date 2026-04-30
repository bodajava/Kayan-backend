import { messaging } from "./firebase.js";

const VAPID_KEY = "BIdwa075qs1HDcjyL3ViWmHTvMbpGHCVjleiZ5958ZENJY7Hi-0h0HRfKqdXt7w5eMbGinkt6sAwr1w9ZaW1TJE";
const BACKEND_URL = "http://127.0.0.1:3001/send-notification";

let swReg = null;

async function init() {
  if ("serviceWorker" in navigator) {
    try {
      swReg = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
      window.dashboardLog("Service Worker Registered", "success");
    } catch (e) {
      window.dashboardLog("SW Registration Failed: " + e.message, "error");
    }
  }
}
init();

$("#getTokenBtn").click(async () => {
  try {
    window.dashboardLog("Requesting Permission...", "info");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      window.dashboardLog("Permission Denied", "error");
      return;
    }

    if (!swReg) {
      window.dashboardLog("Waiting for Service Worker...", "info");
      swReg = await navigator.serviceWorker.ready;
    }
    
    window.dashboardLog("Fetching Token...", "info");
    const token = await messaging.getToken({ 
      vapidKey: VAPID_KEY, 
      serviceWorkerRegistration: swReg 
    });
    
    if (token) {
      $("#tokenBox").val(token);
      window.dashboardLog("Token Generated Successfully", "success");
    } else {
      window.dashboardLog("No token received. Check console.", "error");
    }
  } catch (e) {
    window.dashboardLog("Token Error: " + e.message, "error");
    console.error(e);
  }
});

$("#sendTestBtn").click(() => {
  const token = $("#tokenBox").val();
  if (!token) return alert("Token is empty!");

  window.dashboardLog("Sending to Backend...", "info");
  $.ajax({
    url: BACKEND_URL,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ token }),
    success: (res) => {
      console.log("Backend Success:", res);
      window.dashboardLog("Notification Triggered Successfully!", "success");
    },
    error: (xhr) => {
      console.error("Backend Error:", xhr);
      window.dashboardLog("Backend Error (Status: " + xhr.status + ")", "error");
    }
  });
});