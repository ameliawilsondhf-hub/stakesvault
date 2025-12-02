import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";
import User from "@/lib/models/user";
import { emailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  console.log("🚀 Deposit Reject API - START");
  
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    // ============================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ============================================
    const isDevelopment = process.env.NODE_ENV === 'development';
    let adminId = null;

    if (!isDevelopment) {
      // Production mode - strict authentication
      const session = await getServerSession(authOptions);
      console.log("🔐 Session exists:", !!session);
      
      if (!session?.user?.email) {
        console.error("❌ No session found");
        return NextResponse.json(
          { 
            success: false,
            message: "Authentication required. Please login to continue." 
          },
          { status: 401 }
        );
      }

      console.log("👤 Session email:", session.user.email);

      // ✅ FIXED: Only check isAdmin field, not role
      const admin = await User.findOne({ email: session.user.email }).select('_id email isAdmin');
      
      console.log("🔍 Admin lookup result:", {
        found: !!admin,
        email: admin?.email,
        isAdmin: admin?.isAdmin,
        isAdminType: typeof admin?.isAdmin
      });

      if (!admin || admin.isAdmin !== true) {
        console.error("❌ User is not admin:", {
          userExists: !!admin,
          isAdminValue: admin?.isAdmin
        });
        return NextResponse.json(
          { 
            success: false,
            message: "Admin privileges required to perform this action." 
          },
          { status: 403 }
        );
      }

      adminId = admin._id;
      console.log("✅ Admin verified:", adminId);

    } else {
      // Development mode - optional authentication
      console.log("⚠️ Running in DEVELOPMENT mode");
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
          const admin = await User.findOne({ email: session.user.email });
          if (admin) {
            adminId = admin._id;
            console.log("✅ Dev mode: Admin found:", adminId);
          }
        }
      } catch (err) {
        console.log("⚠️ Dev mode: No admin session, continuing anyway");
      }
    }

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
    if (adminId) {
      deposit.rejectedBy = adminId;
    }
    deposit.rejectionReason = reason.trim();
    
    await deposit.save();

    console.log("✅ Deposit rejected successfully");
    console.log("📝 Rejection reason:", deposit.rejectionReason);

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
        status: deposit.status
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