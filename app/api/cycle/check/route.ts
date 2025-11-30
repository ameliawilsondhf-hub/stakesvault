import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Stake from "@/lib/models/stake";
import User from "@/lib/models/user";
import { cycleData } from "@/lib/config/cycles";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ FIXED VERSION — await cookies()
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("token")?.value;

    const body = await req.json().catch(() => ({}));
    const token = body.token || cookieToken;

    if (!token)
      return NextResponse.json({ error: "No token found" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decoded as any).id;

    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const lastStake = await Stake.findOne({ userId }).sort({ createdAt: -1 });
    if (!lastStake) {
      return NextResponse.json({
        success: true,
        nextCycle: 1,
        message: "No stake found, start with cycle 1",
      });
    }

    const now = new Date();
    const completed =
      new Date(lastStake.unlockDate) <= now &&
      lastStake.status === "unlocked";

    let nextCycle = lastStake.cycle;
    if (completed && lastStake.cycle < 3) {
      nextCycle = lastStake.cycle + 1;
    }

    return NextResponse.json({
      success: true,
      activeCycle: lastStake.cycle,
      nextCycle,
      completed,
    });
  } catch (err) {
    console.error("Cycle check error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}