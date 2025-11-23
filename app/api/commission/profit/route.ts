import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../lib/models/user";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, profit } = await req.json();

    if (!userId || !profit) {
      return NextResponse.json(
        { message: "userId & profit required" },
        { status: 400 }
      );
    }

    // ⭐ Downline user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 🔥 DIRECT COMMISSION (FIRST DEPOSIT ONLY)
    let directCommissionPaid = false;

    if (user.totalDeposits === 0 && profit >= 50) {
      const directCommission = Math.floor(profit / 50) * 5;

      user.depositAmount += profit;
      user.totalDeposits += profit;
      user.lastCommissionDeposit = directCommission;

      await user.save();

      // Direct inviter
      const inviter = await User.findOne({ referralCode: user.referral });
      if (inviter) {
        inviter.referralEarnings += directCommission;
        await inviter.save();
      }

      directCommissionPaid = true;
    }

    // 🌟--- LEVEL COMMISSION PERCENT ---🌟
    const L1_PERCENT = 8;
    const L2_PERCENT = 4;
    const L3_PERCENT = 2;

    // Only run level income if direct commission NOT paid
    if (!directCommissionPaid) {
      // 🌟 Level-1
      const level1 = user.referral
        ? await User.findOne({ referralCode: user.referral })
        : null;

      if (level1) {
        level1.levelIncome += (profit * L1_PERCENT) / 100;
        await level1.save();
      }

      // 🌟 Level-2
      const level2 = level1?.referral
        ? await User.findOne({ referralCode: level1.referral })
        : null;

      if (level2) {
        level2.levelIncome += (profit * L2_PERCENT) / 100;
        await level2.save();
      }

      // 🌟 Level-3
      const level3 = level2?.referral
        ? await User.findOne({ referralCode: level2.referral })
        : null;

      if (level3) {
        level3.levelIncome += (profit * L3_PERCENT) / 100;
        await level3.save();
      }
    }

    return NextResponse.json(
      { message: "Commission distributed successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.log("COMMISSION ERROR:", error);
    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}
