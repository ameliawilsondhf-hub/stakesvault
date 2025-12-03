import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";
import User from "@/lib/models/user";
import { emailService } from "@/lib/email-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    await connectDB();

    // ✅ ADMIN AUTH USING JWT COOKIE (FINAL FIX)
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("❌ No admin token cookie");
      return NextResponse.json(
        { success: false, message: "Authentication required. Please login again." },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      console.error("❌ Invalid token");
      return NextResponse.json(
        { success: false, message: "Session expired. Please login again." },
        { status: 401 }
      );
    }

    const admin = await User.findById(decoded.id).select("_id email isAdmin");

    if (!admin || admin.isAdmin !== true) {
      return NextResponse.json(
        { success: false, message: "Admin privileges required." },
        { status: 403 }
      );
    }

    const adminId = admin._id;
    const adminEmail = admin.email;


    console.log("✅ Admin authenticated:", adminEmail);

    // ============================================
    // 2. REQUEST VALIDATION
    // ============================================
    const { requestId, reason } = await req.json();
    
    console.log("📋 Request data:", {
      requestId,
      reasonLength: reason?.length,
      hasReason: !!reason
    });
    
    if (!requestId) {
      return NextResponse.json(
        { 
          success: false,
          message: "Deposit request ID is required" 
        },
        { status: 400 }
      );
    }

    // ✅ Reason is REQUIRED for rejection
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Rejection reason is required" 
        },
        { status: 400 }
      );
    }

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { 
          success: false,
          message: "Please provide a detailed reason (at least 10 characters)" 
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. FETCH & VALIDATE DEPOSIT
    // ============================================
    console.log("🔍 Finding deposit:", requestId);
    const deposit = await Deposit.findById(requestId);

    if (!deposit) {
      console.error("❌ Deposit not found:", requestId);
      return NextResponse.json(
        { 
          success: false,
          message: "Deposit request not found" 
        },
        { status: 404 }
      );
    }

    console.log("📋 Deposit found:", {
      id: deposit._id,
      amount: deposit.amount,
      status: deposit.status,
      userId: deposit.userId
    });

    if (deposit.status !== "pending") {
      console.error("❌ Deposit already processed:", deposit.status);
      return NextResponse.json(
        { 
          success: false,
          message: `This deposit has already been ${deposit.status}`,
          currentStatus: deposit.status
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. FETCH USER FOR EMAIL
    // ============================================
    console.log("👤 Finding user:", deposit.userId);
    const user = await User.findById(deposit.userId);
    
    if (!user) {
      console.error("❌ User not found:", deposit.userId);
      return NextResponse.json(
        { 
          success: false,
          message: "User associated with this deposit not found" 
        },
        { status: 404 }
      );
    }

    console.log("✅ User found:", {
      name: user.name,
      email: user.email
    });

    // ============================================
    // 5. UPDATE DEPOSIT STATUS
    // ============================================
    deposit.status = "rejected";
    deposit.rejectedAt = new Date();
    deposit.rejectedBy = adminId;
    deposit.rejectionReason = reason.trim();
    
    await deposit.save();

    console.log("✅ Deposit rejected successfully");
    console.log("📝 Rejection reason:", deposit.rejectionReason);
    console.log("👮 Rejected by admin:", adminEmail);

    // ============================================
    // 6. SEND EMAIL NOTIFICATION
    // ============================================
    try {
      await emailService.sendDepositRejected(
        user.email,
        user.name || user.email.split('@')[0],
        deposit.amount,
        deposit._id.toString(),
        deposit.rejectionReason
      );
      console.log("📧 Rejection email sent to:", user.email);
    } catch (emailError) {
      console.error("❌ Email send failed:", emailError);
      // Don't fail the rejection if email fails
    }

    // ============================================
    // 7. SUCCESS RESPONSE
    // ============================================
    console.log("✅ DEPOSIT REJECTION COMPLETED");
    console.log("═".repeat(60));

    return NextResponse.json({
      success: true,
      message: "Deposit rejected successfully",
      data: {
        depositId: deposit._id,
        amount: deposit.amount,
        reason: deposit.rejectionReason,
        rejectedAt: deposit.rejectedAt,
        rejectedBy: adminEmail,
        status: deposit.status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("❌ DEPOSIT REJECTION ERROR");
    console.error("═".repeat(60));
    console.error("Error Type:", error.name);
    console.error("Error Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("═".repeat(60));

    return NextResponse.json(
      { 
        success: false,
        message: "An error occurred while processing the deposit rejection",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}