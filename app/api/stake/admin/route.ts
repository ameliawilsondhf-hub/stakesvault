import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    // Check admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, msg: "No cookie token" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, msg: "JWT SECRET missing" },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return NextResponse.json(
        { success: false, msg: "Invalid token" },
        { status: 401 }
      );
    }

    // Verify admin
    const adminUser = await User.findById(decoded.id);

    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json(
        { success: false, msg: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ Admin verified, fetching all stakes...");

    // Fetch all users with stakes
    const users = await User.find({ 
      "stakes.0": { $exists: true } 
    })
    .select('name email stakes')
    .lean();

    console.log(`📊 Found ${users.length} users with stakes`);

    // Flatten all stakes with user info
    const allStakes = users.flatMap((user: any) => 
      (user.stakes || []).map((stake: any) => ({
        _id: stake._id?.toString() || Math.random().toString(),
        amount: stake.amount || 0,
        stakedAt: stake.stakedAt,
        unlockDate: stake.unlockDate,
        lockPeriod: stake.lockPeriod || 0,
        status: stake.status || 'active',
        apy: stake.apy || 0,
        earnedRewards: stake.earnedRewards || 0,
        userId: {
          _id: user._id.toString(),
          name: user.name || 'Unknown',
          email: user.email || 'N/A',
        }
      }))
    );

    // Sort by staked date (newest first)
    allStakes.sort((a: any, b: any) => 
      new Date(b.stakedAt).getTime() - new Date(a.stakedAt).getTime()
    );

    console.log(`✅ Returning ${allStakes.length} total stakes`);

    return NextResponse.json({
      success: true,
      stakes: allStakes,
      total: allStakes.length
    });

  } catch (err: any) {
    console.error("❌ Admin Stakes Error:", err);
    return NextResponse.json(
      { success: false, msg: "Server error", error: err.message },
      { status: 500 }
    );
  }
}