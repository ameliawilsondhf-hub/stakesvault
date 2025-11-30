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

    // ✅ Check NextAuth Session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        userId = (session.user as any).id;
        if (!userId) {
          const user = await User.findOne({ email: session.user.email });
          if (user) userId = user._id.toString();
        }
      }
    } catch (err) {
      console.log("⚠️ NextAuth check failed:", err);
    }

    // ✅ Check JWT Token
    if (!userId) {
      try {
        const cookieStore = cookies();
        const token = (await cookieStore).get("token");
        
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id;
        }
      } catch (err: any) {
        console.log("⚠️ JWT verification failed:", err.message);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch user profile (don't exclude password field yet)
const user = await User.findById(userId)
  .select(`
    -password 
    -level1 
    -level2 
    -level3
    +twoFactorEnabled
    +twoFactorVerified
  `)
  .lean();


    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Check if user has password (OAuth users don't have password)
    const hasPassword = (user as any).password ? true : false;

    // ✅ Remove password from response but indicate if it exists
    const response = {
      ...(user as any),
      password: undefined, // Don't send actual password
      hasPassword: hasPassword, // But indicate if user has one
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("❌ Profile fetch error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
