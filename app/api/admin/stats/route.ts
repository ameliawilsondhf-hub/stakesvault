import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";

import User from "@/lib/models/user";
import Deposit from "@/lib/models/deposit";
import Withdraw from "@/lib/models/withdraw";

export async function GET() {
  try {
    await connectDB();

    // -----------------------------
    // 🔐 CHECK TOKEN
    // -----------------------------
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "Server config error" },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Fetch admin user
    const admin = await User.findById(decoded.id);

    if (!admin || admin.isAdmin !== true) {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // -----------------------------
    // 📊 FETCH ALL DATABASE DATA
    // -----------------------------
    const users = await User.find({});
    const deposits = await Deposit.find({});
    const withdrawals = await Withdraw.find({});

    const totalUsers = users.length;

    // APPROVED TOTALS
    const totalDeposits = deposits
      .filter((d) => d.status === "approved")
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const totalWithdrawals = withdrawals
      .filter((w) => w.status === "approved")
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const totalReferral = users.reduce(
      (sum, u) => sum + (u.referralEarnings || 0),
      0
    );

    const totalLevel = users.reduce(
      (sum, u) => sum + (u.levelIncome || 0),
      0
    );

    const totalStaked = users.reduce(
      (sum, u) => sum + (u.stakedBalance || 0),
      0
    );

    const totalWalletBalance = users.reduce(
      (sum, u) => sum + (u.walletBalance || 0),
      0
    );

    // PENDING COUNTS
    const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").length;

    // -----------------------------
    // 📅 TODAY'S APPROVED ONLY
    // -----------------------------
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeposits = deposits
      .filter(
        (d) =>
          d.status === "approved" &&
          d.createdAt &&
          new Date(d.createdAt) >= today
      )
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const todayWithdrawals = withdrawals
      .filter(
        (w) =>
          w.status === "approved" &&
          w.createdAt &&
          new Date(w.createdAt) >= today
      )
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // -----------------------------
    // 📉 LAST 7 DAY HISTORY (APPROVED)
    // -----------------------------
    const history = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const next = new Date(date);
      next.setDate(next.getDate() + 1);

      const dayDeposits = deposits
        .filter(
          (d) =>
            d.status === "approved" &&
            d.createdAt &&
            new Date(d.createdAt) >= date &&
            new Date(d.createdAt) < next
        )
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      const dayWithdrawals = withdrawals
        .filter(
          (w) =>
            w.status === "approved" &&
            w.createdAt &&
            new Date(w.createdAt) >= date &&
            new Date(w.createdAt) < next
        )
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      history.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        deposits: dayDeposits,
        withdrawals: dayWithdrawals,
      });
    }

    // -----------------------------
    // ✅ SEND RESPONSE
    // -----------------------------
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        totalReferral,
        totalLevel,
        totalStaked,
        totalWalletBalance,

        pendingDeposits,
        pendingWithdrawals,

        todayDeposits,
        todayWithdrawals,

        dailyHistory: history,
      },
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
