import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../lib/models/user";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, profitAmount } = await req.json();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    // -------------------------
    // Level Commission Percentages
    // -------------------------
    const L1_PERCENT = 0.08; // 8%
    const L2_PERCENT = 0.04; // 4%
    const L3_PERCENT = 0.02; // 2%

    // -------------------------
    // LEVEL 1 USER
    // -------------------------
    if (user.referral) {
      const level1 = await User.findOne({ referralCode: user.referral });

      if (level1) {
        const L1_income = profitAmount * L1_PERCENT;
        level1.levelIncome += L1_income;
        await level1.save();

        // -------------------------
        // LEVEL 2 USER
        // -------------------------
        if (level1.referral) {
          const level2 = await User.findOne({
            referralCode: level1.referral,
          });

          if (level2) {
            const L2_income = profitAmount * L2_PERCENT;
            level2.levelIncome += L2_income;
            await level2.save();

            // -------------------------
            // LEVEL 3 USER
            // -------------------------
            if (level2.referral) {
              const level3 = await User.findOne({
                referralCode: level2.referral,
              });

              if (level3) {
                const L3_income = profitAmount * L3_PERCENT;
                level3.levelIncome += L3_income;
                await level3.save();
              }
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: "Profit distributed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Profit Distribution Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
