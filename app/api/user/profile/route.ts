import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();

    let userId = null;

    // ✅ Strategy 1: Check NextAuth Session first
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        // Try to get ID from session
        userId = (session.user as any).id;
        
        // If no ID in session, find by email
        if (!userId && session.user.email) {
          const user = await User.findOne({ email: session.user.email }).select('_id').lean();
          if (user) userId = user._id.toString();
        }
      }
    } catch (err) {
      console.log("⚠️ NextAuth check failed:", err);
    }

    // ✅ Strategy 2: Check JWT Token if NextAuth failed
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        
        if (token?.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id || decoded.userId;
        }
      } catch (err: any) {
        console.log("⚠️ JWT verification failed:", err.message);
      }
    }

    // ❌ No valid authentication found
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please login again" }, 
        { status: 401 }
      );
    }

    // ✅ Fetch user profile with all required fields
    const user = await User.findById(userId)
      .select(`
        name 
        email 
        phone 
        country 
        emailVerified 
        twoFactorEnabled 
        twoFactorVerified
        provider
        createdAt
        updatedAt
      `)
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found", message: "Account does not exist" }, 
        { status: 404 }
      );
    }

    // ✅ Check if user has password (OAuth users don't have password field)
    const fullUser = await User.findById(userId).select('password').lean();
    const hasPassword = fullUser && (fullUser as any).password ? true : false;

    // ✅ Build safe response object
    const profileData = {
      id: userId,
      name: (user as any).name || "",
      email: (user as any).email || "",
      phone: (user as any).phone || "",
      country: (user as any).country || "",
      emailVerified: (user as any).emailVerified || false,
      twoFactorEnabled: (user as any).twoFactorEnabled || false,
      twoFactorVerified: (user as any).twoFactorVerified || false,
      hasPassword: hasPassword,
      provider: (user as any).provider || "credentials",
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };

    return NextResponse.json(profileData, { status: 200 });

  } catch (error: any) {
    console.error("❌ Profile API Error:", error);
    
    // Handle specific errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: "Invalid token", message: "Please login again" },
        { status: 401 }
      );
    }
    
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: "Token expired", message: "Session expired, please login again" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Server error", message: "Something went wrong", details: error.message },
      { status: 500 }
    );
  }
}