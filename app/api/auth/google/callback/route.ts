// ===================================================================
// 🔧 FIXED GOOGLE OAUTH WITH COMPLETE TRACKING
// File: app/api/auth/google/callback/route.ts
// ===================================================================

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import { sendLoginNotification } from "@/lib/email/loginNotification";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 🔧 Get client IP
async function getClientIP(): Promise<string> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const cfIP = headersList.get("cf-connecting-ip");
    
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    if (realIP) return realIP;
    if (cfIP) return cfIP;
    
    return "unknown";
  } catch (error) {
    console.log("⚠️ Could not get client IP");
    return "unknown";
  }
}

// 🔧 Parse User Agent
function parseUserAgent(userAgent: string) {
  let device = "Desktop";
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect OS
  if (userAgent.includes("Windows NT 10.0")) os = "Windows 10";
  else if (userAgent.includes("Windows NT 6.3")) os = "Windows 8.1";
  else if (userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

  // Detect Device
  if (/mobile/i.test(userAgent)) device = "Mobile";
  else if (/tablet/i.test(userAgent)) device = "Tablet";

  // Detect Browser
  if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";

  return { device, browser, os };
}

// 🌍 Get Location from IP
async function getLocationFromIP(ip: string): Promise<string> {
  try {
    if (ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
      return "Local Network";
    }

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'StakeVault/1.0' },
      signal: AbortSignal.timeout(3000)
    });
    
    if (!response.ok) return "Unknown Location";
    
    const data = await response.json();
    
    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    }
    return "Unknown Location";
  } catch (error) {
    return "Unknown Location";
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    // 📧 GET REQUEST INFO
    const clientIP = await getClientIP();
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const { device, browser, os } = parseUserAgent(userAgent);

    console.log(`🔐 Google OAuth attempt from ${clientIP}`);
    console.log(`📱 Device: ${device} | Browser: ${browser} | OS: ${os}`);

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

    // 🔧 GET LOCATION
    let location = "Unknown Location";
    try {
      location = await getLocationFromIP(clientIP);
    } catch (error) {
      console.log("⚠️ Could not get location");
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

      // Create new user WITH REGISTRATION INFO
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        profilePicture: googleUser.picture,
        emailVerified: true,
        googleId: googleUser.id,
        referralCode: userReferralCode,
        registrationIP: clientIP,
        registrationLocation: location,
        ipAddress: clientIP,
        currentLocation: location,
        lastLogin: new Date(),
        loginHistory: [{
          ip: clientIP,
          location: location,
          device: device,
          browser: browser,
          os: os,
          timestamp: new Date(),
          suspicious: false
        }],
        loginIPs: [{
          ip: clientIP,
          lastLogin: new Date(),
          count: 1
        }],
        loginStats: {
          totalLogins: 1,
          failedAttempts: 0,
          uniqueDevices: 1,
          uniqueLocations: 1
        }
      });

      await user.save();

      console.log(`✅ New user registered: ${user.email} from ${clientIP}`);

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
      }
    } else {
      // ✅ EXISTING USER - UPDATE LOGIN TRACKING

      user.lastLogin = new Date();
      user.ipAddress = clientIP;
      user.currentLocation = location;

      // ✅ SAVE TO LOGIN HISTORY
      if (!user.loginHistory) {
        user.loginHistory = [];
      }

      user.loginHistory.push({
        ip: clientIP,
        location: location,
        device: device,
        browser: browser,
        os: os,
        timestamp: new Date(),
        suspicious: false
      });

      // Keep only last 50 records
      if (user.loginHistory.length > 50) {
        user.loginHistory = user.loginHistory.slice(-50);
      }

      // ✅ UPDATE LOGIN IPs
      if (!user.loginIPs) {
        user.loginIPs = [];
      }

      const existingIP = user.loginIPs.find(item => item.ip === clientIP);
      if (existingIP) {
        existingIP.lastLogin = new Date();
        existingIP.count += 1;
      } else {
        user.loginIPs.push({
          ip: clientIP,
          lastLogin: new Date(),
          count: 1
        });
      }

      // ✅ UPDATE LOGIN STATS
      if (!user.loginStats) {
        user.loginStats = {
          totalLogins: 0,
          failedAttempts: 0,
          uniqueDevices: 0,
          uniqueLocations: 0
        };
      }
      
      user.loginStats.totalLogins += 1;

      await user.save();

      console.log(`✅ Login history saved for ${user.email}`);
      console.log(`📊 Total logins: ${user.loginStats.totalLogins}`);

      // 📧 SEND LOGIN NOTIFICATION FOR EXISTING USERS
      try {
        await sendLoginNotification({
          email: user.email,
          userName: user.name || googleUser.name || user.email.split('@')[0],
          ipAddress: clientIP,
          userAgent: userAgent,
          location: location,
          timestamp: new Date(),
          loginMethod: 'google',
        });
        console.log(`✅ Login notification email sent to ${user.email}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send login notification:', emailError);
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

    console.log(`✅ Google OAuth successful: ${user.email} from ${clientIP}`);

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