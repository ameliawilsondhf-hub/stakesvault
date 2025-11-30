import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ✅ Initialize Firebase App (only once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Initialize Firestore with proper error handling
let db: any;

try {
  if (typeof window !== 'undefined') {
    // Client-side: Use long polling for better connection stability
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    });
  } else {
    // Server-side: Standard initialization (won't cause build errors)
    db = getFirestore(app);
  }
} catch (error: any) {
  // If already initialized, get existing instance
  if (error.code === 'failed-precondition') {
    db = getFirestore(app);
  } else {
    console.warn('Firestore initialization warning:', error.message);
    db = getFirestore(app);
  }
}

export { app, db };
export default db;