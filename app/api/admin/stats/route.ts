import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
// @ts-ignore
import connectDB from "@/lib/mongodb";
// @ts-ignore
import User from "@/lib/models/user";
// @ts-ignore
import Deposit from "@/lib/models/deposit";
// @ts-ignore
import Withdraw from "@/lib/models/withdraw";

// Force dynamic rendering to ensure fresh data and prevent caching on Vercel Edge
export const dynamic = 'force-dynamic'; 
// Explicitly use nodejs runtime if relying on MongoDB/Mongoose (recommended)
export const runtime = 'nodejs'; 
export const revalidate = 0; // Ensure no static caching

/**
 * @name GET_AdminDashboardStats
 * @description Fetches comprehensive administrative statistics using MongoDB aggregation.
 * @access Admin Only (Requires 'token' cookie and User.isAdmin === true)
 */
export async function GET() {
  try {
    await connectDB();

    // --- 1. Authentication Check (Token Presence) ---
const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      // User is not sending a token cookie
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check for JWT Secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("Server Configuration Error: JWT_SECRET missing in environment");
      return NextResponse.json(
        { success: false, message: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // --- 2. Token Verification ---
    let decoded: { id: string, iat: number, exp: number };
    try {
      decoded = jwt.verify(token, jwtSecret) as { id: string, iat: number, exp: number };
      
    } catch (err) {
      // Token is invalid (expired, tampered, or wrong secret)
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // --- 3. Authorization Check (Admin Status) ---
    const admin = await User.findById(decoded.id).select('isAdmin').lean();

    if (!admin || admin.isAdmin !== true) {
      // User is authenticated but does not have admin privileges
      return NextResponse.json(
        { success: false, message: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // --- 4. Data Aggregation & Processing ---
    
    // Date utility setup for current day and last 7 days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Use UTC for consistent date comparisons across server regions

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

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
          },
          { $sort: { _id: 1 } } // Sort by date
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
          },
          { $sort: { _id: 1 } } // Sort by date
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

    const depositFacet = depositStats?.[0] || { approved: [], pending: [] };
    const deposits = {
      approved: depositFacet.approved?.[0] || { total: 0, count: 0, todayTotal: 0 },
      pending: depositFacet.pending?.[0]?.count || 0
    };

    const withdrawalFacet = withdrawalStats?.[0] || { approved: [], pending: [] };
    const withdrawals = {
      approved: withdrawalFacet.approved?.[0] || { total: 0, count: 0, todayTotal: 0 },
      pending: withdrawalFacet.pending?.[0]?.count || 0
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
      
      const dateKey = date.toISOString().split('T')[0];
      
      dailyHistory.push({
        // Format date for display
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        deposits: depositMap.get(dateKey) || 0,
        withdrawals: withdrawalMap.get(dateKey) || 0,
      });
    }

    // --- 5. Return Response ---
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
        // Add cache-control headers to prevent client-side caching
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
      }
    );

  } catch (error: any) {
    console.error("Admin Stats Error:", error);
    // Return a generic error in production, but include details in development
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal Server Error during data processing.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
