import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Withdraw from "@/lib/models/withdraw";
import User from "@/lib/models/user";
import { emailService } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    // 🔐 Authentication Check (Environment-based)
    let adminId = null;
    
    if (process.env.NODE_ENV === 'production') {
      const session = await getServerSession();
      
      if (!session || !session.user) {
        return NextResponse.json(
          { success: false, message: "Unauthorized - Please login" },
          { status: 401 }
        );
      }

      // @ts-ignore
      if (session.user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: "Admin access required" },
          { status: 403 }
        );
      }

      // @ts-ignore
      adminId = session.user.id;
    } else {
      console.log("⚠️ Development mode - skipping authentication");
    }

    await connectDB();

    const { withdrawId } = await req.json();

    // Validation
    if (!withdrawId) {
      return NextResponse.json(
        { success: false, message: "Withdrawal ID is required" },
        { status: 400 }
      );
    }

    // Find withdrawal
    const withdrawal = await Withdraw.findById(withdrawId);

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // Check status
    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Withdrawal already processed" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(withdrawal.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Approve withdrawal (amount already deducted during submission)
    withdrawal.status = "approved";
    await withdrawal.save();

    console.log(`✅ Withdrawal ${withdrawId} approved - amount was already deducted`);

    // 📧 Send approval email
    try {
      await emailService.sendWithdrawalApproved(
        user.email,
        user.name || user.email,
        withdrawal.amount,
        withdrawal.walletAddress || "Not provided",
        withdrawal._id.toString()
      );
      console.log(`📧 Withdrawal approved email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "Withdrawal approved successfully!",
      data: {
        withdrawalId: withdrawal._id,
        amount: withdrawal.amount,
        walletAddress: withdrawal.walletAddress
      }
    });

  } catch (error: any) {
    console.error("❌ Withdrawal Approve Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}