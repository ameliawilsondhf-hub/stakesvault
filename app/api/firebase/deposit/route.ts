import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// ----- FIREBASE CONFIG -----
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  storageBucket: process.env.FIREBASE_STORAGE!,
  messagingSenderId: process.env.FIREBASE_SENDER!,
  appId: process.env.FIREBASE_APP_ID!,
};

// Initialize Firebase only once
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export async function GET() {
  try {
    const db = getFirestore();

    const ref = doc(
      db,
      "artifacts/default-deposit-app/public/data/settings/deposit_config"
    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, message: "deposit_config not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: snap.data(),
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
