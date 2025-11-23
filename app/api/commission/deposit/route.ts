import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../lib/models/user";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, amount } = await req.json();

    if (!userId || !amount) {
      return NextResponse.json(
        { message: "userId & amount required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ⭐ Add Deposit to User
    user.depositAmount = amount;
    user.totalDeposits += amount;

    await user.save();

    // ⭐ Check: First deposit?
    if (!user.directCommissionGiven) {
      // Find inviter
      if (user.referral) {
        const inviter = await User.findOne({
          referralCode: user.referral,
        });

        if (inviter) {
          // ⭐ Calculate commission
          const commission = Math.floor(amount / 50) * 5;

          inviter.referralEarnings += commission;
          await inviter.save();

          // Mark commission as given
          user.directCommissionGiven = true;
          await user.save();
        }
      }
    }

    return NextResponse.json(
      { message: "Deposit updated & commission processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("DEPOSIT ERROR:", error);
    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
