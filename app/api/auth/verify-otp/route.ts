import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { tempToken, otp } = await req.json();

    if (!tempToken || !otp) {
      return NextResponse.json(
        { success: false, message: "OTP and session token are required" },
        { status: 400 }
      );
    }

    // ✅ VERIFY TEMP TOKEN
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Session expired. Please login again." },
        { status: 401 }
      );
    }

    // ✅ MUST BE ADMIN OTP TOKEN
    if (!decoded.temp || decoded.purpose !== "admin-otp-verification") {
      return NextResponse.json(
        { success: false, message: "Invalid OTP session" },
        { status: 401 }
      );
    }

    // ✅ FIND ADMIN USER
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    // ✅ CHECK OTP
    if (
      !user.adminOTP ||
      !user.adminOTPExpires ||
      user.adminOTP !== otp ||
      new Date(user.adminOTPExpires) < new Date()
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    // ✅ CLEAR OTP
    user.adminOTP = undefined;
    user.adminOTPExpires = undefined;
    await user.save();

    // ✅ CREATE FINAL LOGIN TOKEN
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: "admin",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // ✅ SET AUTH COOKIE
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    console.log("✅ ADMIN LOGIN SUCCESS:", user.email);

    return NextResponse.json({
      success: true,
      message: "Admin login successful",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });

  } catch (error: any) {
    console.error("❌ ADMIN OTP VERIFY ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
