import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();

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
        
        if (token && token.value) {
          console.log("🍪 Token found, verifying...");
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

    // ❌ If no authentication found
    if (!userId) {
      console.log("❌ No valid authentication found!");
      return NextResponse.json({ 
        error: "Unauthorized - Please login again" 
      }, { status: 401 });
    }

    // ✅ Fetch user data
    const user = await User.findById(userId)
      .select('_id email username walletBalance')
      .lean();

    if (!user) {
      console.log("❌ User not found in DB for ID:", userId);
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 404 });
    }

    console.log("✅ User authenticated successfully:", (user as any)._id);

    return NextResponse.json({ 
      user: {
        _id: (user as any)._id,
        email: (user as any).email,
        username: (user as any).username,
        walletBalance: (user as any).walletBalance || 0,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ /api/user/me Error:", error);
    return NextResponse.json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}