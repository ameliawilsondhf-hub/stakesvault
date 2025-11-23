import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await connectDB();

    let userId = null;

    // ✅ Check NextAuth Session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        userId = (session.user as any).id;
        if (!userId) {
          const user = await User.findOne({ email: session.user.email });
          if (user) userId = user._id.toString();
        }
      }
    } catch (err) {
      console.log("⚠️ NextAuth check failed:", err);
    }

    // ✅ Check JWT Token
    if (!userId) {
      try {
        const cookieStore = cookies();
        const token = (await cookieStore).get("token");
        
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id;
        }
      } catch (err: any) {
        console.log("⚠️ JWT verification failed:", err.message);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get enable/disable flag
    const { enable } = await request.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (enable) {
      // ✅ ENABLE 2FA - Generate secret and QR code
      const secret = speakeasy.generateSecret({
        name: `StakeVault (${user.email})`,
        issuer: "StakeVault",
      });

      // ✅ Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString("hex").toUpperCase()
      );

      // ✅ Generate QR Code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // ✅ Save to database
      user.twoFactorEnabled = true;
      user.twoFactorSecret = secret.base32;
      user.twoFactorBackupCodes = backupCodes;
      await user.save();

      console.log("✅ Two-factor enabled for user:", user.email);

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication enabled",
        twoFactorEnabled: true,
        qrCode: qrCodeUrl,
        secret: secret.base32,
        backupCodes: backupCodes,
      });

    } else {
      // ✅ DISABLE 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.twoFactorBackupCodes = undefined;
      await user.save();

      console.log("✅ Two-factor disabled for user:", user.email);

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication disabled",
        twoFactorEnabled: false,
      });
    }

  } catch (error: any) {
    console.error("❌ Two-factor toggle error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}