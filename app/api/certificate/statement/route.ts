import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/lib/models/user";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    let userEmail = null;

    // Try NextAuth session
    try {
      const session = await getServerSession();
      if (session?.user?.email) {
        userEmail = session.user.email;
      }
    } catch (err) {
      console.log("⚠️ NextAuth check failed");
    }

    // Try JWT token
    if (!userEmail) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (token && process.env.JWT_SECRET) {
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded?.id) {
            const user = await User.findById(decoded.id).select("email");
            if (user?.email) {
              userEmail = user.email;
            }
          }
        }
      } catch (err) {
        console.log("⚠️ JWT check failed");
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user with all stakes
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Process stakes data
    const stakes = user.stakes?.map((stake: any) => {
      const daysRemaining = Math.max(
        0,
        Math.ceil((new Date(stake.unlockDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );
      
      const dailyProfit = stake.amount * 0.01; // 1% daily
      const estimatedProfit = dailyProfit * daysRemaining;

      return {
        id: stake._id?.toString() || '',
        amount: stake.amount || 0,
        lockPeriod: stake.lockPeriod || 0,
        status: stake.status || 'active',
        createdAt: stake.stakedAt || stake.createdAt,
        unlockDate: stake.unlockDate,
        earnedRewards: stake.earnedRewards || 0,
        apy: stake.apy || ((Math.pow(1.01, stake.lockPeriod) - 1) * 100),
        daysRemaining,
        estimatedProfit,
        dailyProfit,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          joinDate: user.createdAt,
        },
        balances: {
          wallet: user.walletBalance || 0,
          staked: user.stakedBalance || 0,
          total: (user.walletBalance || 0) + (user.stakedBalance || 0),
        },
        stats: {
          totalDeposits: user.totalDeposits || 0,
          totalStakes: stakes.length,
          activeStakes: stakes.filter((s: any) => s.status === 'active').length,
          completedStakes: stakes.filter((s: any) => s.status !== 'active').length,
        },
        stakes: stakes.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error("❌ Statement error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}