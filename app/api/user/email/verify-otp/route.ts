import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import { sendWelcomeEmail } from "@/lib/emails/welcomeEmail";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { otp } = await req.json();

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 6-digit OTP" },
        { status: 400 }
      );
    }

    let userEmail: string | null = null;

    // Try NextAuth session first
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user?.email) {
        userEmail = session.user.email;
      }
    } catch (err) {
      console.log("⚠️ NextAuth session check failed");
    }

    // Fallback to JWT token
    if (!userEmail) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          if (decoded.email) {
            userEmail = decoded.email;
          }
        }
      } catch (err) {
        console.log("⚠️ JWT verification failed");
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    // ✅ CRITICAL FIX: Explicitly select hidden fields
    const user = await User.findOne({ email: userEmail })
      .select('+emailOTP +emailOTPExpiry');

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("🔍 Debug - User found:", user.email);
    console.log("🔍 Debug - emailOTP exists:", !!user.emailOTP);
    console.log("🔍 Debug - emailOTPExpiry exists:", !!user.emailOTPExpiry);

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: "Email already verified" },
        { status: 400 }
      );
    }

    // Check if OTP exists
    if (!user.emailOTP) {
      console.error("❌ No OTP found in database for:", userEmail);
      return NextResponse.json(
        { success: false, message: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (!user.emailOTPExpiry || new Date() > new Date(user.emailOTPExpiry)) {
      console.error("❌ OTP expired for:", userEmail);
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    const storedOTP = String(user.emailOTP).trim();
    const providedOTP = String(otp).trim();

    console.log("🔍 Comparing OTPs:");
    console.log("  Stored:", storedOTP);
    console.log("  Provided:", providedOTP);
    console.log("  Match:", storedOTP === providedOTP);

    if (storedOTP !== providedOTP) {
      console.error("❌ OTP mismatch for:", userEmail);
      return NextResponse.json(
        { success: false, message: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    // 🎉 OTP VERIFIED - Mark email as verified
    user.emailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    await user.save();

    console.log(`✅ Email verified for: ${userEmail}`);

    // 🎉 SEND WELCOME EMAIL
    try {
      await sendWelcomeEmail({
        email: userEmail,
        name: user.name || 'User',
        referralCode: user.referralCode || ''
      });
      console.log(`📧 Welcome email sent successfully to ${userEmail}!`);
    } catch (emailError: any) {
      console.error("❌ Welcome email error:", emailError.message);
      // Don't fail verification if welcome email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully! Welcome email sent.",
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("❌ Verify OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify OTP. Please try again.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
