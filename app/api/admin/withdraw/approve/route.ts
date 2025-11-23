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
        { message: "withdrawId missing" },
        { status: 400 }
      );
    }

    const request = await Withdraw.findById(withdrawId);

    if (!request)
      return NextResponse.json({ message: "Request not found" }, { status: 404 });

    if (request.status !== "pending")
      return NextResponse.json({ message: "Already processed" }, { status: 400 });

    const user = await User.findById(request.userId);

    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Deduct balance
    if (user.walletBalance < request.amount) {
      return NextResponse.json(
        { message: "Insufficient balance" },
        { status: 400 }
      );
    }

    user.walletBalance -= request.amount;
    await user.save();

    request.status = "approved";
    await request.save();

    return NextResponse.json({ success: true, message: "Withdraw approved!" });

  } catch (error: any) {
    console.log("APPROVE ERROR:", error);
    return NextResponse.json(
      { message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}
