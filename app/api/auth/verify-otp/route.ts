import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import * as speakeasy from "speakeasy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { tempToken, otp } = await req.json();

    console.log("📥 OTP Verification Request");
    console.log("🔑 OTP:", otp);

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
      console.log("✅ Token decoded:", { 
        id: decoded.id, 
        purpose: decoded.purpose 
      });
    } catch (err: any) {
      console.error("❌ Token verification failed:", err.message);
      return NextResponse.json(
        { success: false, message: "Session expired. Please login again." },
        { status: 401 }
      );
    }

    // ✅ FIND USER
    const user = await User.findById(decoded.id).select("+twoFactorSecret");

    if (!user) {
      console.error("❌ User not found:", decoded.id);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("👤 User found:", user.email);
    console.log("🔐 2FA Enabled:", user.twoFactorEnabled);
    console.log("🔐 Has Secret:", !!user.twoFactorSecret);

    // ✅ CHECK 2FA CONFIGURATION
    if (!user.twoFactorEnabled) {
      console.error("❌ 2FA not enabled");
      return NextResponse.json(
        { success: false, message: "2FA not enabled for this account" },
        { status: 401 }
      );
    }

    if (!user.twoFactorSecret) {
      console.error("❌ 2FA secret missing");
      return NextResponse.json(
        { success: false, message: "2FA not configured properly" },
        { status: 401 }
      );
    }

    // ✅ VERIFY GOOGLE AUTHENTICATOR OTP
    console.log("🔍 Verifying OTP...");
    
    const verified = speakeasy.totp.verify({
      secret: String(user.twoFactorSecret),
      encoding: 'base32',
      token: otp.trim(),
      window: 2
    });

    console.log("🔍 Verification result:", verified);

    if (!verified) {
      console.error("❌ Invalid OTP");
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    console.log("✅ OTP VERIFIED!");

    // ✅ CREATE FINAL LOGIN TOKEN
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.isAdmin ? "admin" : "user",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    console.log("✅ Login token generated");

    // ✅ SET AUTH COOKIE
    const response = NextResponse.json({
  success: true,
  message: "OTP verification successful",
  user: {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  },
});

response.cookies.set("token", token, {
  httpOnly: true,
  secure: false,       // ✅ localhost ke liye
  sameSite: "lax",     // ✅ STRICT ❌ yahan problem karta hai
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
});

return response;


    console.log("✅ 2FA LOGIN SUCCESS:", user.email);

    return NextResponse.json({
      success: true,
      message: "OTP verification successful",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });

  } catch (error: any) {
    console.error("❌ OTP VERIFY ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}