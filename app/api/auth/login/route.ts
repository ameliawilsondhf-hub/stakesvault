import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

// 🔥 IP BLOCKING SYSTEM - In-Memory Storage
const blockedIPs = new Map<string, { until: Date; attempts: number }>();
const failedAttempts = new Map<string, { count: number; firstAttempt: Date; attempts: Date[] }>();

// Get client IP
async function getClientIP(): Promise<string> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    return "unknown";
  } catch (error) {
    console.log("⚠️ Could not get client IP");
    return "unknown";
  }
}

// Check if IP is blocked
function isIPBlocked(ip: string): { blocked: boolean; remainingTime?: number } {
  const blockInfo = blockedIPs.get(ip);
  
  if (!blockInfo) {
    return { blocked: false };
  }
  
  const now = new Date();
  if (now > blockInfo.until) {
    blockedIPs.delete(ip);
    failedAttempts.delete(ip);
    return { blocked: false };
  }
  
  const remainingTime = Math.ceil((blockInfo.until.getTime() - now.getTime()) / 1000 / 60);
  return { blocked: true, remainingTime };
}

// Track failed login attempt
function trackFailedAttempt(ip: string): { shouldBlock: boolean; attemptsRemaining: number } {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  let record = failedAttempts.get(ip);

  if (!record) {
    record = { count: 1, firstAttempt: now, attempts: [now] };
    failedAttempts.set(ip, record);
    return { shouldBlock: false, attemptsRemaining: 4 };
  }

  // Filter attempts within last 5 minutes
  record.attempts = record.attempts.filter(attempt => attempt > fiveMinutesAgo);
  record.attempts.push(now);
  record.count = record.attempts.length;

  if (record.count >= 5) {
    // Block for 60 minutes
    const blockUntil = new Date(now.getTime() + 60 * 60 * 1000);
    blockedIPs.set(ip, { until: blockUntil, attempts: record.count });
    
    console.log(`🚫 SECURITY LOCKOUT: ${ip} - ${record.count} failed attempts detected`);
    
    return { shouldBlock: true, attemptsRemaining: 0 };
  }

  const remaining = 5 - record.count;
  console.log(`⚠️ Security Alert: Attempt ${record.count}/5 from ${ip} - ${remaining} remaining`);
  
  return { shouldBlock: false, attemptsRemaining: remaining };
}

// Clear failed attempts on successful login
function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip);
  console.log(`✅ Security status cleared for ${ip}`);
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, password } = await req.json();
    const clientIP = await getClientIP();

    console.log(`🔐 Authentication attempt: ${email} from ${clientIP}`);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Please provide both email and password to continue.",
          attemptsRemaining: 5
        },
        { status: 400 }
      );
    }

    // 🔥 CHECK IF IP IS BLOCKED
    const blockStatus = isIPBlocked(clientIP);
    if (blockStatus.blocked) {
      console.log(`🚫 Blocked access attempt from ${clientIP}`);
      
      return NextResponse.json(
        {
          success: false,
          message: "Account access temporarily restricted due to multiple failed login attempts.",
          blocked: true,
          blockTimeRemaining: blockStatus.remainingTime
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      const { shouldBlock, attemptsRemaining } = trackFailedAttempt(clientIP);
      
      if (shouldBlock) {
        return NextResponse.json(
          {
            success: false,
            message: "Account temporarily locked due to multiple failed login attempts. Please try again after 60 minutes.",
            blocked: true,
            blockTimeRemaining: 60
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          message: "The email or password you entered is incorrect. Please check your credentials and try again.",
          attemptsRemaining
        },
        { status: 401 }
      );
    }

    // Check if account is banned
    if (user.isBanned || user.banned) {
      return NextResponse.json(
        {
          success: false,
          message: "This account has been suspended by administration.",
          banned: true,
          reason: user.banReason || "Your account has been suspended due to a violation of our terms of service."
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const { shouldBlock, attemptsRemaining } = trackFailedAttempt(clientIP);
      
      // Update user's failed login stats
      if (!user.loginStats) {
        user.loginStats = {
          totalLogins: 0,
          failedAttempts: 0,
          uniqueDevices: 0,
          uniqueLocations: 0
        };
      }
      
      user.loginStats.failedAttempts += 1;
      user.loginStats.lastFailedLogin = new Date();
      await user.save();

      if (shouldBlock) {
        return NextResponse.json(
          {
            success: false,
            message: "Account temporarily locked due to multiple failed login attempts. Please try again after 60 minutes.",
            blocked: true,
            blockTimeRemaining: 60
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          message: "The email or password you entered is incorrect. Please check your credentials and try again.",
          attemptsRemaining
        },
        { status: 401 }
      );
    }

    // 🎉 SUCCESS - Clear failed attempts
    clearFailedAttempts(clientIP);

    // Check 2FA
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user._id.toString(), email: user.email, temp: true },
        process.env.JWT_SECRET!,
        { expiresIn: "10m" }
      );

      return NextResponse.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: "Two-factor authentication required for security."
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email,
        role: user.isAdmin ? "admin" : "user"
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Update user login info
    user.lastLogin = new Date();
    user.ipAddress = clientIP;

    // Reset failed attempts and update stats
    if (!user.loginStats) {
      user.loginStats = {
        totalLogins: 0,
        failedAttempts: 0,
        uniqueDevices: 0,
        uniqueLocations: 0
      };
    }
    
    user.loginStats.failedAttempts = 0;
    user.loginStats.totalLogins += 1;

    await user.save();

    console.log(`✅ Authentication successful: ${email} from ${clientIP}`);

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful. Welcome back!",
      userId: user._id.toString(),
      attemptsRemaining: 5, // Reset to 5
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin || false
      }
    });

    // Set JWT cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    });

    return response;

  } catch (error: any) {
    console.error("❌ Authentication error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "An unexpected error occurred. Please try again in a moment.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}