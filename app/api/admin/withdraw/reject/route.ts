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
        { success: false, message: "Request already processed" },
        { status: 400 }
      );
    }

    // 🔥 REFUND AMOUNT TO USER WALLET
    const user = await User.findById(withdrawal.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Refund the amount
    user.walletBalance += withdrawal.amount;
    await user.save();

    console.log(`✅ Refunded $${withdrawal.amount} to user ${user.email}. New balance: $${user.walletBalance}`);

    // Update withdrawal status
    withdrawal.status = "rejected";
    await withdrawal.save();

    return NextResponse.json({ 
      success: true, 
      message: "Withdrawal rejected and amount refunded to wallet" 
    });

  } catch (err: any) {
    console.error("❌ Withdraw Reject Error:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}