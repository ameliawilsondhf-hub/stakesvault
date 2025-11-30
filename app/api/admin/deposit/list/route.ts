import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";
import User from "@/lib/models/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ✅ 1. Connect DB
    await connectDB();

    // ✅ 2. Auth Check (ADMIN ONLY)
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "Server config error" },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const admin = await User.findById(decoded.id)
      .select("isAdmin")
      .lean();

    if (!admin || admin.isAdmin !== true) {
      return NextResponse.json(
        { success: false, message: "Access denied (Admin only)" },
        { status: 403 }
      );
    }

    // ✅ 3. Load Deposits (SAFE)
    const deposits = await Deposit.find({})
      .populate({
        path: "userId",
        model: User,
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .lean();

    // ✅ 4. Normalize user (null safety)
    const safeDeposits = deposits.map((d: any) => ({
      ...d,
      userId: d.userId || { name: "Deleted User", email: "N/A" },
    }));

    // ✅ 5. Return Clean Response
    return NextResponse.json(safeDeposits, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error: any) {
    console.error("❌ ADMIN-DEPOSIT-LIST ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load deposits" },
      { status: 500 }
    );
  }
}
