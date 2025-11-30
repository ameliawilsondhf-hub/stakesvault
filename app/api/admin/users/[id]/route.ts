import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Deposit from "@/lib/models/deposit";
// import Withdrawal from "@/lib/models/withdrawal"; // ⚠️ Optional - comment out if not exists

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/users/[id]
 * Fetch detailed information for a specific user with full stats
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();

    console.log("\n" + "=".repeat(60));
    console.log("👤 FETCHING USER DETAILS FOR ID:", id);
    console.log("=".repeat(60));

    // ✅ AUTHENTICATION
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !process.env.JWT_SECRET) {
      console.log("❌ No token found");
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id);

    if (!admin || !admin.isAdmin) {
      console.log("❌ Not admin:", decoded.id);
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // ✅ FETCH USER
    const user = await User.findById(id)
      .select("-twoFactorSecret")
      .lean();

    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("✅ User found:", (user as any).email);

    // ✅ FETCH ALL DEPOSITS
    const deposits = await Deposit.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean();

    const approvedDeposits = deposits.filter((d: any) => d.status === "approved");
    const pendingDeposits = deposits.filter((d: any) => d.status === "pending");
    const totalDepositsAmount = approvedDeposits.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

    console.log("💰 Deposits - Total:", deposits.length, "| Approved:", approvedDeposits.length, "| Amount: $" + totalDepositsAmount);

    // ✅ FETCH ALL WITHDRAWALS
    let withdrawals: any[] = [];
    let approvedWithdrawals: any[] = [];
    let pendingWithdrawals: any[] = [];
    let totalWithdrawalsAmount = 0;

    try {
      // ⚠️ Try to dynamically import Withdrawal model
      const { default: Withdrawal } = await import("@/lib/models/withdraw");


      
      withdrawals = await Withdrawal.find({ userId: id })
        .sort({ createdAt: -1 })
        .lean();

      approvedWithdrawals = withdrawals.filter((w: any) => w.status === "approved");
      pendingWithdrawals = withdrawals.filter((w: any) => w.status === "pending");
      totalWithdrawalsAmount = approvedWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

      console.log("💸 Withdrawals - Total:", withdrawals.length, "| Approved:", approvedWithdrawals.length, "| Amount: $" + totalWithdrawalsAmount);
    } catch (withdrawalError) {
      console.log("⚠️ Withdrawal model not found - skipping withdrawals");
      // Continue without withdrawals - not critical
    }

    // ✅ GET REFERRAL COUNT
    const referralCount = await User.countDocuments({ referredBy: id });
    console.log("👥 Direct Referrals:", referralCount);

    // ✅ PROCESS LOGIN IPs
    let loginIPs: Array<{ ip: string; lastLogin: string; count: number }> = [];
    let registrationIP = "Not tracked";

    if ((user as any).loginHistory && Array.isArray((user as any).loginHistory)) {
      const ipMap = new Map<string, { count: number; lastLogin: Date }>();
      
      (user as any).loginHistory.forEach((login: any) => {
        const ip = login.ip || login.ipAddress || "::1";
        const loginDate = login.timestamp || login.loginAt || login.createdAt || new Date();
        
        if (ipMap.has(ip)) {
          const existing = ipMap.get(ip)!;
          existing.count++;
          if (new Date(loginDate) > existing.lastLogin) {
            existing.lastLogin = new Date(loginDate);
          }
        } else {
          ipMap.set(ip, { count: 1, lastLogin: new Date(loginDate) });
        }
      });

      loginIPs = Array.from(ipMap.entries()).map(([ip, data]) => ({
        ip,
        lastLogin: data.lastLogin.toISOString(),
        count: data.count
      }));

      console.log("🌐 Login IPs processed:", loginIPs.length);
    }

    if ((user as any).registrationIP) {
      registrationIP = (user as any).registrationIP;
    }

    // ✅ BUILD ENHANCED USER OBJECT
    const enhancedUser = {
      ...(user as any),
      
      // Override with calculated values
      totalDeposits: totalDepositsAmount,
      totalWithdrawals: totalWithdrawalsAmount,
      
      // Add IP tracking
      loginIPs: loginIPs.length > 0 ? loginIPs : undefined,
      registrationIP,
      
      // Add statistics
      stats: {
        totalDeposits: deposits.length,
        approvedDeposits: approvedDeposits.length,
        pendingDeposits: pendingDeposits.length,
        totalWithdrawals: withdrawals.length,
        approvedWithdrawals: approvedWithdrawals.length,
        pendingWithdrawals: pendingWithdrawals.length,
        directReferrals: referralCount,
        totalTransactions: deposits.length + withdrawals.length
      },
      
      // Add recent transactions
      recentDeposits: deposits.slice(0, 10).map((d: any) => ({
        _id: d._id,
        amount: d.amount,
        status: d.status,
        method: d.paymentMethod || d.method || "N/A",
        createdAt: d.createdAt,
        approvedAt: d.approvedAt
      })),
      recentWithdrawals: withdrawals.slice(0, 10).map((w: any) => ({
        _id: w._id,
        amount: w.amount,
        status: w.status,
        method: w.withdrawalMethod || w.method || "N/A",
        createdAt: w.createdAt,
        approvedAt: w.approvedAt
      }))
    };

    console.log("=".repeat(60));
    console.log("✅ USER DETAILS COMPILED - Admin:", admin.email);
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      success: true,
      user: enhancedUser,
    });

  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}