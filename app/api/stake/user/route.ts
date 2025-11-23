import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Stake from "@/lib/models/stake";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, msg: "No cookie token" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, msg: "JWT SECRET missing" },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return NextResponse.json(
        { success: false, msg: "Invalid token" },
        { status: 401 }
      );
    }

    const stakes = await Stake.find({ userId: decoded.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      stakes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, msg: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
