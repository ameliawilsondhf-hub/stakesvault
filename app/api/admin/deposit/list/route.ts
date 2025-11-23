import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";
import User from "@/lib/models/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const deposits = await Deposit.find({})
      .populate({
        path: "userId",
        model: User,
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .lean();

    // 🔥 Add full screenshot path here
    const updatedDeposits = deposits.map((d: any) => ({
      ...d,
      screenshot: d.screenshot ? `/uploads/${d.screenshot}` : null,
    }));

    return NextResponse.json({
      success: true,
      data: updatedDeposits,
    });

  } catch (error: any) {
    console.log("❌ ADMIN-LIST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load deposits",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
