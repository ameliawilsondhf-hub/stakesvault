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

    // Return deposits directly as array
    return NextResponse.json(deposits, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error("❌ ADMIN-LIST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load deposits" },
      { status: 500 }
    );
  }
}