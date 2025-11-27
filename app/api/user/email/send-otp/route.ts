import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

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

    // Find user in database
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    user.emailOTP = otp;
    user.emailOTPExpiry = otpExpiry;
    await user.save();

    console.log(`✅ OTP saved for ${userEmail}: ${otp} (Expires: ${otpExpiry})`);

    // Send OTP via Resend
    try {
      const { data, error } = await resend.emails.send({
        from: 'StakeVault <support@stakesvault.com>', 
        to: [userEmail],
        subject: "Email Verification - OTP Code",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                background-color: #f4f4f4; 
                padding: 20px; 
                margin: 0; 
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
              }
              .header { 
                text-align: center; 
                padding-bottom: 20px; 
                border-bottom: 2px solid #8b5cf6; 
              }
              .header h1 { 
                color: #8b5cf6; 
                margin: 0; 
              }
              .content { 
                padding: 30px 0; 
                text-align: center; 
              }
              .otp-box { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                font-size: 32px; 
                font-weight: bold; 
                padding: 20px; 
                border-radius: 10px; 
                letter-spacing: 8px; 
                margin: 20px 0; 
              }
              .info { 
                color: #666; 
                font-size: 14px; 
                margin-top: 20px; 
              }
              .footer { 
                text-align: center; 
                padding-top: 20px; 
                border-top: 1px solid #eee; 
                color: #999; 
                font-size: 12px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Email Verification</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #333;">Hello <strong>${user.name || 'User'}</strong>,</p>
                <p style="color: #666;">Please use the following OTP to verify your email address:</p>
                <div class="otp-box">${otp}</div>
                <p class="info">⏰ This code will expire in <strong>10 minutes</strong></p>
                <p class="info">If you didn't request this, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} StakeVault. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("❌ Resend error:", error);
        return NextResponse.json(
          { success: false, message: "Failed to send OTP email" },
          { status: 500 }
        );
      }

      console.log(`📧 OTP email sent via Resend to ${userEmail}`);
      console.log(`📨 Email ID:`, data?.id);

    } catch (emailError: any) {
      console.error("❌ Email send error:", emailError);
      return NextResponse.json(
        { success: false, message: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Send OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send OTP. Please try again.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}