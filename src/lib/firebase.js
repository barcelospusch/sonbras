import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, doc, getFirestore } from "firebase/firestore";
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);
const app = firebaseConfigured
  ? getApps().find((app) => app.name === "[DEFAULT]") || initializeApp(config)
  : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export function getDatabase() {
  if (!db) throw new Error("Firebase não configurado.");
  return db;
}

// Keep collection paths in one place; repositories own reads and writes.
export const userRef = (uid) => doc(getDatabase(), "users", uid);
export const sitesRef = (uid) => collection(userRef(uid), "sites");
export const siteRef = (uid, id) => doc(sitesRef(uid), id);
export const observationsRef = (uid) =>
  collection(userRef(uid), "observations");
export const observationRef = (uid, id) => doc(observationsRef(uid), id);
export const publicProfileRef = (uid) => doc(getDatabase(), "publicUsers", uid);
export const publicObservationsRef = (uid) =>
  collection(publicProfileRef(uid), "observations");
export const publicObservationRef = (uid, id) =>
  doc(publicObservationsRef(uid), id);
export const usernameRef = (username) =>
  doc(getDatabase(), "usernames", username);
