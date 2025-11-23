import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import { cookies, headers } from "next/headers"; // ✅ Added headers
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { 
  getClientIP, 
  getLocationFromIP,
  generateDeviceFingerprint,
  createSecurityAlert
} from "@/lib/security";

export async function POST(req: Request) {
  try {
    await connectDB();

    // 🔥 FIX: Support both JWT token AND NextAuth session
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    let userId: string | null = null;

    // Try JWT token first (for credentials login)
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        userId = decoded.id;
        console.log("✅ JWT token verified, userId:", userId);
      } catch (error) {
        console.log("⚠️ JWT verification failed, trying NextAuth session...");
      }
    }

    // 🔥 FIX: If no JWT, try NextAuth session (for OAuth login)
    if (!userId) {
      const session = await getServerSession();
      
      if (session?.user?.email) {
        console.log("✅ NextAuth session found:", session.user.email);
        
        // Find user by email from OAuth
        const oauthUser = await User.findOne({ email: session.user.email });
        if (oauthUser) {
          userId = oauthUser._id.toString();
          console.log("✅ OAuth user found, userId:", userId);
        }
      } else {
        console.log("❌ No NextAuth session found");
      }
    }

    // If still no user, return unauthorized
    if (!userId) {
      console.log("❌ No valid authentication found");
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized - No valid session" 
      }, { status: 401 });
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: "User not found" 
      }, { status: 404 });
    }

    // Get device info from request body (sent from client)
    const body = await req.json();
    const { userAgent, browser, os, provider } = body;

    console.log("📱 Received device info:", { browser, os, provider, userAgent: userAgent ? "provided" : "missing" });

    // 🔥 FIX: Get User-Agent from headers if not provided in body
    const headersList = await headers();
    const serverUserAgent = headersList.get("user-agent") || "";
    const finalUserAgent = userAgent || serverUserAgent || "Unknown Device";

    console.log("🔍 Final User-Agent:", finalUserAgent.substring(0, 50) + "...");

    // Get IP and location
    const currentIP = await getClientIP();
    const currentLocation = await getLocationFromIP(currentIP);
    const deviceFingerprint = generateDeviceFingerprint(currentIP, finalUserAgent);

    console.log("🔐 Device fingerprint:", deviceFingerprint);

    // Initialize arrays if they don't exist
    user.loginHistory = user.loginHistory || [];
    user.devices = user.devices || [];
    user.loginIPs = user.loginIPs || [];
    user.securityAlerts = user.securityAlerts || [];

    // 🔥 FIX: Use client-provided browser/OS info (more accurate)
    const deviceName = `${os || 'Unknown OS'} ${browser || 'Unknown Browser'}`;

    // Add login history with proper device info
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
      
      console.log("✅ Updated existing device:", {
        fingerprint: deviceFingerprint,
        name: deviceName
      });
    } else {
      // New device detected
      (user.devices as any).push({
        name: deviceName,
        deviceId: deviceFingerprint,
        browser: browser || "Unknown Browser",
        os: os || "Unknown OS",
        lastUsed: new Date(),
        firstSeen: new Date(),
        trusted: provider === 'google' || provider === 'facebook', // OAuth = trusted
        ipAddress: currentIP,
        location: currentLocation
      });

      // Alert for new device
      const alert = createSecurityAlert({
        type: 'new_device',
        ip: currentIP,
        location: currentLocation,
        device: deviceName,
        severity: 'medium'
      });
      
      (user.securityAlerts as any).push(alert);
      
      console.log("✅ Added new device:", {
        fingerprint: deviceFingerprint,
        name: deviceName,
        trusted: provider === 'google' || provider === 'facebook'
      });
    }

    // Update IP tracking
    const existingIP = user.loginIPs.find(i => i.ip === currentIP);
    if (existingIP) {
      existingIP.count += 1;
      existingIP.lastLogin = new Date();
      console.log("✅ Updated IP count:", { ip: currentIP, count: existingIP.count });
    } else {
      (user.loginIPs as any).push({
        ip: currentIP,
        lastLogin: new Date(),
        count: 1
      });
      console.log("✅ Added new IP:", currentIP);
    }

    // Update current status
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

    console.log("✅ Device tracking successful:", {
      userId: user._id,
      email: user.email,
      device: deviceName,
      provider,
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
    });

  } catch (error: any) {
    console.error("❌ Device tracking error:", error);
    console.error("Error stack:", error.stack);
    
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