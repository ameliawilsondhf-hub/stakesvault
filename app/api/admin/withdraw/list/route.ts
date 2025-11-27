import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Withdraw from "@/lib/models/withdraw";
import User from "@/lib/models/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const withdrawals = await Withdraw.find()
      .populate({
        path: "userId",
        model: User,
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log("💸 Total withdrawals found:", withdrawals.length);

    // Return withdrawals as-is (Cloudinary URLs already correct)
    return NextResponse.json(withdrawals, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error("❌ WITHDRAW LIST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load withdrawals" },
      { status: 500 }
    );
  }
}