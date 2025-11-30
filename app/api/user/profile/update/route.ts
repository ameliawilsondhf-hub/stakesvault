import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
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

    // ✅ Get update data
    const body = await request.json();
    const { name, phone, dateOfBirth, address, city, country, postalCode } = body;

    // ✅ Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        phone,
        dateOfBirth,
        address,
        city,
        country,
        postalCode,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ Profile updated for user:", user.email);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });

  } catch (error: any) {
    console.error("❌ Profile update error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}