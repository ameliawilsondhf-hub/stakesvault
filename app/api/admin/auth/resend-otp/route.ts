import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { tempToken } = await req.json();

    if (!tempToken) {
      return NextResponse.json(
        { success: false, message: "Session token required" },
        { status: 400 }
      );
    }

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 401 }
      );
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.adminOTP = otp;
    user.adminOTPExpires = otpExpires;
    await user.save();

    // Send OTP email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/auth/send-otp-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          otp
        })
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
    }

    console.log(`🔄 Admin OTP resent for ${user.email}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "New OTP sent to your email"
    });

  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}