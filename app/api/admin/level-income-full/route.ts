import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function GET() {
  try {
    await connectDB();

    // ✅ AUTH CHECK
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token" }, 
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const admin = await User.findById(decoded.id);

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin only" }, 
        { status: 403 }
      );
    }

    // ✅ GET ALL USERS WITH REFERRAL INFO AND LEVEL ARRAYS
    const users: any[] = await User.find({})
      .select("_id name email referredBy levelIncome referralEarnings level1 level2 level3 createdAt")
      .lean();

    // ✅ CREATE USER MAP FOR FASTER LOOKUP
    const userMap = new Map();
    users.forEach(u => userMap.set(String(u._id), u));

    // ✅ HELPER: Get user details from ID array
    const getUsersFromIds = (ids: any[]) => {
      if (!ids || ids.length === 0) return [];
      return ids.map(id => userMap.get(String(id))).filter(Boolean);
    };

    // ✅ BUILD FULL LEVEL STRUCTURE USING LEVEL ARRAYS
    const result = users.map((user: any) => {
      // ✅ USE EXISTING LEVEL ARRAYS FROM DATABASE
      const level1 = getUsersFromIds(user.level1 || []);
      const level2 = getUsersFromIds(user.level2 || []);
      const level3 = getUsersFromIds(user.level3 || []);

      // ✅ CALCULATE INCOME FROM ACTUAL USER DATA
      // Each level user's income contributes to this user's levelIncome
      const level1Income = level1.reduce(
        (sum: number, u: any) => sum + (u.levelIncome || 0) + (u.referralEarnings || 0), 
        0
      ) * 0.10; // 10% of total earnings

      const level2Income = level2.reduce(
        (sum: number, u: any) => sum + (u.levelIncome || 0) + (u.referralEarnings || 0), 
        0
      ) * 0.05; // 5% of total earnings

      const level3Income = level3.reduce(
        (sum: number, u: any) => sum + (u.levelIncome || 0) + (u.referralEarnings || 0), 
        0
      ) * 0.02; // 2% of total earnings

      // ✅ USE ACTUAL STORED VALUES FROM DATABASE
      const storedLevelIncome = user.levelIncome || 0;
      const storedReferralEarnings = user.referralEarnings || 0;

      return {
        user: {
          _id: user._id,
          name: user.name || "Unknown User",
          email: user.email
        },

        // ✅ LEVEL USERS WITH THEIR INCOME
        level1Users: level1.map(u => ({
          _id: u._id,
          name: u.name || "Unknown User",
          email: u.email,
          income: (u.levelIncome || 0) + (u.referralEarnings || 0)
        })),

        level2Users: level2.map(u => ({
          _id: u._id,
          name: u.name || "Unknown User",
          email: u.email,
          income: (u.levelIncome || 0) + (u.referralEarnings || 0)
        })),

        level3Users: level3.map(u => ({
          _id: u._id,
          name: u.name || "Unknown User",
          email: u.email,
          income: (u.levelIncome || 0) + (u.referralEarnings || 0)
        })),

        // ✅ LEVEL INCOME BREAKDOWN (from database)
        level1Income: 0, // Not calculated, use stored value
        level2Income: 0, // Not calculated, use stored value
        level3Income: 0, // Not calculated, use stored value

        // ✅ COUNTS
        level1Count: level1.length,
        level2Count: level2.length,
        level3Count: level3.length,

        // ✅ TEAM SIZE
        teamSize: level1.length + level2.length + level3.length,

        // ✅ USE STORED VALUES FROM DATABASE
        levelIncome: Number(storedLevelIncome.toFixed(2)),
        referralEarnings: Number(storedReferralEarnings.toFixed(2)),
        totalEarnings: Number((storedLevelIncome + storedReferralEarnings).toFixed(2)),

        // ✅ METADATA
        createdAt: user.createdAt || new Date().toISOString()
      };
    });

    // ✅ SORT BY TOTAL EARNINGS (highest first)
    const sortedResult = result.sort(
      (a: any, b: any) => b.totalEarnings - a.totalEarnings
    );

    return NextResponse.json({
      success: true,
      users: sortedResult,
      summary: {
        totalUsers: users.length,
        totalLevelIncome: sortedResult.reduce((sum: number, u: any) => sum + u.levelIncome, 0),
        totalReferralEarnings: sortedResult.reduce((sum: number, u: any) => sum + u.referralEarnings, 0),
        totalEarnings: sortedResult.reduce((sum: number, u: any) => sum + u.totalEarnings, 0)
      }
    });

  } catch (err: any) {
    console.error("❌ LEVEL INCOME API ERROR:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}