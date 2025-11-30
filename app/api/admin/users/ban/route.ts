import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, ban, reason } = await req.json();

    // Check admin
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id);

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Find target user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Cannot ban admin users" },
        { status: 400 }
      );
    }

    // Update ban status
    user.isBanned = ban;
    user.banned = ban;
    user.banReason = ban ? (reason || "Violated terms of service") : "";
    user.bannedAt = ban ? new Date() : null;
    user.bannedBy = ban ? admin._id : null;

    await user.save();

    console.log(`${ban ? '🚫' : '✅'} User ${user.email} ${ban ? 'banned' : 'unbanned'} by ${admin.email}`);
    if (ban && reason) console.log(`📝 Ban reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: ban 
        ? `User banned successfully. Reason: ${reason || "N/A"}` 
        : "User unbanned successfully",
    });

  } catch (error: any) {
    console.error("❌ Ban user error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
