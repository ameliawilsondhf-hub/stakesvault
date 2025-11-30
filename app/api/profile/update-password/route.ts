import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await connectDB();

    const { newPassword } = await req.json();
    if (!newPassword) {
      return NextResponse.json(
        { message: "Password required" },
        { status: 400 }
      );
    }

    // ✔️ FIX — First get cookieStore
    const cookieStore = await cookies();

    // ✔️ FIX — Now safely read token
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not logged in" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findOne({ email: token });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();

    return NextResponse.json({
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.log("PASSWORD UPDATE ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}