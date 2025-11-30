// ===================================================================
// 🔧 FIXED ADMIN LOGIN WITH COMPLETE TRACKING
// File: app/api/admin/auth/login/route.ts
// ===================================================================

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/lib/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { headers } from "next/headers";
import { sendLoginNotification } from "@/lib/email/loginNotification";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 🔥 IP BLOCKING CONFIGURATION
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 60 * 60 * 1000; // 60 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

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

// 🔥 Check if IP is blocked
async function checkIPBlocked(ip: string, email?: string) {
  const usersWithBlockedIP = await User.find({
    'blockedIPs.ip': ip,
    'blockedIPs.expiresAt': { $gt: new Date() }
  });

  if (usersWithBlockedIP.length > 0) {
    const user = usersWithBlockedIP[0];
    const blockedIP = user.blockedIPs?.find(
      (blocked: any) => blocked.ip === ip && new Date(blocked.expiresAt) > new Date()
    );
    
    if (blockedIP) {
      const remainingTime = Math.ceil((new Date(blockedIP.expiresAt).getTime() - Date.now()) / 60000);
      return {
        blocked: true,
        expiresAt: blockedIP.expiresAt,
        remainingMinutes: remainingTime,
        reason: blockedIP.reason,
        attemptCount: blockedIP.attemptCount
      };
    }
  }

  return { blocked: false };
}

// 🔥 Record failed login attempt
async function recordFailedLogin(ip: string, email: string) {
  const user = await User.findOne({ email });
  if (!user) return { shouldBlock: false, remainingAttempts: MAX_ATTEMPTS };

  user.failedLoginAttempts = user.failedLoginAttempts || [];
  user.blockedIPs = user.blockedIPs || [];

  (user.failedLoginAttempts as any).push({
    ip,
    attemptTime: new Date(),
    email
  });

  const fiveMinutesAgo = new Date(Date.now() - ATTEMPT_WINDOW);
  user.failedLoginAttempts = user.failedLoginAttempts.filter(
    (attempt: any) => new Date(attempt.attemptTime) > fiveMinutesAgo
  );

  const recentAttempts = user.failedLoginAttempts.filter(
    (attempt: any) => attempt.ip === ip
  ).length;

  const remainingAttempts = MAX_ATTEMPTS - recentAttempts;

  if (recentAttempts >= MAX_ATTEMPTS) {
    user.blockedIPs = user.blockedIPs.filter((blocked: any) => blocked.ip !== ip);

    const expiresAt = new Date(Date.now() + BLOCK_DURATION);
    (user.blockedIPs as any).push({
      ip,
      blockedAt: new Date(),
      expiresAt,
      reason: `Too many failed admin login attempts (${recentAttempts} attempts)`,
      attemptCount: recentAttempts
    });

    await user.save();

    return {
      shouldBlock: true,
      remainingAttempts: 0,
      expiresAt,
      remainingMinutes: Math.ceil(BLOCK_DURATION / 60000),
      attemptCount: recentAttempts
    };
  }

  await user.save();

  return {
    shouldBlock: false,
    remainingAttempts,
    recentAttempts
  };
}

// 🔥 Clear failed attempts on successful login
async function clearFailedAttempts(email: string) {
  const user = await User.findOne({ email });
  if (!user) return;

  user.failedLoginAttempts = [];
  await user.save();
}

