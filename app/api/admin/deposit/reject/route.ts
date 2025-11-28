import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";
import User from "@/lib/models/user";
import { emailService } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ PRODUCTION: Admin authentication check
    // 🔧 DEVELOPMENT: Can be bypassed for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    let adminId = null;

    if (!isDevelopment) {
      // Production mode - strict authentication
      const session = await getServerSession(authOptions);
      if (!session || !session.user?.email) {
        return NextResponse.json(
          { message: "Unauthorized - Please login" },
          { status: 401 }
        );
      }

      const admin = await User.findOne({ email: session.user.email });
      if (!admin || admin.role !== "admin") {
        return NextResponse.json(
          { message: "Admin access required" },
          { status: 403 }
        );
      }
      adminId = admin._id;
    } else {
      // Development mode - optional authentication
      try {
        const session = await getServerSession(authOptions);
        if (session && session.user?.email) {
          const admin = await User.findOne({ email: session.user.email });
          if (admin) {
            adminId = admin._id;
          }
        }
      } catch (err) {
        console.log("⚠️ Dev mode: No admin session, continuing anyway");
      }
    }

    // ✅ Accept 'requestId' and REQUIRED 'reason' from frontend
    const { requestId, reason } = await req.json();
    
    if (!requestId) {
      return NextResponse.json(
        { message: "Request ID required" },
        { status: 400 }
      );
    }

    // ✅ Reason is REQUIRED for rejection
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { message: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const dep = await Deposit.findById(requestId);

    if (!dep) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    if (dep.status !== "pending") {
      return NextResponse.json(
        { message: "Already processed" },
        { status: 400 }
      );
    }

    // Get user for email notification
    const user = await User.findById(dep.userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Update deposit status with admin tracking
    dep.status = "rejected";
    dep.rejectedAt = new Date();
    if (adminId) {
      dep.rejectedBy = adminId;
    }
    dep.rejectionReason = reason.trim(); // Use the provided reason
    await dep.save();

    console.log(`✅ Deposit ${requestId} rejected. Reason: ${dep.rejectionReason}`);

    // ✅ Send email notification
    try {
      await emailService.sendDepositRejected(
        user.email,
        user.name || user.email.split('@')[0],
        dep.amount,
        dep._id.toString(),
        dep.rejectionReason
      );
      console.log(`📧 Deposit rejection email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Email send failed:", emailError);
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Deposit rejected",
      data: {
        depositId: dep._id,
        amount: dep.amount,
        reason: dep.rejectionReason,
      },
    });

  } catch (error: any) {
    console.error("❌ Reject Error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}