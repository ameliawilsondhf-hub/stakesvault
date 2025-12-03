import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { depositAddress, minDeposit, network } = body;

    if (!depositAddress || !minDeposit || !network) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(depositAddress)}`;

    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    const db = getFirestore(app);

    // ✅ ✅ ✅ EXACT SAME PATH AS GET
    const ref = doc(db, "data", "settings", "deposit_config");

    await setDoc(
      ref,
      {
        depositAddress,
        minDeposit: Number(minDeposit),
        network,
        qrImage,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Deposit settings updated successfully",
    });
  } catch (error: any) {
    console.error("🔥 SETTINGS UPDATE FAILED:", error.message);

    return NextResponse.json(
      {
        success: false,
        message: "Settings update failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
