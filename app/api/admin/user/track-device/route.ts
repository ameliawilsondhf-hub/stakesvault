import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { 
  getClientIP, 
  getLocationFromIP,
  generateDeviceFingerprint,
  createSecurityAlert
} from "@/lib/security";

// ✅ Critical: Force dynamic rendering for Next.js 15
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================
// 🔥 OPTIONS HANDLER (For CORS Preflight)
// ============================================
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ============================================
// 📮 POST HANDLER (Main Logic)
// ============================================
export async function POST(request: Request) {
  console.log("🔥 Track-device POST endpoint called");
  
  try {
    await connectDB();

    // Get cookies and headers
    const cookieStore = await cookies();
    const headersList = await headers();
    const token = cookieStore.get("token")?.value;
    
    let userId: string | null = null;

    // ============================================
    // 🔐 AUTHENTICATION CHECK
    // ============================================
    
    // Try JWT token first (credentials login)
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        userId = decoded.id;
        console.log("✅ JWT verified, userId:", userId);
      } catch (error) {
        console.log("⚠️ JWT failed, trying NextAuth...");
      }
    }

    // Try NextAuth session (OAuth login)
    if (!userId) {
      const session = await getServerSession();
      
      if (session?.user?.email) {
        console.log("✅ NextAuth session found:", session.user.email);
        
        const oauthUser = await User.findOne({ email: session.user.email });
        if (oauthUser) {
          userId = oauthUser._id.toString();
          console.log("✅ OAuth user found:", userId);
        }
      }
    }

    // No authentication found
    if (!userId) {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized - Please login" 
      }, { status: 401 });
    }

    // ============================================
    // 👤 USER LOOKUP
    // ============================================
    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ User not found:", userId);
      return NextResponse.json({ 
        success: false,
        message: "User not found" 
      }, { status: 404 });
    }

    // ============================================
    // 📱 DEVICE INFO EXTRACTION
    // ============================================
    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    
    const { userAgent, browser, os, provider } = body;

    // Get User-Agent from headers if not in body
    const serverUserAgent = headersList.get("user-agent") || "";
    const finalUserAgent = userAgent || serverUserAgent || "Unknown Device";

    // Get IP and location
    const currentIP = await getClientIP();
    const currentLocation = await getLocationFromIP(currentIP);
    const deviceFingerprint = generateDeviceFingerprint(currentIP, finalUserAgent);

    console.log("📱 Device Info:", { 
      browser, 
      os, 
      provider,
      ip: currentIP,
      location: currentLocation 
    });

    // ============================================
    // 💾 UPDATE USER DATA
    // ============================================
    
    // Initialize arrays
    user.loginHistory = user.loginHistory || [];
    user.devices = user.devices || [];
    user.loginIPs = user.loginIPs || [];
    user.securityAlerts = user.securityAlerts || [];

    const deviceName = `${os || 'Unknown OS'} ${browser || 'Unknown Browser'}`;

    // Add login history
    (user.loginHistory as any).push({
      ip: currentIP,
      location: currentLocation,
      device: deviceName,
      browser: browser || "Unknown Browser",
      os: os || "Unknown OS",
      date: new Date(),
      timestamp: new Date(),
      suspicious: false
    });

    // Keep last 50 records
    if (user.loginHistory.length > 50) {
      user.loginHistory = user.loginHistory.slice(-50);
    }

    // Check if device exists
    const existingDevice = user.devices.find(d => d.deviceId === deviceFingerprint);

    if (existingDevice) {
      // Update existing device
      existingDevice.lastUsed = new Date();
      existingDevice.ipAddress = currentIP;
      existingDevice.location = currentLocation;
      existingDevice.browser = browser || "Unknown Browser";
      existingDevice.os = os || "Unknown OS";
      existingDevice.name = deviceName;
      
      console.log("✅ Device updated");
    } else {
      // New device detected
      (user.devices as any).push({
        name: deviceName,
        deviceId: deviceFingerprint,
        browser: browser || "Unknown Browser",
        os: os || "Unknown OS",
        lastUsed: new Date(),
        firstSeen: new Date(),
        trusted: provider === 'google' || provider === 'facebook',
        ipAddress: currentIP,
        location: currentLocation
      });

      // Create security alert for new device
      const alert = createSecurityAlert({
        type: 'new_device',
        ip: currentIP,
        location: currentLocation,
        device: deviceName,
        severity: 'medium'
      });
      
      (user.securityAlerts as any).push(alert);
      
      console.log("✅ New device added");
    }

    // Update IP tracking
    const existingIP = user.loginIPs.find(i => i.ip === currentIP);
    if (existingIP) {
      existingIP.count += 1;
      existingIP.lastLogin = new Date();
    } else {
      (user.loginIPs as any).push({
        ip: currentIP,
        lastLogin: new Date(),
        count: 1
      });
    }

    // Update user status
    user.ipAddress = currentIP;
    user.currentLocation = currentLocation;
    user.lastLogin = new Date();

    // Update login stats
    user.loginStats = user.loginStats || {
      totalLogins: 0,
      failedAttempts: 0,
      uniqueDevices: 0,
      uniqueLocations: 0
    };
    
    user.loginStats.totalLogins += 1;
    user.loginStats.uniqueDevices = user.devices.length;
    user.loginStats.uniqueLocations = new Set(user.loginHistory.map((l: any) => l.location)).size;

    await user.save();

    console.log("✅ Device tracking complete:", {
      email: user.email,
      totalDevices: user.devices.length,
      totalLogins: user.loginStats.totalLogins
    });

    return NextResponse.json({
      success: true,
      message: "Device tracked successfully",
      device: deviceName,
      stats: {
        totalDevices: user.devices.length,
        totalLogins: user.loginStats.totalLogins
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error("❌ Device tracking error:", error);
    console.error("Stack:", error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        message: "Error tracking device", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}