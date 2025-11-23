import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../lib/models/user";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, amount } = await req.json();
    const user = await User.findById(userId);

    if (!user) return NextResponse.json({ message: "User not found" });

    // Deposit add
    user.depositAmount += amount;
    user.totalDeposits += amount;

    // Referral commission
    if (user.referral) {
      const inviter = await User.findOne({ referralCode: user.referral });

      if (inviter) {
        const oldDeposit = user.lastCommissionDeposit;
        const newDeposit = user.depositAmount;

        const diff = newDeposit - oldDeposit; // new deposit cycle

        if (diff >= 50) {
          const blocks = Math.floor(diff / 50); // 50$ blocks
          const commission = blocks * 5; // 5$ per block

          inviter.referralEarnings += commission;
          user.lastCommissionDeposit = newDeposit;

          await inviter.save();
        }
      }
    }

    await user.save();

    return NextResponse.json({ message: "Deposit successful" });
  } catch (error) {
    return NextResponse.json({ message: "Server Error" });
  }
}
