// File: /app/api/user/2fa/toggle/route.ts

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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    console.log("📥 2FA Toggle Request Received");
    
    await connectDB();
    console.log("✅ Database Connected");

    let userId = null;

    // Check NextAuth Session
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        userId = (session.user as any).id;
        if (!userId) {
          const user = await User.findOne({ email: session.user.email });
          if (user) userId = user._id.toString();
        }
        console.log("✅ User authenticated via NextAuth:", userId);
      }
    } catch (err) {
      console.log("⚠️ NextAuth check failed:", err);
    }

    // Check JWT Token
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        
        if (token?.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id;
          console.log("✅ User authenticated via JWT:", userId);
        }
      } catch (err) {
        console.log("⚠️ JWT verification failed:", err);
      }
    }

    if (!userId) {
      console.log("❌ No authentication found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let requestBody;
    try {
      const text = await request.text();
      console.log("📄 Raw request body:", text);
      
      if (!text || text.trim() === "") {
        console.log("❌ Empty request body");
        return NextResponse.json(
          { error: "Request body is empty" },
          { status: 400 }
        );
      }
      
      requestBody = JSON.parse(text);
      console.log("✅ Parsed body:", requestBody);
    } catch (error) {
      console.error("❌ Failed to parse JSON:", error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { enable } = requestBody;

    if (typeof enable !== "boolean") {
      console.log("❌ Invalid 'enable' value:", enable);
      return NextResponse.json(
        { error: "'enable' must be a boolean (true or false)" },
        { status: 400 }
      );
    }

    console.log(`🔄 Toggling 2FA: ${enable ? "ENABLE" : "DISABLE"}`);

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (enable) {
      // ENABLE 2FA
      const secret = speakeasy.generateSecret({
        name: `StakeVault (${user.email})`,
        issuer: "StakeVault",
      });

      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString("hex").toUpperCase()
      );

      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      user.twoFactorEnabled = true;
      user.twoFactorSecret = secret.base32;
      user.twoFactorBackupCodes = backupCodes;
      await user.save();

      console.log("✅ 2FA enabled for:", user.email);

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication enabled",
        twoFactorEnabled: true,
        qrCode: qrCodeUrl,
        secret: secret.base32,
        backupCodes: backupCodes,
      });

    } else {
      // DISABLE 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.twoFactorBackupCodes = undefined;
      await user.save();

      console.log("✅ 2FA disabled for:", user.email);

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication disabled",
        twoFactorEnabled: false,
      });
    }

  } catch (error: any) {
    console.error("❌ Server error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}