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

    // ✅ Accept 'requestId' from frontend
    const { requestId } = await req.json();
    
    if (!requestId) {
      return NextResponse.json(
        { message: "Request ID required" },
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

    const user = await User.findById(dep.userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Update user balance
    user.walletBalance += dep.amount;
    user.totalDeposits = (user.totalDeposits || 0) + dep.amount;
    await user.save();

    // ✅ Update deposit status with admin tracking
    dep.status = "approved";
    dep.approvedAt = new Date();
    if (adminId) {
      dep.approvedBy = adminId;
    }
    await dep.save();

    console.log(`✅ Deposit ${requestId} approved for user ${user.email}`);

    // ✅ Send email notification
    try {
      await emailService.sendDepositApproved(
        user.email,
        user.name || user.email.split('@')[0],
        dep.amount,
        user.walletBalance,
        dep._id.toString()
      );
      console.log(`📧 Deposit approval email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Email send failed:", emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Deposit approved!",
      data: {
        depositId: dep._id,
        amount: dep.amount,
        newBalance: user.walletBalance,
      },
    });

  } catch (error: any) {
    console.error("❌ Approve Error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}