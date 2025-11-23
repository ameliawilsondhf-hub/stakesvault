import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      // ✅ Security: Don't reveal if email exists
      return NextResponse.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    // ✅ Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // ✅ Save token with 1 hour expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // ✅ Send email
    await sendPasswordResetEmail(email, resetToken, user.name);

    console.log("✅ Password reset email sent to:", email);

    return NextResponse.json({
      success: true,
      message: "Password reset link sent to your email",
    });

  } catch (error: any) {
    console.error("❌ Forgot password error:", error);
    return NextResponse.json(
      { message: "Failed to send reset email", error: error.message },
      { status: 500 }
    );
  }
}