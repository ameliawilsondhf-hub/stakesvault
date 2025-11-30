import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ✅ Initialize Firebase App (only once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Initialize Firestore with settings to prevent offline errors
let db;

if (typeof window !== 'undefined') {
  // Client-side only initialization
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true, // Fixes connection issues
    });
  } catch (error) {
    // If already initialized, get existing instance
    db = getFirestore(app);
  }
} else {
  // Server-side: just export undefined (won't be used during build)
  db = undefined as any;
}

export { db };