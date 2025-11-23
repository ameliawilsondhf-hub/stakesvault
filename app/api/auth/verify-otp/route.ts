import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";

export async function POST(request: Request) {
  try {
    await connectDB();

    const { tempToken, otp } = await request.json();

    if (!tempToken || !otp) {
      return NextResponse.json(
        { message: "Token and OTP are required" },
        { status: 400 }
      );
    }

    // ✅ Verify temporary token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid or expired session. Please login again." },
        { status: 401 }
      );
    }

    // ✅ Check if it's a temp 2FA token
    if (!decoded.temp2FA) {
      return NextResponse.json(
        { message: "Invalid token type" },
        { status: 401 }
      );
    }

    // ✅ Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { message: "Two-factor authentication is not enabled" },
        { status: 400 }
      );
    }

    // ✅ Verify OTP code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: otp,
      window: 2, // Allow 2 time steps before/after (60 seconds)
    });

    if (!isValid) {
      console.log("❌ Invalid OTP code for user:", user.email);
      return NextResponse.json(
        { message: "Invalid authentication code. Please try again." },
        { status: 401 }
      );
    }

    // ✅ OTP verified! Create real session token
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    console.log("✅ 2FA verification successful for:", user.email);
    console.log("🎫 Token created:", token.substring(0, 20) + "...");

    const response = NextResponse.json({
      success: true,
      message: "Two-factor authentication successful",
      userId: user._id.toString(),
    });

    // ✅ Set cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("✅ Cookie set successfully");

    return response;

  } catch (error: any) {
    console.error("❌ OTP verification error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}