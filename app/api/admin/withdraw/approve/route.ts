import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Withdraw from "@/lib/models/withdraw";
import User from "@/lib/models/user";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { withdrawId } = await req.json();

    if (!withdrawId) {
      return NextResponse.json(
        { success: false, message: "Withdraw ID missing" },
        { status: 400 }
      );
    }

    const withdrawal = await Withdraw.findById(withdrawId);

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Already processed" },
        { status: 400 }
      );
    }

    // ✅ Just approve - amount already deducted during submission
    withdrawal.status = "approved";
    await withdrawal.save();

    console.log(`✅ Withdrawal ${withdrawId} approved - amount was already deducted`);

    return NextResponse.json({ 
      success: true, 
      message: "Withdrawal approved successfully!" 
    });

  } catch (error: any) {
    console.error("❌ Approve Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}