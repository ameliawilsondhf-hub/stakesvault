import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    let userEmail: string | null = null;

    // Try NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user?.email) {
        userEmail = session.user.email;
      }
    } catch (err) {
      console.log("⚠️ NextAuth session check failed");
    }

    // Fallback to JWT
    if (!userEmail) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          if (decoded.email) {
            userEmail = decoded.email;
          }
        }
      } catch (err) {
        console.log("⚠️ JWT verification failed");
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user data
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare security data
    const securityData = {
      currentIP: user.ipAddress || "Unknown",
      currentLocation: user.currentLocation || "Unknown",
      lastLogin: user.lastLogin || user.createdAt,
      registrationIP: user.registrationIP || "Unknown",
      registrationLocation: user.registrationLocation || "Unknown",
      accountCreated: user.createdAt,
      previousIP: user.previousIP || null,
      previousLocation: user.previousLocation || null,
      
      loginStats: {
        totalLogins: user.loginStats?.totalLogins || 0,
        uniqueDevices: user.loginStats?.uniqueDevices || 0,
        uniqueLocations: user.loginStats?.uniqueLocations || 0,
        failedAttempts: user.loginStats?.failedAttempts || 0,
      },
      
      loginHistory: (user.loginHistory || []).map((login: any) => ({
        ip: login.ip,
        location: login.location,
        device: login.device || login.name || "Unknown Device",
        browser: login.browser || "Unknown",
        os: login.os || "Unknown",
        timestamp: login.timestamp || login.date,
        suspicious: login.suspicious || false,
      })),
      
      devices: (user.devices || []).map((device: any) => ({
        name: device.name,
        deviceId: device.deviceId,
        browser: device.browser || "Unknown",
        os: device.os || "Unknown",
        lastUsed: device.lastUsed,
        firstSeen: device.firstSeen,
        trusted: device.trusted || false,
        ipAddress: device.ipAddress || "Unknown",
        location: device.location || "Unknown",
      })),
      
      trustedDevices: (user.devices || []).filter((d: any) => d.trusted),
      unverifiedDevices: (user.devices || []).filter((d: any) => !d.trusted),
      
      securityAlerts: (user.securityAlerts || []).map((alert: any) => ({
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        ip: alert.ip,
        location: alert.location,
        device: alert.device,
        timestamp: alert.timestamp,
        acknowledged: alert.acknowledged || false,
        _id: alert._id,
      })),
      
      unacknowledgedAlerts: (user.securityAlerts || []).filter((a: any) => !a.acknowledged).length,
      
      riskAnalysis: {
        hasMultipleDevices: (user.devices || []).length > 1,
        hasLocationChanges: user.previousLocation && user.previousLocation !== user.currentLocation,
        hasIPChanges: user.previousIP && user.previousIP !== user.ipAddress,
        hasUnverifiedDevices: (user.devices || []).some((d: any) => !d.trusted),
        recentSuspiciousActivity: (user.loginHistory || []).some((l: any) => l.suspicious && 
          new Date(l.timestamp || l.date).getTime() > Date.now() - 24 * 60 * 60 * 1000
        ),
        highRiskAlerts: (user.securityAlerts || []).filter((a: any) => a.severity === 'high' && !a.acknowledged).length,
      },
    };

    return NextResponse.json({
      success: true,
      data: securityData,
    });

  } catch (error: any) {
    console.error("❌ Security info error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch security data" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    let userEmail: string | null = null;

    // Try NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user?.email) {
        userEmail = session.user.email;
      }
    } catch (err) {
      console.log("⚠️ NextAuth session check failed");
    }

    // Fallback to JWT
    if (!userEmail) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          if (decoded.email) {
            userEmail = decoded.email;
          }
        }
      } catch (err) {
        console.log("⚠️ JWT verification failed");
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { deviceId, action } = await req.json();

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (action === 'trust') {
      // Trust device
      const device = user.devices.find((d: any) => d.deviceId === deviceId);
      if (device) {
        device.trusted = true;
        await user.save();
        return NextResponse.json({ success: true, message: "Device trusted" });
      }
    } else if (action === 'remove') {
      // Remove device
      user.devices = user.devices.filter((d: any) => d.deviceId !== deviceId);
      await user.save();
      return NextResponse.json({ success: true, message: "Device removed" });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("❌ Device management error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to manage device" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    let userEmail: string | null = null;

    // Try NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user?.email) {
        userEmail = session.user.email;
      }
    } catch (err) {
      console.log("⚠️ NextAuth session check failed");
    }

    // Fallback to JWT
    if (!userEmail) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          if (decoded.email) {
            userEmail = decoded.email;
          }
        }
      } catch (err) {
        console.log("⚠️ JWT verification failed");
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { alertId, action } = await req.json();

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (action === 'acknowledge') {
      // Mark alert as acknowledged
      const alert = user.securityAlerts.find((a: any) => a._id?.toString() === alertId);
      if (alert) {
        alert.acknowledged = true;
        await user.save();
        return NextResponse.json({ success: true, message: "Alert acknowledged" });
      }
    } else if (action === 'dismiss') {
      // Remove alert
      user.securityAlerts = user.securityAlerts.filter((a: any) => a._id?.toString() !== alertId);
      await user.save();
      return NextResponse.json({ success: true, message: "Alert dismissed" });
    } else if (action === 'clear_all') {
      // Remove all acknowledged alerts
      user.securityAlerts = user.securityAlerts.filter((a: any) => !a.acknowledged);
      await user.save();
      return NextResponse.json({ success: true, message: "Acknowledged alerts cleared" });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("❌ Alert management error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to manage alert" },
      { status: 500 }
    );
  }
}