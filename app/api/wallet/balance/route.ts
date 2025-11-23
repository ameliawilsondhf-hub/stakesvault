import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !mongoose.Types.ObjectId.isValid(token)) {
      return NextResponse.json({ balance: 0 });
    }

    const user = await User.findById(token);

    return NextResponse.json({
      balance: user?.walletBalance || 0,
    });

  } catch (err) {
    console.log("BALANCE API ERROR:", err);
    return NextResponse.json({ balance: 0 });
  }
}
