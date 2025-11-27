import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Deposit from "@/lib/models/deposit";
import Withdraw from "@/lib/models/withdraw";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    // Authentication Check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing in environment");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify Token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Check Admin Status
    const admin = await User.findById(decoded.id).lean();

    if (!admin || admin.isAdmin !== true) {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // Fetch Stats
    const [users, deposits, withdrawals] = await Promise.all([
      User.find({}).select('walletBalance stakedBalance referralEarnings levelIncome').lean(),
      Deposit.find({}).select('amount status createdAt').lean(),
      Withdraw.find({}).select('amount status createdAt').lean(),
    ]);

    const totalUsers = users.length;

    // Approved Totals
    const approvedDeposits = deposits.filter((d) => d.status === "approved");
    const totalDeposits = approvedDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    const approvedWithdrawals = withdrawals.filter((w) => w.status === "approved");
    const totalWithdrawals = approvedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    const totalReferral = users.reduce((sum, u) => sum + (u.referralEarnings || 0), 0);
    const totalLevel = users.reduce((sum, u) => sum + (u.levelIncome || 0), 0);
    const totalStaked = users.reduce((sum, u) => sum + (u.stakedBalance || 0), 0);
    const totalWalletBalance = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);

    // Pending Counts
    const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
    const approvedDepositsCount = approvedDeposits.length;
    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").length;
    const approvedWithdrawalsCount = approvedWithdrawals.length;

    // Today's Activity (Approved Only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeposits = approvedDeposits
      .filter((d) => d.createdAt && new Date(d.createdAt) >= today)
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const todayWithdrawals = approvedWithdrawals
      .filter((w) => w.createdAt && new Date(w.createdAt) >= today)
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // Last 7 Days History (Approved Only)
    const dailyHistory = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayDeposits = approvedDeposits
        .filter((d) => {
          if (!d.createdAt) return false;
          const createdDate = new Date(d.createdAt);
          return createdDate >= date && createdDate < nextDay;
        })
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      const dayWithdrawals = approvedWithdrawals
        .filter((w) => {
          if (!w.createdAt) return false;
          const createdDate = new Date(w.createdAt);
          return createdDate >= date && createdDate < nextDay;
        })
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      dailyHistory.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        deposits: dayDeposits,
        withdrawals: dayWithdrawals,
      });
    }

    // Return Response
    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers,
          totalDeposits,
          pendingDeposits,
          approvedDeposits: approvedDepositsCount,
          totalWithdrawals,
          pendingWithdrawals,
          approvedWithdrawals: approvedWithdrawalsCount,
          totalReferral,
          totalLevel,
          totalStaked,
          totalWalletBalance,
          todayDeposits,
          todayWithdrawals,
          dailyHistory,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );

  } catch (error: any) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}