// firebase-init.js

let firebaseApp = null;
let firebaseAuth = null;
let firebaseFirestore = null;

// Initialize Firebase dynamically by fetching config from backend
async function initFirebase() {
  try {
    const res = await fetch('/api/config/firebase');
    const config = await res.json();

    if (!config.apiKey) {
      console.warn("Firebase config is missing from server.");
      return;
    }

    // Initialize Firebase
    firebaseApp = firebase.initializeApp(config);
    firebaseAuth = firebase.auth();
    if (firebase.firestore) {
      firebaseFirestore = firebase.firestore();
    }
    
    // Set persistence to LOCAL so session survives reloads
    await firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    // Notify the rest of the app that Firebase is ready
    window.dispatchEvent(new Event('firebaseReady'));
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
}

// Call init immediately
initFirebase();
