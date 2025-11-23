import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import Stake from "@/lib/models/stake";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { userId, withdrawAmount } = await req.json();

    const stake = await Stake.findOne({ userId });
    if (!stake) return NextResponse.json({ success: false, msg: "No stake found" });

    if (stake.status !== "unlocked")
      return NextResponse.json({ success: false, msg: "Stake is locked" });

    if (withdrawAmount > stake.amount)
      return NextResponse.json({ success: false, msg: "Insufficient stake balance" });

    // Deduct amount
    stake.amount -= withdrawAmount;

    // Auto lock again for 30 days
    const now = new Date();
    stake.startDate = now;
    stake.unlockDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    stake.lastProfitDate = now;
    stake.status = "locked";
    stake.autoLockCheckDate = stake.unlockDate;

    await stake.save();

    return NextResponse.json({ success: true, stake });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}
