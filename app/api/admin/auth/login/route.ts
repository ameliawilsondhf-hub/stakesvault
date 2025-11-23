import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/lib/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getClientIP } from "@/lib/security";

// 🔥 IP BLOCKING CONFIGURATION
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 60 * 60 * 1000; // 60 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

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

  // Add failed attempt
  (user.failedLoginAttempts as any).push({
    ip,
    attemptTime: new Date(),
    email
  });

  // Remove old attempts (older than 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - ATTEMPT_WINDOW);
  user.failedLoginAttempts = user.failedLoginAttempts.filter(
    (attempt: any) => new Date(attempt.attemptTime) > fiveMinutesAgo
  );

  // Count recent attempts from this IP
  const recentAttempts = user.failedLoginAttempts.filter(
    (attempt: any) => attempt.ip === ip
  ).length;

  const remainingAttempts = MAX_ATTEMPTS - recentAttempts;

  // Check if should block
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

    // 🔥 GET CLIENT IP
    const clientIP = await getClientIP();

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

    // 🎉 PASSWORD VALID - NOW SEND OTP

    // Generate 6-digit OTP
  // 🎉 PASSWORD VALID - NOW SEND OTP

// Generate 6-digit OTP
const otp = crypto.randomInt(100000, 999999).toString();
const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

console.log('\n' + '═'.repeat(60));
console.log('🔐 GENERATING ADMIN OTP');
console.log('═'.repeat(60));
console.log(`📧 Email: ${user.email}`);
console.log(`🔢 OTP Code: ${otp}`);
console.log(`⏰ Expires: ${otpExpires.toLocaleString()}`);
console.log('═'.repeat(60) + '\n');

// 🔥 IMPORTANT: Save OTP to user document
try {
  // Update user with OTP
  await User.updateOne(
    { _id: user._id },
    { 
      $set: { 
        adminOTP: otp,
        adminOTPExpires: otpExpires,
        lastLogin: new Date()
      } 
    }
  );
  
  console.log("✅ OTP saved to database");
  
  // Verify it was saved
  const checkUser = await User.findById(user._id).select("+adminOTP +adminOTPExpires");
  console.log("✅ Verification - OTP in DB:", checkUser?.adminOTP);
  console.log("✅ Verification - Expires:", checkUser?.adminOTPExpires);
  
} catch (saveError) {
  console.error("❌ Failed to save OTP:", saveError);
  return NextResponse.json(
    { success: false, message: "Failed to generate verification code" },
    { status: 500 }
  );
}

// Generate temporary token (15 minutes - for OTP verification)
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

// 🔥 SUCCESSFUL CREDENTIALS - CLEAR FAILED ATTEMPTS
await clearFailedAttempts(email);

return NextResponse.json({
  success: true,
  requiresOTP: true,
  message: "Verification code sent to your email",
  tempToken,
  email: user.email,
  expiresIn: 600 // 10 minutes in seconds
});

  } catch (err: any) {
    console.error("❌ ADMIN LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}