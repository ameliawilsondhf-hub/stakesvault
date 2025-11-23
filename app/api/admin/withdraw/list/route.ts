import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Withdraw from "@/lib/models/withdraw";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const withdrawals = await Withdraw.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    console.log("💸 Total withdrawals found:", withdrawals.length);

    // Format data for frontend
    const formatted = withdrawals.map((w: any) => ({
      _id: w._id.toString(),
      userId: w.userId ? {
        _id: w.userId._id?.toString() || "",
        name: w.userId.name || "Unknown",
        email: w.userId.email || "N/A"
      } : null,
      amount: w.amount,
      walletAddress: w.walletAddress || "",
      status: w.status,
      qrImage: w.qrImage || null,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));

    return NextResponse.json(formatted);

  } catch (error: any) {
    console.error("❌ WITHDRAW LIST ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load withdraw list", error: error.message },
      { status: 500 }
    );
  }
}