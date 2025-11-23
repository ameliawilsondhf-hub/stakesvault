import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";

/**
 * GET /api/admin/users/[id]
 * Fetch detailed information for a specific user
 * @param {string} id - User ID
 * @returns User details with IP tracking, ban info, stakes
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
        { success: false, message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // Fetch user with full details (including password hash for admin)
    const user = await User.findById(id)
      .select("-twoFactorSecret") // Only exclude 2FA secret
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Admin ${admin.email} viewed user ${(user as any).email}`);

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error: any) {
    console.error("❌ Get user detail error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}