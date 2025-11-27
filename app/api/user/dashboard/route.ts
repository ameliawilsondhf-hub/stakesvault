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

// Dashboard Response with Professional Referral Details
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

    // 🔥 FIX: cookies() is async in Next.js 15+
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token"); 
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id;
        }
      } catch (err) {
        console.log("⚠️ JWT verification failed.");
      }
    }

    if (!userId) {
      console.log("❌ No valid authentication found!");
      return NextResponse.json({ error: "Unauthorized - Please login again" }, { status: 401 });
    }
    
    const queryStart = Date.now();
    
    // 🔥 ENHANCED: Populate with more details
    const user = await User.findById(userId)
      .select('walletBalance stakedBalance totalDeposits totalWithdrawals referralCount referralEarnings levelIncome stakes referralCode level1 level2 level3') 
      .populate({ 
        path: 'level1', 
        select: 'email name walletBalance stakedBalance totalDeposits createdAt lastLogin' 
      })
      .populate({ 
        path: 'level2', 
        select: 'email name walletBalance stakedBalance totalDeposits createdAt lastLogin' 
      })
      .populate({ 
        path: 'level3', 
        select: 'email name walletBalance stakedBalance totalDeposits createdAt lastLogin' 
      })
      .lean()
      .exec();
    
    const typedUser = user as unknown as UserWithPopulatedLevels; 

    console.log(`⏱️ User Query: ${Date.now() - queryStart}ms`);

    if (!typedUser) {
      console.log("❌ User not found in DB for ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ FETCH DEPOSITS 
    const deposits = await Deposit.find({ userId })
      .select('amount status screenshot createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    // ✅ FETCH WITHDRAWALS
const Withdraw = (await import("@/lib/models/withdraw")).default;
const withdrawals = await Withdraw.find({ userId })
  .select('amount status walletAddress qrImage createdAt')
  .sort({ createdAt: -1 })
  .lean()
  .exec();
    // ✅ Process Stakes
    const activeStakes = typedUser.stakes?.filter(
      (stake: any) => stake.status === "active"
    ) || [];
    
    // 🔥 PROFESSIONAL: Calculate referral level statistics
    const calculateLevelStats = (users: ReferralUser[]) => {
      const totalDeposits = users.reduce((sum, u) => sum + (u.totalDeposits || 0), 0);
      const totalStaked = users.reduce((sum, u) => sum + (u.stakedBalance || 0), 0);
      return { totalDeposits, totalStaked };
    };

    const level1Stats = calculateLevelStats(typedUser.level1 || []);
    const level2Stats = calculateLevelStats(typedUser.level2 || []);
    const level3Stats = calculateLevelStats(typedUser.level3 || []);

    // --- 2. Final Response Structure ---
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
      deposits: deposits,
      stakes: activeStakes,
withdrawals: withdrawals,      
      // 🔥 PROFESSIONAL: Detailed referral information
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

    console.log(`⏱️ Total API Time: ${Date.now() - startTime}ms`);

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.log("❌ Dashboard Route Error:", error.message || error);
    return NextResponse.json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}