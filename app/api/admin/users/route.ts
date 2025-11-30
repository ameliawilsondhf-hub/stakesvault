import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";

/**
 * GET /api/admin/users
 * Fetch all users (Admin only)
 * @returns List of all users with details
 */
export async function GET() {
  try {
    // Connect to database
    await connectDB();

    // Get authentication token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("🔍 [Admin Users API] Token check:", token ? "Found" : "Missing");

    // Validate token exists
    if (!token) {
      console.log("❌ [Admin Users API] No token provided");
      return NextResponse.json(
        { 
          success: false, 
          message: "Authentication required. Please login." 
        },
        { status: 401 }
      );
    }

    // Validate JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error("❌ [Admin Users API] JWT_SECRET not configured");
      return NextResponse.json(
        { 
          success: false, 
          message: "Server configuration error" 
        },
        { status: 500 }
      );
    }

    // Verify and decode JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ [Admin Users API] Token verified. User ID:", decoded.id);
    } catch (err: any) {
      console.log("❌ [Admin Users API] Token verification failed:", err.message);
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid or expired token. Please login again." 
        },
        { status: 401 }
      );
    }

    // Fetch admin user from database
    const admin = await User.findById(decoded.id).select("email isAdmin");

    if (!admin) {
      console.log("❌ [Admin Users API] User not found in database");
      return NextResponse.json(
        { 
          success: false, 
          message: "User account not found" 
        },
        { status: 404 }
      );
    }

    console.log("👤 [Admin Users API] User found:", admin.email);
    console.log("🔐 [Admin Users API] Admin status:", admin.isAdmin);

    // Verify admin privileges
    if (!admin.isAdmin) {
      console.log("⛔ [Admin Users API] Access denied - not an admin");
      return NextResponse.json(
        { 
          success: false, 
          message: "Access denied. Admin privileges required." 
        },
        { status: 403 }
      );
    }

    console.log("✅ [Admin Users API] Admin access granted");
    console.log("📊 [Admin Users API] Fetching all users...");

    // ✅ FIXED: Fetch all users with populated referredUsers
    const users = await User.find({})
      .select("-password -twoFactorSecret -twoFactorBackupCodes -resetPasswordToken")
      .populate('referredUsers', 'name email') // Populate referred users
      .populate('level1', 'name email') // Populate level 1
      .populate('level2', 'name email') // Populate level 2
      .populate('level3', 'name email') // Populate level 3
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ [Admin Users API] Successfully fetched ${users.length} users`);

    // Return success response with user data
    return NextResponse.json(
      { 
        success: true, 
        users,
        count: users.length 
      },
      { status: 200 }
    );

  } catch (error: any) {
    // Log detailed error for debugging
    console.error("❌ [Admin Users API] Server error:", error.message);
    console.error("❌ [Admin Users API] Stack trace:", error.stack);

    // Return generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error. Please try again later.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}