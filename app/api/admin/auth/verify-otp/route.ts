import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { tempToken, otp } = await req.json();

    console.log("🔍 Verifying OTP:", { otp, tempToken: tempToken ? "provided" : "missing" });

    if (!tempToken || !otp) {
      return NextResponse.json(
        { success: false, message: "OTP and token are required" },
        { status: 400 }
      );
    }

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!);
      console.log("✅ Token verified:", decoded.email);
      
      if (!decoded.temp || decoded.purpose !== "admin-otp-verification") {
        throw new Error("Invalid token purpose");
      }
    } catch (error: any) {
      console.error("❌ Token verification failed:", error.message);
      return NextResponse.json(
        { success: false, message: "Invalid or expired session. Please login again." },
        { status: 401 }
      );
    }

    // Find user and SELECT the OTP fields
    const user = await User.findById(decoded.id).select("+adminOTP +adminOTPExpires");

    console.log("👤 User found:", user?.email);
    console.log("🔐 Stored OTP:", user?.adminOTP);
    console.log("⏰ OTP Expires:", user?.adminOTPExpires);
    console.log("🕐 Current Time:", new Date());

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 401 }
      );
    }

    // Check if OTP exists
    if (!user.adminOTP) {
      console.error("❌ No OTP found in database");
      return NextResponse.json(
        { success: false, message: "No verification code found. Please request a new one." },
        { status: 401 }
      );
    }

    // Check OTP expiry
    if (!user.adminOTPExpires) {
      console.error("❌ No expiry time found");
      return NextResponse.json(
        { success: false, message: "Invalid verification code. Please request a new one." },
        { status: 401 }
      );
    }

    const now = new Date();
    const expiryTime = new Date(user.adminOTPExpires);
    
    if (now > expiryTime) {
      const expiredMinutesAgo = Math.floor((now.getTime() - expiryTime.getTime()) / 1000 / 60);
      console.error(`❌ OTP expired ${expiredMinutesAgo} minutes ago`);
      
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new one." },
        { status: 401 }
      );
    }

    // Verify OTP (compare as strings and trim whitespace)
    const storedOTP = String(user.adminOTP).trim();
    const providedOTP = String(otp).trim();
    
    console.log("🔍 Comparing OTPs:");
    console.log("  Stored:", storedOTP);
    console.log("  Provided:", providedOTP);
    console.log("  Match:", storedOTP === providedOTP);

    if (storedOTP !== providedOTP) {
      console.error("❌ OTP mismatch");
      return NextResponse.json(
        { success: false, message: "Invalid verification code. Please check and try again." },
        { status: 401 }
      );
    }

    // 🎉 OTP VERIFIED - Clear OTP and generate full token
    user.adminOTP = undefined;
    user.adminOTPExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    console.log("✅ OTP verified successfully for:", user.email);

    // Generate full access token (7 days)
    const token = jwt.sign(
      {
        id: user._id?.toString() || String(user._id),
        email: user.email,
        role: "admin",
        isAdmin: true
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful. Welcome to Admin Portal!",
      user: {
        id: user._id?.toString() || String(user._id),
        email: user.email,
        name: user.name,
        isAdmin: true,
        role: "admin"
      }
    });

    // Set admin cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    });

    console.log("✅ Admin login complete - Token set");

    return response;

  } catch (error: any) {
    console.error("❌ OTP verification error:", error);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}