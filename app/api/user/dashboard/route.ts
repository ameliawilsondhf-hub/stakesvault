import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user"; 
import Deposit from "@/lib/models/deposit";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Types } from "mongoose";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ⭐ ANTI-FRAUD CONFIGURATION
const MIN_STAKE_PERCENT = 80; // 80% of deposits must be staked

// 🔥 ENHANCED: Professional Referral User Interface
interface ReferralUser {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  walletBalance: number;
  stakedBalance: number;
  totalDeposits: number;
  createdAt: Date;
  lastLogin?: Date;
}

// Dashboard Response with Professional Referral Details + Withdrawal Eligibility
interface DashboardResponse {
  success: boolean;
  walletBalance: number;
  stakedBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  referralCount: number;
  referralEarnings: number;
  levelIncome: number;
  referralCode: string | null;
  deposits: any[]; 
  stakes: any[]; 
  withdrawals: any[];
  
  // 🛡️ ANTI-FRAUD: Withdrawal eligibility
  withdrawalEligibility: {
    isEligible: boolean;
    totalDeposits: number;
    requiredStake: number;
    currentActiveStake: number;
    deficit: number;
    minimumStakePercent: number;
    message: string;
  };
  
  // 🔥 PROFESSIONAL: Detailed referral levels
  referralLevels: {
    level1: {
      count: number;
      users: ReferralUser[];
      totalDeposits: number;
      totalStaked: number;
    };
    level2: {
      count: number;
      users: ReferralUser[];
      totalDeposits: number;
      totalStaked: number;
    };
    level3: {
      count: number;
      users: ReferralUser[];
      totalDeposits: number;
      totalStaked: number;
    };
  };
}

interface UserWithPopulatedLevels {
  walletBalance: number;
  stakedBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  referralCount: number;
  referralEarnings: number;
  levelIncome: number;
  referralCode: string | null;
  stakes: any[];
  level1: ReferralUser[];
  level2: ReferralUser[];
  level3: ReferralUser[];
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    await connectDB();
    console.log(`⏱️ DB Connection: ${Date.now() - startTime}ms`);

    let userId: string | Types.ObjectId | null = null;

    // --- 1. Authentication Check ---
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        userId = (session.user as any).id || (await User.findOne({ email: session.user.email }))?._id.toString();
      }
    } catch (err) {
      console.log("⚠️ NextAuth session check failed.");
    }

 if (!userId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");
    
    console.log("🍪 Cookie check:");
    console.log("   Has token:", !!token);
    console.log("   Token value exists:", !!token?.value);
    
    if (token && token.value) {
      const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
      userId = decoded.id || decoded.userId;
      console.log("   ✅ UserId from cookie:", userId);
    } else {
      console.log("   ❌ No token cookie found");
    }
  } catch (err: any) {
    console.log("   ⚠️ JWT verification failed:", err.message);
  }
}

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please login again" },
        { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }
    
    const queryStart = Date.now();
    
    const user = await User.findById(userId)
      .select('walletBalance stakedBalance totalDeposits totalWithdrawals referralCount referralEarnings levelIncome stakes referralCode level1 level2 level3') 
      .populate({ path: 'level1', select: 'email name walletBalance stakedBalance totalDeposits createdAt lastLogin' })
      .populate({ path: 'level2', select: 'email name walletBalance stakedBalance totalDeposits createdAt lastLogin' })
      .populate({ path: 'level3', select: 'email name walletBalance stakedBalance totalDeposits createdAt lastLogin' })
      .lean()
      .exec();
    
    const typedUser = user as unknown as UserWithPopulatedLevels; 

    if (!typedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const deposits = await Deposit.find({ userId }).select('amount status screenshot createdAt').sort({ createdAt: -1 }).lean().exec();
    const Withdraw = (await import("@/lib/models/withdraw")).default;
    const withdrawals = await Withdraw.find({ userId }).select('amount status walletAddress qrImage createdAt').sort({ createdAt: -1 }).lean().exec();
      
    const activeStakes = typedUser.stakes?.filter((stake: any) => stake.status === "active") || [];

    const totalDeposits = typedUser.totalDeposits || 0;
    const requiredStake = totalDeposits * (MIN_STAKE_PERCENT / 100);
    const totalActiveStake = activeStakes.reduce((sum: number, stake: any) => sum + (stake.amount || 0), 0);
    const isEligible = totalActiveStake >= requiredStake;
    const deficit = isEligible ? 0 : requiredStake - totalActiveStake;

    let eligibilityMessage = "";
    if (isEligible) {
      eligibilityMessage = "You are eligible to withdraw funds.";
    } else {
      eligibilityMessage = `You need $${deficit.toFixed(2)} more in active stakes to withdraw. Required: $${requiredStake.toFixed(2)} (${MIN_STAKE_PERCENT}% of deposits).`;
    }

    const calculateLevelStats = (users: ReferralUser[]) => {
      const totalDeposits = users.reduce((sum, u) => sum + (u.totalDeposits || 0), 0);
      const totalStaked = users.reduce((sum, u) => sum + (u.stakedBalance || 0), 0);
      return { totalDeposits, totalStaked };
    };

    const level1Stats = calculateLevelStats(typedUser.level1 || []);
    const level2Stats = calculateLevelStats(typedUser.level2 || []);
    const level3Stats = calculateLevelStats(typedUser.level3 || []);

    const responseData: DashboardResponse = {
      success: true,
      walletBalance: typedUser.walletBalance || 0,
      stakedBalance: typedUser.stakedBalance || 0,
      totalDeposits: typedUser.totalDeposits || 0,
      totalWithdrawals: typedUser.totalWithdrawals || 0,
      referralCount: typedUser.referralCount || 0,
      referralEarnings: typedUser.referralEarnings || 0,
      levelIncome: typedUser.levelIncome || 0,
      referralCode: typedUser.referralCode || null,
      deposits,
      stakes: activeStakes,
      withdrawals,

      withdrawalEligibility: {
        isEligible,
        totalDeposits,
        requiredStake,
        currentActiveStake: totalActiveStake,
        deficit,
        minimumStakePercent: MIN_STAKE_PERCENT,
        message: eligibilityMessage
      },

      referralLevels: {
        level1: {
          count: (typedUser.level1 || []).length,
          users: typedUser.level1 || [],
          totalDeposits: level1Stats.totalDeposits,
          totalStaked: level1Stats.totalStaked,
        },
        level2: {
          count: (typedUser.level2 || []).length,
          users: typedUser.level2 || [],
          totalDeposits: level2Stats.totalDeposits,
          totalStaked: level2Stats.totalStaked,
        },
        level3: {
          count: (typedUser.level3 || []).length,
          users: typedUser.level3 || [],
          totalDeposits: level3Stats.totalDeposits,
          totalStaked: level3Stats.totalStaked,
        },
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error", details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
