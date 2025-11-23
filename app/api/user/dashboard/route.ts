import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Deposit from "@/lib/models/deposit";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    await connectDB();
    console.log(`⏱️ DB Connection: ${Date.now() - startTime}ms`);

    let userId = null;

    // ✅ OPTION 1: Check NextAuth Session (Google/Facebook Login)
    try {
      const session = await getServerSession(authOptions);
      
      if (session && session.user) {
        console.log("✅ NextAuth session found:", session.user.email);
        userId = (session.user as any).id;
        
        if (!userId) {
          const user = await User.findOne({ email: session.user.email });
          if (user) {
            userId = user._id.toString();
            console.log("✅ User found by email:", userId);
          }
        }
      }
    } catch (err) {
      console.log("⚠️ NextAuth session check failed:", err);
    }

    // ✅ OPTION 2: Check JWT Token (Email/Password Login)
    if (!userId) {
      try {
        const cookieStore = cookies();
        const token = (await cookieStore).get("token");
        
        console.log("🍪 Checking cookie token...");
        
        if (token && token.value) {
          console.log("🍪 Token found:", token.value.substring(0, 20) + "...");
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id;
          console.log("✅ JWT Token verified! User ID:", userId);
        } else {
          console.log("❌ No token cookie found");
        }
      } catch (err: any) {
        console.log("⚠️ JWT verification failed:", err.message);
      }
    }

    // ❌ If no authentication method worked
    if (!userId) {
      console.log("❌ No valid authentication found!");
      return NextResponse.json({ 
        error: "Unauthorized - Please login again" 
      }, { status: 401 });
    }

    const queryStart = Date.now();
    
    // ✅ Fetch user data WITH STAKING FIELDS
    const user = await User.findById(userId)
      .select('walletBalance stakedBalance totalDeposits referralCount referralEarnings levelIncome stakes')
      .lean()
      .exec();
    
    console.log(`⏱️ User Query: ${Date.now() - queryStart}ms`);

    if (!user) {
      console.log("❌ User not found in DB for ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ FETCH DEPOSITS
    const depositQueryStart = Date.now();
    const deposits = await Deposit.find({ userId })
      .select('amount status screenshot createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`⏱️ Deposit Query: ${Date.now() - depositQueryStart}ms`);
    console.log(`✅ Found ${deposits.length} deposits for user`);

    // ✅ FETCH ACTIVE STAKES
    const activeStakes = (user as any).stakes?.filter(
      (stake: any) => stake.status === "active"
    ) || [];

    console.log(`✅ Found ${activeStakes.length} active stakes for user`);
    console.log("✅ User found:", (user as any)._id);
    console.log(`⏱️ Total API Time: ${Date.now() - startTime}ms`);

    // ✅ Return response WITH deposits AND stakes
    return NextResponse.json({
      success: true,
      walletBalance: (user as any).walletBalance || 0,
      stakedBalance: (user as any).stakedBalance || 0,
      totalDeposits: (user as any).totalDeposits || 0,
      referralCount: (user as any).referralCount || 0,
      referralEarnings: (user as any).referralEarnings || 0,
      levelIncome: (user as any).levelIncome || 0,
      deposits: deposits,
      stakes: activeStakes,
      withdrawals: [],
    }, {
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