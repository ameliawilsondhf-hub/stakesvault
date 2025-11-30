import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await connectDB();

    const { otp } = await req.json();
    if (!otp) {
      return NextResponse.json({ error: "OTP required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: otp,
      window: 1
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    // ✅ FINAL VERIFICATION FLAG
    const finalToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        twoFactorVerified: true
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    cookies().set("token", finalToken, {
      httpOnly: true,
      secure: true,
      path: "/"
    });

    return NextResponse.json({
      success: true,
      message: "2FA Verified Successfully"
    });

  } catch (error: any) {
    console.error("❌ OTP Verify Error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
