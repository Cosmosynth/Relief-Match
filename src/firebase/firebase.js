import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const PLACEHOLDER_VALUES = new Set([
  "your_api_key_here",
  "your_auth_domain_here",
  "your_project_id_here",
  "your_storage_bucket_here",
  "your_messaging_sender_id_here",
  "your_app_id_here",
  "your_measurement_id_here",
]);

const isConfiguredValue = (value) =>
  Boolean(value) && !PLACEHOLDER_VALUES.has(String(value).trim());

const isFirebaseConfigured =
  isConfiguredValue(firebaseConfig.apiKey) &&
  isConfiguredValue(firebaseConfig.authDomain) &&
  isConfiguredValue(firebaseConfig.projectId) &&
  isConfiguredValue(firebaseConfig.appId);

let app = null;
let analytics = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (firebaseConfig.measurementId) {
    isSupported()
      .then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      })
      .catch((error) => {
        console.warn("Firebase Analytics unavailable:", error);
      });
  }
} else {
  console.warn(
    "Firebase is not configured. Copy .env.example to .env and add your Firebase credentials."
  );
}

export { app, analytics, auth, db, isFirebaseConfigured };
