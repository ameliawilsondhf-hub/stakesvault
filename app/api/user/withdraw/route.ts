import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Withdraw from "@/lib/models/withdraw";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await connectDB();

    const { amount } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Not logged in" }, { status: 401 });
    }

    const user = await User.findOne({ email: token });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.walletBalance < amount) {
      return NextResponse.json(
        { message: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const reqData = await Withdraw.create({
      userId: user._id,
      amount,
      status: "pending",
      time: new Date(),
    });

    return NextResponse.json(
      { message: "Withdrawal request sent!", requestId: reqData._id },
      { status: 200 }
    );

  } catch (error) {
    console.log("WITHDRAW ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}