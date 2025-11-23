import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";
import User from "@/lib/models/user";

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ FIX: Accept 'requestId' from frontend
    const { requestId } = await req.json();
    
    if (!requestId) {
      return NextResponse.json(
        { message: "Request ID required" },
        { status: 400 }
      );
    }

    const dep = await Deposit.findById(requestId);

    if (!dep) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    if (dep.status !== "pending") {
      return NextResponse.json(
        { message: "Already processed" },
        { status: 400 }
      );
    }

    const user = await User.findById(dep.userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Update user balance
    user.walletBalance += dep.amount;
    user.totalDeposits += dep.amount;
    await user.save();

    // ✅ Update deposit status
    dep.status = "approved";
    await dep.save();

    console.log(`✅ Deposit ${requestId} approved for user ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Deposit approved!",
    });

  } catch (error: any) {
    console.error("❌ Approve Error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}