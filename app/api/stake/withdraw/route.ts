import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Stake from "@/lib/models/stake";
import Withdraw from "@/lib/models/withdraw";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ Get user from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const body = await req.json();
    const { stakeId } = body;

    if (!stakeId) {
      return NextResponse.json(
        { success: false, message: "Stake ID is required" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // ✅ Find the stake
    const stake = await Stake.findOne({
      _id: stakeId,
      userId: userId,
    });

    if (!stake) {
      return NextResponse.json(
        { success: false, message: "Stake not found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // ✅ Check if stake is unlocked
    if (stake.status !== "unlocked") {
      return NextResponse.json(
        { success: false, message: "Stake is still locked" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // ✅ Find user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // ✅ Final withdraw amount
    const withdrawAmount = stake.currentAmount;

    if (user.stakedBalance < withdrawAmount) {
      return NextResponse.json(
        { success: false, message: "Insufficient staked balance" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // ✅ Update balances
    user.stakedBalance -= withdrawAmount;
    user.walletBalance += withdrawAmount;

    // ✅ Create withdraw record
    const withdrawRecord = new Withdraw({
      userId: userId,
      amount: withdrawAmount,
      type: "stake_withdraw",
      status: "completed",
      stakeId: stake._id,
      details: {
        originalAmount: stake.originalAmount,
        finalAmount: stake.currentAmount,
        totalProfit: stake.totalProfit,
        lockPeriod: stake.lockPeriod,
        cycle: stake.cycle,
      },
    });

    await withdrawRecord.save();

    // ✅ Delete completed stake
    await Stake.findByIdAndDelete(stake._id);

    // ✅ Save user
    await user.save();

    console.log(`✅ Stake withdrawn: ${stake._id} | Amount: $${withdrawAmount}`);

    return NextResponse.json(
      {
        success: true,
        message: "Stake withdrawn successfully",
        data: {
          withdrawnAmount: withdrawAmount,
          originalAmount: stake.originalAmount,
          profit: stake.totalProfit,
          newWalletBalance: user.walletBalance,
          newStakedBalance: user.stakedBalance,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Withdraw Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
