import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();

    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized - No token" },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 🔥 PREPARE SECURITY INFO
    const securityInfo = {
      // Current Status
      currentIP: user.ipAddress || "Unknown",
      currentLocation: user.currentLocation || "Unknown",
      lastLogin: user.lastLogin || null,
      
      // Registration Info
      registrationIP: user.registrationIP || "Unknown",
      registrationLocation: user.registrationLocation || "Unknown",
      accountCreated: user.createdAt || null,

      // Previous Status (for comparison)
      previousIP: user.previousIP || null,
      previousLocation: user.previousLocation || null,

      // Login Statistics
      loginStats: {
        totalLogins: user.loginStats?.totalLogins || 0,
        uniqueDevices: user.loginStats?.uniqueDevices || 0,
        uniqueLocations: user.loginStats?.uniqueLocations || 0,
        failedAttempts: user.loginStats?.failedAttempts || 0,
        lastFailedLogin: user.loginStats?.lastFailedLogin || null
      },

      // Login History (sorted by most recent first)
      loginHistory: (user.loginHistory || [])
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((login: any) => ({
          ip: login.ip,
          location: login.location,
          device: login.device,
          browser: login.browser,
          os: login.os,
          timestamp: login.timestamp,
          suspicious: login.suspicious
        })),

      // Devices
      devices: (user.devices || [])
        .sort((a: any, b: any) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        .map((device: any) => ({
          name: device.name,
          deviceId: device.deviceId,
          browser: device.browser,
          os: device.os,
          lastUsed: device.lastUsed,
          firstSeen: device.firstSeen,
          trusted: device.trusted,
          ipAddress: device.ipAddress,
          location: device.location
        })),

      // Trusted Devices Only
      trustedDevices: (user.devices || [])
        .filter((d: any) => d.trusted)
        .map((device: any) => ({
          name: device.name,
          browser: device.browser,
          os: device.os,
          lastUsed: device.lastUsed,
          location: device.location
        })),

      // Unverified/Untrusted Devices
      unverifiedDevices: (user.devices || [])
        .filter((d: any) => !d.trusted)
        .map((device: any) => ({
          name: device.name,
          browser: device.browser,
          os: device.os,
          lastUsed: device.lastUsed,
          location: device.location
        })),

      // Security Alerts (recent 20)
      securityAlerts: (user.securityAlerts || [])
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20)
        .map((alert: any) => ({
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
          ip: alert.ip,
          location: alert.location,
          device: alert.device,
          timestamp: alert.timestamp,
          acknowledged: alert.acknowledged
        })),

      // Unacknowledged Alerts Count
      unacknowledgedAlerts: (user.securityAlerts || []).filter(
        (a: any) => !a.acknowledged
      ).length,

      // Security Logs (recent 20)
      securityLogs: (user.securityLogs || [])
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20)
        .map((log: any) => ({
          type: log.type,
          ip: log.ip,
          device: log.device,
          location: log.location,
          risk: log.risk,
          date: log.date
        })),

      // IP Tracking
      ipHistory: (user.loginIPs || [])
        .sort((a: any, b: any) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
        .map((ipRecord: any) => ({
          ip: ipRecord.ip,
          lastLogin: ipRecord.lastLogin,
          count: ipRecord.count
        })),

      // Risk Analysis
      riskAnalysis: {
        hasMultipleDevices: (user.devices || []).length > 1,
        hasLocationChanges: user.previousLocation && user.currentLocation !== user.previousLocation,
        hasIPChanges: user.previousIP && user.ipAddress !== user.previousIP,
        hasUnverifiedDevices: (user.devices || []).some((d: any) => !d.trusted),
        recentSuspiciousActivity: (user.loginHistory || [])
          .slice(0, 10)
          .some((l: any) => l.suspicious),
        highRiskAlerts: (user.securityAlerts || [])
          .filter((a: any) => a.severity === 'high' && !a.acknowledged)
          .length
      }
    };

    return NextResponse.json({
      success: true,
      data: securityInfo
    });

  } catch (err: any) {
    console.error("SECURITY INFO ERROR:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

// PATCH - Acknowledge security alert
export async function PATCH(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { alertId } = await req.json();

    // Find and acknowledge alert
    const alert = user.securityAlerts?.find(
      (a: any) => a._id.toString() === alertId
    );

    if (alert) {
      alert.acknowledged = true;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Alert acknowledged"
    });

  } catch (err: any) {
    console.error("ACKNOWLEDGE ALERT ERROR:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

// DELETE - Trust a device
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { deviceId, action } = await req.json();

    if (action === 'trust') {
      // Trust device
      const device = user.devices?.find(
        (d: any) => d.deviceId === deviceId
      );
      if (device) {
        device.trusted = true;
        await user.save();
      }
    } else if (action === 'remove') {
      // Remove device
      user.devices = user.devices?.filter(
        (d: any) => d.deviceId !== deviceId
      );
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: `Device ${action}ed successfully`
    });

  } catch (err: any) {
    console.error("DEVICE ACTION ERROR:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}