// 🔥 Send OTP Email
async function sendOTPEmail(email: string, name: string, otp: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/auth/send-otp-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, otp })
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email & password required" },
        { status: 400 }
      );
    }

    // 🔧 GET CLIENT INFO
    const clientIP = await getClientIP();
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const { device, browser, os } = parseUserAgent(userAgent);

    console.log(`🔐 Admin login attempt: ${email} from ${clientIP}`);
    console.log(`📱 Device: ${device} | Browser: ${browser} | OS: ${os}`);

    // 🔥 CHECK IF IP IS BLOCKED
    const blockStatus = await checkIPBlocked(clientIP, email);
    
    if (blockStatus.blocked) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          ipBlocked: true,
          remainingMinutes: blockStatus.remainingMinutes,
          expiresAt: blockStatus.expiresAt,
          message: `Too many failed attempts. Your IP is blocked for ${blockStatus.remainingMinutes} minutes.`,
          attemptCount: blockStatus.attemptCount,
          reason: blockStatus.reason
        },
        { status: 403 }
      );
    }

    // 🔥 FIND ADMIN USER
    const user = await User.findOne({ email }).select("+password") as IUser;

    if (!user) {
      const failResult = await recordFailedLogin(clientIP, email);
      
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
          remainingAttempts: failResult.remainingAttempts,
          recentAttempts: failResult.recentAttempts,
          blocked: failResult.shouldBlock,
          ...(failResult.shouldBlock && {
            ipBlocked: true,
            expiresAt: failResult.expiresAt,
            remainingMinutes: failResult.remainingMinutes,
            message: `Too many failed attempts. Your IP is blocked for ${failResult.remainingMinutes} minutes.`
          })
        },
        { status: failResult.shouldBlock ? 403 : 401 }
      );
    }

    // 🔥 CHECK ADMIN ROLE
    if (!user.isAdmin) {
      const failResult = await recordFailedLogin(clientIP, email);
      
      return NextResponse.json(
        {
          success: false,
          message: "Admin access only. This portal is restricted to administrators.",
          remainingAttempts: failResult.remainingAttempts,
          blocked: failResult.shouldBlock
        },
        { status: 403 }
      );
    }

    // 🔥 CHECK IF BANNED
    if (user.isBanned) {
      return NextResponse.json(
        {
          success: false,
          banned: true,
          message: "This admin account has been suspended.",
          reason: user.banReason || "Account banned",
        },
        { status: 403 }
      );
    }

    // 🔥 CHECK PASSWORD EXISTS
    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "Password missing in user record" },
        { status: 500 }
      );
    }

    // 🔥 VERIFY PASSWORD
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      const failResult = await recordFailedLogin(clientIP, email);
      
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
          remainingAttempts: failResult.remainingAttempts,
          recentAttempts: failResult.recentAttempts,
          blocked: failResult.shouldBlock,
          ...(failResult.shouldBlock && {
            ipBlocked: true,
            expiresAt: failResult.expiresAt,
            remainingMinutes: failResult.remainingMinutes,
            message: `Too many failed attempts. Your IP is blocked for ${failResult.remainingMinutes} minutes.`
          })
        },
        { status: failResult.shouldBlock ? 403 : 401 }
      );
    }

    // 🎉 PASSWORD VALID - NOW HANDLE LOGIN TRACKING

    // 🔧 GET LOCATION
    let location = "Unknown Location";
    try {
      location = await getLocationFromIP(clientIP);
    } catch (error) {
      console.log("⚠️ Could not get location");
    }

    // ✅ UPDATE USER WITH LOGIN TRACKING
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

    // 🎉 Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('\n' + '═'.repeat(60));
    console.log('🔐 GENERATING ADMIN OTP');
    console.log('═'.repeat(60));
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Expires: ${otpExpires.toLocaleString()}`);
    console.log('═'.repeat(60) + '\n');

    // 🔥 SAVE OTP
    user.adminOTP = otp;
    user.adminOTPExpires = otpExpires;

    // ✅ SAVE ALL UPDATES TO USER
    await user.save();

    console.log(`✅ Login history saved for ${email}`);
    console.log(`📊 Total logins: ${user.loginStats.totalLogins}`);

    // Generate temporary token
    const tempToken = jwt.sign(
      {
        id: user._id?.toString() || String(user._id),
        email: user.email,
        temp: true,
        purpose: "admin-otp-verification"
      },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    // Send OTP via email
    await sendOTPEmail(user.email, user.name, otp);

    // 📧 SEND LOGIN NOTIFICATION EMAIL
    try {
      await sendLoginNotification({
        email: user.email,
        userName: user.name || user.email.split('@')[0],
        ipAddress: clientIP,
        userAgent: userAgent,
        location: location,
        timestamp: new Date(),
        loginMethod: 'manual',
      });
      console.log('✅ Login notification email sent');
    } catch (emailError) {
      console.error('⚠️ Failed to send login notification:', emailError);
    }

    // 🔥 SUCCESSFUL CREDENTIALS - CLEAR FAILED ATTEMPTS
    await clearFailedAttempts(email);

    return NextResponse.json({
      success: true,
      requiresOTP: true,
      message: "Verification code sent to your email",
      tempToken,
      email: user.email,
      expiresIn: 600
    });

  } catch (err: any) {
    console.error("❌ ADMIN LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}