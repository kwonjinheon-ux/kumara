import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase SDK singletons live here so repositories can share one backend client.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

let firebaseApp: FirebaseApp | null = null;
let appCheck: AppCheck | null = null;

export function getFirebaseApp(): FirebaseApp {
  firebaseApp = firebaseApp ?? (getApps().length ? getApp() : initializeApp(firebaseConfig));
  return firebaseApp;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}

export function getFirebaseAppCheck() {
  if (typeof window === "undefined" || appCheck) return appCheck;

  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;

  appCheck = initializeAppCheck(getFirebaseApp(), {
    isTokenAutoRefreshEnabled: true,
    provider: new ReCaptchaV3Provider(siteKey),
  });

  return appCheck;
}
