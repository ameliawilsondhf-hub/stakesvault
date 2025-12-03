import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { tempToken, otp } = await req.json();

    if (!tempToken || !otp) {
      return NextResponse.json(
        { success: false, message: "OTP and temp token required" },
        { status: 400 }
      );
    }

    // ✅ Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!);
      if (!decoded.temp) throw new Error("Not temp token");
    } catch {
      return NextResponse.json(
        { success: false, message: "Session expired. Login again." },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id).select("+twoFactorSecret");
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: "User not found or 2FA not setup" },
        { status: 404 }
      );
    }

    const verified = speakeasy.totp.verify({
      secret: String(user.twoFactorSecret),
      encoding: "base32",
      token: otp,
      window: 2,
    });

    if (!verified) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

   const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email,
        temp: false // <--- YE PROPERTY ZAROOR ADD KAREIN
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    const response = NextResponse.json({
      success: true,
      message: "2FA Verified. Login successful.",
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
