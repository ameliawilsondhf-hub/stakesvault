import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          walletBalance: user.walletBalance,
          depositAmount: user.depositAmount,
          totalDeposits: user.totalDeposits,
          referralCount: user.referralCount,
          referralEarnings: user.referralEarnings,
          levelIncome: user.levelIncome,
          withdrawHistory: user.withdrawHistory ?? [],
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.log("ME ROUTE ERROR:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
