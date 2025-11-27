import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

// In-memory rate limiting (per email)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute in milliseconds

export async function POST(request: Request) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Check rate limit
    const now = Date.now();
    const lastRequestTime = rateLimitMap.get(email);

    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_DURATION) {
      const remainingTime = Math.ceil((RATE_LIMIT_DURATION - (now - lastRequestTime)) / 1000);
      
      return NextResponse.json(
        {
          success: false,
          message: `Please wait ${remainingTime} seconds before requesting another reset link`,
          remainingTime,
          rateLimited: true
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      // Security: Don't reveal if email exists, but still enforce rate limit
      rateLimitMap.set(email, now);
      
      return NextResponse.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token with 1 hour expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send email
    await sendPasswordResetEmail(email, resetToken, user.name);

    // Update rate limit map
    rateLimitMap.set(email, now);

    // Cleanup old entries (optional, to prevent memory leak)
    if (rateLimitMap.size > 1000) {
      const cutoffTime = now - RATE_LIMIT_DURATION;
      const entries = Array.from(rateLimitMap.entries());
      for (const [key, value] of entries) {
        if (value < cutoffTime) {
          rateLimitMap.delete(key);
        }
      }
    }

    console.log("✅ Password reset email sent to:", email);

    return NextResponse.json({
      success: true,
      message: "Password reset link sent to your email",
    });

  } catch (error: any) {
    console.error("❌ Forgot password error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to send reset email", 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}