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
    const admin = await User.findById(decoded.id).select('isAdmin').lean();

    if (!admin || admin.isAdmin !== true) {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // OPTIMIZATION 1: Use MongoDB Aggregation instead of loading all data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [userStats, depositStats, withdrawalStats, dailyStats] = await Promise.all([
      // User aggregation
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalWalletBalance: { $sum: '$walletBalance' },
            totalStaked: { $sum: '$stakedBalance' },
            totalReferral: { $sum: '$referralEarnings' },
            totalLevel: { $sum: '$levelIncome' }
          }
        }
      ]),

      // Deposit aggregation
      Deposit.aggregate([
        {
          $facet: {
            approved: [
              { $match: { status: 'approved' } },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' },
                  count: { $sum: 1 },
                  todayTotal: {
                    $sum: {
                      $cond: [
                        { $gte: ['$createdAt', today] },
                        '$amount',
                        0
                      ]
                    }
                  }
                }
              }
            ],
            pending: [
              { $match: { status: 'pending' } },
              { $count: 'count' }
            ]
          }
        }
      ]),

      // Withdrawal aggregation
      Withdraw.aggregate([
        {
          $facet: {
            approved: [
              { $match: { status: 'approved' } },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' },
                  count: { $sum: 1 },
                  todayTotal: {
                    $sum: {
                      $cond: [
                        { $gte: ['$createdAt', today] },
                        '$amount',
                        0
                      ]
                    }
                  }
                }
              }
            ],
            pending: [
              { $match: { status: 'pending' } },
              { $count: 'count' }
            ]
          }
        }
      ]),

      // Daily history for last 7 days (deposits and withdrawals combined)
      Promise.all([
        Deposit.aggregate([
          {
            $match: {
              status: 'approved',
              createdAt: { $gte: sevenDaysAgo }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              total: { $sum: '$amount' }
            }
          }
        ]),
        Withdraw.aggregate([
          {
            $match: {
              status: 'approved',
              createdAt: { $gte: sevenDaysAgo }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              total: { $sum: '$amount' }
            }
          }
        ])
      ])
    ]);

    // Extract aggregation results with safe defaults
    const users = userStats[0] || {
      totalUsers: 0,
      totalWalletBalance: 0,
      totalStaked: 0,
      totalReferral: 0,
      totalLevel: 0
    };

    const deposits = {
      approved: depositStats[0].approved[0] || { total: 0, count: 0, todayTotal: 0 },
      pending: depositStats[0].pending[0]?.count || 0
    };

    const withdrawals = {
      approved: withdrawalStats[0].approved[0] || { total: 0, count: 0, todayTotal: 0 },
      pending: withdrawalStats[0].pending[0]?.count || 0
    };

    // Build daily history
    const [depositsByDay, withdrawalsByDay] = dailyStats;
    
    const depositMap = new Map(
      depositsByDay.map(d => [d._id, d.total])
    );
    const withdrawalMap = new Map(
      withdrawalsByDay.map(w => [w._id, w.total])
    );

    const dailyHistory = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateKey = date.toISOString().split('T')[0];
      
      dailyHistory.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        deposits: depositMap.get(dateKey) || 0,
        withdrawals: withdrawalMap.get(dateKey) || 0,
      });
    }

    // Return Response
    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers: users.totalUsers,
          totalDeposits: deposits.approved.total,
          pendingDeposits: deposits.pending,
          approvedDeposits: deposits.approved.count,
          totalWithdrawals: withdrawals.approved.total,
          pendingWithdrawals: withdrawals.pending,
          approvedWithdrawals: withdrawals.approved.count,
          totalReferral: users.totalReferral,
          totalLevel: users.totalLevel,
          totalStaked: users.totalStaked,
          totalWalletBalance: users.totalWalletBalance,
          todayDeposits: deposits.approved.todayTotal,
          todayWithdrawals: withdrawals.approved.todayTotal,
          dailyHistory,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
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