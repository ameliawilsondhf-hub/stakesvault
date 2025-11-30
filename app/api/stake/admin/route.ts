import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Stake from "@/lib/models/stake";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: Request) {
  try {
    await connectDB();

    // ✅ Auth Token
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

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId || decoded.id;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // ✅ Admin Check
    const admin = await User.findById(userId);
    if (!admin || (!admin.isAdmin && admin.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        {
          status: 403,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // ✅ Query Params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId_filter = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = parseInt(searchParams.get("skip") || "0");

    // ✅ Load Users With Stakes
    const users = await User.find({
      stakes: { $exists: true, $ne: [] },
    }).select("name email walletBalance stakedBalance stakes");

    // ✅ Flatten Stakes
    const allStakes: any[] = [];

    users.forEach((user) => {
      if (user.stakes?.length) {
        user.stakes.forEach((stake: any) => {
          allStakes.push({
            _id: stake._id || `${user._id}-${stake.stakedAt}`,
            userId: {
              _id: user._id,
              name: user.name,
              email: user.email,
              walletBalance: user.walletBalance,
              stakedBalance: user.stakedBalance,
            },
            amount: stake.amount,
            originalAmount: stake.amount,
            currentAmount: stake.amount,
            stakedAt: stake.stakedAt,
            unlockDate: stake.unlockDate,
            lockPeriod: stake.lockPeriod,
            status: stake.status,
            apy: stake.apy,
            earnedRewards: stake.earnedRewards || 0,
            totalProfit: stake.earnedRewards || 0,
            cycle: 1,
          });
        });
      }
    });

    // ✅ Filters
    let filteredStakes = allStakes;

    if (status) {
      filteredStakes = filteredStakes.filter((s) => s.status === status);
    }

    if (userId_filter) {
      filteredStakes = filteredStakes.filter(
        (s) => s.userId._id.toString() === userId_filter
      );
    }

    // ✅ Sorting
    filteredStakes.sort(
      (a, b) =>
        new Date(b.stakedAt).getTime() - new Date(a.stakedAt).getTime()
    );

    // ✅ Pagination
    const paginatedStakes = filteredStakes.slice(skip, skip + limit);

    // ✅ Profit Calculations
    const calculateCurrentBalance = (amount: number, startDate: Date) => {
      const daysPassed = Math.floor(
        (new Date().getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return amount * Math.pow(1.01, daysPassed);
    };

    const activeStakes = allStakes.filter((s) => s.status === "active");

    const totalValueLocked = activeStakes.reduce((sum, stake) => {
      return sum + calculateCurrentBalance(stake.amount, new Date(stake.stakedAt));
    }, 0);

    const totalProfitGenerated = allStakes.reduce((sum, stake) => {
      const current = calculateCurrentBalance(
        stake.amount,
        new Date(stake.stakedAt)
      );
      return sum + (current - stake.amount);
    }, 0);

    const platformStats = {
      totalStakes: allStakes.length,
      activeStakes: activeStakes.length,
      unlockedStakes: allStakes.filter((s) => s.status !== "active").length,
      totalValueLocked,
      totalProfitGenerated,
      averageStakeAmount:
        allStakes.length > 0
          ? allStakes.reduce((sum, stake) => sum + stake.amount, 0) /
            allStakes.length
          : 0,
      totalUsers: users.length,
    };

    // ✅ FINAL RESPONSE (ANTI-CACHE ✅)
    return NextResponse.json(
      {
        success: true,
        stakes: paginatedStakes,
        pagination: {
          total: filteredStakes.length,
          limit,
          skip,
          hasMore: filteredStakes.length > skip + limit,
        },
        platformStats,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Admin Stakes Error:", error);
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