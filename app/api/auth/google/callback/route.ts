import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=no_code`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=token_failed`
      );
    }

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    const googleUser = await userInfoResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=no_email`
      );
    }

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    const isNewUser = !user;

    if (!user) {
      // Generate unique referral code
      const generateReferralCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      };

      let userReferralCode = generateReferralCode();

      // Ensure referral code is unique
      let codeExists = await User.findOne({ referralCode: userReferralCode });
      while (codeExists) {
        userReferralCode = generateReferralCode();
        codeExists = await User.findOne({ referralCode: userReferralCode });
      }

      // Create new user
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        profilePicture: googleUser.picture,
        emailVerified: true,
        googleId: googleUser.id,
        referralCode: userReferralCode,
      });

      await user.save();

      // 🎉 Send welcome email for new users
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/send-welcome-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              referralCode: user.referralCode,
            }),
          }
        );
        console.log("✅ Welcome email sent to:", user.email);
      } catch (emailError) {
        console.error("❌ Failed to send welcome email:", emailError);
        // Don't fail login if email fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Create response with redirect
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard${isNewUser ? "?welcome=true" : ""}`
    );

    // Set cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("❌ Google callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=server_error`
    );
  }
}
