import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/**
 * GET /api/admin/users/check-duplicates
 * Find users sharing the same IP addresses (potential duplicate accounts)
 * @returns List of IPs with multiple users
 */
export async function GET() {
  try {
    await connectDB();

    // Authentication check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id);

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    console.log(`🔍 Admin ${admin.email} checking for duplicate IPs...`);

    // Find all users with IP tracking data
    const users = await User.find({ 
      loginIPs: { $exists: true, $ne: [] } 
    })
      .select("name email loginIPs")
      .lean();

    console.log(`📊 Found ${users.length} users with IP data`);

    // Group users by IP address
    const ipMap: Record<string, any[]> = {};

    users.forEach(user => {
      user.loginIPs?.forEach((ipData: any) => {
        if (!ipMap[ipData.ip]) {
          ipMap[ipData.ip] = [];
        }
        ipMap[ipData.ip].push({
          userId: user._id,
          name: user.name,
          email: user.email,
          loginCount: ipData.count,
          lastLogin: ipData.lastLogin
        });
      });
    });

    // Filter IPs with multiple users (duplicates)
    const duplicates = Object.entries(ipMap)
      .filter(([ip, users]) => users.length > 1)
      .map(([ip, users]) => ({
        ip,
        userCount: users.length,
        users: users.sort((a, b) => b.loginCount - a.loginCount)
      }))
      .sort((a, b) => b.userCount - a.userCount);

    console.log(`⚠️ Found ${duplicates.length} duplicate IPs`);

    return NextResponse.json({
      success: true,
      duplicates,
      totalDuplicateIPs: duplicates.length,
      totalUsersChecked: users.length
    });

  } catch (error: any) {
    console.error("❌ Check duplicates error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
