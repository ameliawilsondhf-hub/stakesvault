import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Stake from "@/lib/models/stake";
import { emailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();

    // 1. Get JWT token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("🔑 Token:", token ? "Found" : "Missing");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not logged in" },
        { status: 401 }
      );
    }

    // 2. Verify JWT token
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing in .env");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    let userId;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      console.log("👤 User ID from JWT:", userId);
    } catch (jwtError: any) {
      console.error("❌ JWT Verification Error:", jwtError.message);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // 3. Get request body
    const body = await req.json();
    const amount = body.amount;
    const lockPeriod = body.lockPeriod || body.days;

    console.log("💰 Stake amount:", amount);
    console.log("🔒 Lock period:", lockPeriod);

    // 4. Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // ✅ UPDATED: Support all lock periods (30 days to 5 years)
    const validLockPeriods = [30, 60, 90, 120, 180, 270, 365, 730, 1095, 1460, 1825];
    if (!lockPeriod || !validLockPeriods.includes(parseInt(lockPeriod))) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid lock period. Please select a valid duration.",
          validOptions: validLockPeriods
        },
        { status: 400 }
      );
    }

    // 5. Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("💵 Current wallet balance:", user.walletBalance);

    // 6. Check balance
    if (user.walletBalance < amount) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Insufficient wallet balance",
          available: user.walletBalance,
          required: amount
        },
        { status: 400 }
      );
    }

    // 7. Deduct from wallet
    user.walletBalance -= amount;
    console.log("✅ Wallet deducted. New balance:", user.walletBalance);

    // 8. Update staked balance
    user.stakedBalance = (user.stakedBalance || 0) + amount;
    console.log("✅ Staked balance updated:", user.stakedBalance);

    await user.save();

    // 9. Calculate unlock date
    const now = new Date();
    const unlockDate = new Date(now);
    unlockDate.setDate(unlockDate.getDate() + parseInt(lockPeriod));

    // ✅ Calculate simple interest details
    const dailyProfit = amount * 0.01;
    const totalProfit = dailyProfit * parseInt(lockPeriod);
    const expectedFinalAmount = amount + totalProfit;
    const totalReturn = parseInt(lockPeriod); // 1% × days

    console.log("📊 Simple Interest Calculation:");
    console.log("   Daily Profit: $" + dailyProfit.toFixed(2));
    console.log("   Total Profit: $" + totalProfit.toFixed(2));
    console.log("   Expected Final: $" + expectedFinalAmount.toFixed(2));
    console.log("   Total Return: " + totalReturn + "%");

    // 10. Create Stake record in Stake model
    const stake = await Stake.create({
      userId: userId,
      originalAmount: amount,
      currentAmount: amount,
      startDate: now,
      unlockDate: unlockDate,
      lastProfitDate: now,
      lockPeriod: parseInt(lockPeriod),
      status: 'locked',
      totalProfit: 0,
      profitHistory: [],
      cycle: 1,
      autoRelock: true,
      autoRelockAt: null
    });

    console.log("✅ Stake record created:", stake._id);

    // 11. Send email notification
    try {
      await emailService.sendStakeStarted(
        user.email,
        user.name || user.email,
        amount,
        parseInt(lockPeriod),
        unlockDate,
        stake._id.toString()
      );
      console.log(`📧 Stake started email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      // Don't fail the stake if email fails
    }

    // 12. Return success with simple interest details
    return NextResponse.json({
      success: true,
      message: "Staking successful! You will receive a confirmation email shortly.",
      data: {
        stakeId: stake._id,
        walletBalance: user.walletBalance,
        stakedBalance: user.stakedBalance,
        stake: {
          amount: stake.currentAmount,
          lockPeriod: stake.lockPeriod,
          startDate: stake.startDate,
          unlockDate: stake.unlockDate,
          status: stake.status,
          cycle: stake.cycle,
          // ✅ NEW: Simple interest details
          dailyReward: dailyProfit.toFixed(2),
          totalProfit: totalProfit.toFixed(2),
          expectedFinal: expectedFinalAmount.toFixed(2),
          totalReturn: totalReturn,
          interestType: "simple"
        }
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error("❌ STAKE CREATE ERROR:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);

    return NextResponse.json(
      { 
        success: false, 
        message: "Server error", 
        error: err.message,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}