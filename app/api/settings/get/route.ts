import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET() {
  try {
    // ✅ Complete path from Firebase breadcrumb:
    // artifacts → default-deposit-app → public → data → settings → deposit_config
    const ref = doc(
      db,
      "artifacts",
      "default-deposit-app",
      "public",
      "data",
      "settings",
      "deposit_config"
    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, message: "Deposit config not found" },
        { status: 404 }
      );
    }

    const data = snap.data();

    return NextResponse.json({
      success: true,
      settings: {
        depositAddress: data.depositAddress || "",
        qrImage: data.qrImage || "",
        minDeposit: data.minDeposit || 20,
        network: data.network || "USDT TRC20 (Tron)",
      },
    });
  } catch (err: any) {
    console.error("SETTINGS API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}