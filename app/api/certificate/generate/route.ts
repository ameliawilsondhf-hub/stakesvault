import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ IMPORT authOptions
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/lib/models/user";

export async function GET() {
  try {
    await connectDB();

    let userEmail = null;

    // Try NextAuth Session first (Google/Facebook OAuth login)
    const session = await getServerSession(authOptions); // ✅ PASS authOptions
    if (session?.user?.email) {
      userEmail = session.user.email;
      console.log("✅ Authenticated via NextAuth:", userEmail);
    }

    // Fallback to JWT Token (Manual login)
    if (!userEmail) {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;

      if (token && process.env.JWT_SECRET) {
        try {
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id).select("email");
          if (user?.email) {
            userEmail = user.email;
            console.log("✅ Authenticated via JWT:", userEmail);
          }
        } catch (jwtError) {
          console.log("⚠️ JWT verification failed");
        }
      }
    }

    if (!userEmail) {
      console.log("❌ No authentication found");
      return NextResponse.json(
        { success: false, message: "Not authenticated. Please login again." },
        { status: 401 }
      );
    }

    // Get user data by email (works for both OAuth and manual login)
    const user = await User.findOne({ email: userEmail }).select(
      "name email walletBalance stakedBalance totalDeposits stakes createdAt"
    );

    if (!user) {
      console.log("❌ User not found for email:", userEmail);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("✅ User found:", user.email);

    // Calculate statistics
    const totalStaked = user.stakedBalance || 0;
    const totalDeposits = user.totalDeposits || 0;
    const activeStakes = user.stakes?.filter((s: any) => s.status === "active").length || 0;
    const completedStakes = user.stakes?.filter((s: any) => s.status !== "active").length || 0;
    
    // Calculate total earnings
    const totalEarnings = user.stakes?.reduce((sum: number, stake: any) => {
      return sum + (stake.earnedRewards || 0);
    }, 0) || 0;

    // Calculate growth percentage
    const growthPercentage = totalDeposits > 0 
      ? (((totalStaked + totalEarnings) - totalDeposits) / totalDeposits * 100).toFixed(2)
      : "0.00";

    const certificateData = {
      user: {
        name: user.name,
        email: user.email,
        joinDate: user.createdAt,
      },
      stats: {
        totalDeposits: totalDeposits,
        totalStaked: totalStaked,
        totalEarnings: totalEarnings,
        activeStakes: activeStakes,
        completedStakes: completedStakes,
        growthPercentage: growthPercentage,
        currentBalance: user.walletBalance,
      },
      generatedAt: new Date().toISOString(),
    };

    console.log("✅ Certificate data generated successfully");

    return NextResponse.json({
      success: true,
      data: certificateData,
    });

  } catch (error: any) {
    console.error("❌ Certificate generation error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}