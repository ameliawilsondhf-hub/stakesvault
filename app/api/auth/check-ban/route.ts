import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { userId, email } = await req.json();

    // Construct OR conditions properly
    const orConditions: any[] = [];

    if (userId && mongoose.isValidObjectId(userId)) {
      orConditions.push({ _id: userId });
    }

    if (email) {
      orConditions.push({ email });
    }

    if (orConditions.length === 0) {
      return NextResponse.json(
        { success: false, isBanned: false, banReason: null },
        { status: 400 }
      );
    }

    const user = await User.findOne({ $or: orConditions })
      .select("isBanned banReason email");

    // ⭐ FIX: User not found ≠ Banned
    if (!user) {
      return NextResponse.json({
        success: true,
        isBanned: false,
        banReason: null,
      });
    }

    return NextResponse.json({
      success: true,
      isBanned: user.isBanned || false,
      banReason: user.banReason || null,
    });

  } catch (error: any) {
    console.error("❌ Ban check error:", error);
    return NextResponse.json(
      { success: false, isBanned: false, banReason: null },
      { status: 500 }
    );
  }
}