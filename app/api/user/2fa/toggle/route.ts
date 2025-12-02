// File: app/api/user/2fa/toggle/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let userId: string | null = null;

    // ✅ 1️⃣ Try NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        userId = (session.user as any).id || null;
        if (!userId && session.user.email) {
          const user = await User.findOne({ email: session.user.email });
          if (user) userId = user._id.toString();
        }
      }
    } catch {}

    // ✅ 2️⃣ Try JWT cookie
    if (!userId) {
      const cookieStore = cookies();
      const token = cookieStore.get("token");
      if (token?.value) {
        const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
        userId = decoded.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 3️⃣ Parse Body
    const raw = await request.text();
    const body = JSON.parse(raw || "{}");

    const enable = !!body.enable;
    const otp = body.otp ? String(body.otp).trim() : "";

    const user = await User.findById(userId).select(
      "+twoFactorSecret +twoFactorTempSecret"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ==============================
    // ✅ ENABLE 2FA
    // ==============================
    if (enable) {
      // ✅ STEP 1: Generate QR + Manual Key
      if (!otp) {
        const secret = speakeasy.generateSecret({
          name: `StakeVault (${user.email})`,
          issuer: "StakeVault",
        });

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        user.twoFactorTempSecret = secret.base32;
        await user.save();

        return NextResponse.json({
          success: true,
          qrCode: qrCodeUrl,
          secret: secret.base32, // ✅ Manual Copy Key
          issuer: "StakeVault",
          account: user.email,
        });
      }

      // ✅ STEP 2: Verify OTP & Enable
      if (!user.twoFactorTempSecret) {
        return NextResponse.json(
          { error: "No 2FA setup in progress" },
          { status: 400 }
        );
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorTempSecret,
        encoding: "base32",
        token: otp,
        window: 2,
      });

      if (!verified) {
        return NextResponse.json(
          { error: "Invalid OTP. Please try again." },
          { status: 400 }
        );
      }

      user.twoFactorEnabled = true;
      user.twoFactorSecret = user.twoFactorTempSecret;
      user.twoFactorTempSecret = undefined;
      await user.save();

      return NextResponse.json({
        success: true,
        twoFactorEnabled: true,
        message: "✅ 2FA Enabled Successfully",
      });
    }

    // ==============================
    // ❌ DISABLE 2FA
    // ==============================
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
    }

    if (!otp) {
      return NextResponse.json(
        { error: "OTP required to disable 2FA" },
        { status: 400 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA secret missing" },
        { status: 400 }
      );
    }

    const disableVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: otp,
      window: 2,
    });

    if (!disableVerified) {
      return NextResponse.json(
        { error: "Invalid OTP. Cannot disable 2FA." },
        { status: 400 }
      );
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorTempSecret = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      twoFactorEnabled: false,
      message: "✅ 2FA Disabled Successfully",
    });
  } catch (error: any) {
    console.error("❌ 2FA toggle error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
