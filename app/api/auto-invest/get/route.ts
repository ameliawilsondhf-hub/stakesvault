import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/lib/models/user";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    // Get JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not logged in" },
        { status: 401 }
      );
    }

    // Verify token
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    let userId;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (jwtError: any) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get user settings
    const user = await User.findById(userId).select('autoInvestEnabled autoInvestSettings');

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: user.autoInvestEnabled || false,
        settings: user.autoInvestSettings || {
          enabled: false,
          lockPeriod: 30,
          minAmount: 100
        }
      }
    });

  } catch (error: any) {
    console.error("❌ Auto-invest get error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}