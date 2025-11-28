import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Stake from "@/lib/models/stake";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: Request) {
  try {
    await connectDB();

    // Get user from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'locked', 'unlocked', or null for all
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Build query
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    // Get stakes
    const stakes = await Stake.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Get total count
    const totalCount = await Stake.countDocuments(query);

    // Calculate summary stats
    const lockedStakes = await Stake.find({ userId, status: "locked" });
    const unlockedStakes = await Stake.find({ userId, status: "unlocked" });

    const totalStaked = lockedStakes.reduce((sum, stake) => sum + stake.currentAmount, 0);
    const totalUnlocked = unlockedStakes.reduce((sum, stake) => sum + stake.currentAmount, 0);
    const totalProfit = stakes.reduce((sum, stake) => sum + stake.totalProfit, 0);

    return NextResponse.json({
      success: true,
      data: {
        stakes,
        pagination: {
          total: totalCount,
          limit,
          skip,
          hasMore: totalCount > skip + limit
        },
        summary: {
          totalStaked,
          totalUnlocked,
          totalProfit,
          activeStakes: lockedStakes.length,
          unlockedStakes: unlockedStakes.length
        }
      }
    });

  } catch (error: any) {
    console.error("❌ Stakes List Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message
      },
      { status: 500 }
    );
  }
}
