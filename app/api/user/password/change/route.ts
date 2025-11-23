import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    await connectDB();

    let userId = null;

    // ✅ Check NextAuth Session (Google/Facebook users)
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        userId = (session.user as any).id;
        if (!userId) {
          const user = await User.findOne({ email: session.user.email });
          if (user) userId = user._id.toString();
        }
      }
    } catch (err) {
      console.log("⚠️ NextAuth check failed:", err);
    }

    // ✅ Check JWT Token (Email/Password users)
    if (!userId) {
      try {
        const cookieStore = cookies();
        const token = (await cookieStore).get("token");
        
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id;
        }
      } catch (err: any) {
        console.log("⚠️ JWT verification failed:", err.message);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Check if user has a password (not OAuth user)
    if (!user.password) {
      return NextResponse.json(
        { 
          error: "Password change not available",
          message: "You signed in with Google/Facebook. Password changes are managed through your OAuth provider."
        },
        { status: 400 }
      );
    }

    // ✅ Get passwords from request
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // ✅ Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // ✅ Validate new password
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update password
    user.password = hashedPassword;
    await user.save();

    console.log("✅ Password changed successfully for user:", user.email);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error: any) {
    console.error("❌ Password change error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}