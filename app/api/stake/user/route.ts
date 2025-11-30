import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import Stake from "@/lib/models/stake";
import connectDB from "@/lib/mongodb";
import { Types } from "mongoose";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Stake Interface
 */
interface IStake {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  stakedAt: Date;
  unlockDate: Date;
  lockPeriod: number;
  status: 'active' | 'completed' | 'withdrawn';
  apy: number;
  earnedRewards: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response Interface
 */
interface StakeResponse {
  success: boolean;
  msg?: string;
  stakes?: IStake[];
  error?: string;
  metadata?: {
    totalStakes: number;
    totalAmount: number;
    activeStakes: number;
  };
}

/**
 * GET /api/stake/user
 * 
 * Retrieves all stakes for the authenticated user
 * 
 * @authentication Required (NextAuth or JWT)
 * @returns {StakeResponse} List of user's stakes
 * 
 * @example Response
 * ```json
 * {
 *   "success": true,
 *   "stakes": [
 *     {
 *       "_id": "...",
 *       "amount": 1000,
 *       "status": "active",
 *       "apy": 12.5,
 *       "earnedRewards": 50
 *     }
 *   ],
 *   "metadata": {
 *     "totalStakes": 5,
 *     "totalAmount": 5000,
 *     "activeStakes": 3
 *   }
 * }
 * ```
 */
export async function GET(): Promise<NextResponse<StakeResponse>> {
  const startTime = Date.now();
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store"
  };

  try {
    // Connect to database
    await connectDB();
    console.log(`[STAKE] Database connected in ${Date.now() - startTime}ms`);

    // Authenticate user
    const userId = await getAuthUserId();

    if (!userId) {
      console.log("[STAKE] ⚠️ Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false, 
          msg: "Authentication required. Please log in to view your stakes." 
        },
        { 
          status: 401,
          headers 
        }
      );
    }

    console.log(`[STAKE] Fetching stakes for user: ${userId}`);

    // Validate user ID format
    if (!Types.ObjectId.isValid(userId)) {
      console.error(`[STAKE] ❌ Invalid user ID format: ${userId}`);
      return NextResponse.json(
        { 
          success: false, 
          msg: "Invalid user ID format" 
        },
        { 
          status: 400,
          headers 
        }
      );
    }

    // Fetch user stakes sorted by creation date (newest first)
    const stakes = await Stake.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean<IStake[]>();

    console.log(`[STAKE] ✅ Found ${stakes.length} stakes for user ${userId}`);

    // Calculate metadata
    const metadata = {
      totalStakes: stakes.length,
      totalAmount: stakes.reduce((sum, stake) => sum + stake.amount, 0),
      activeStakes: stakes.filter(stake => stake.status === 'active').length
    };

    const executionTime = Date.now() - startTime;
    console.log(`[STAKE] ✅ Stakes retrieved successfully in ${executionTime}ms`);

    return NextResponse.json(
      {
        success: true,
        stakes,
        metadata
      },
      {
        status: 200,
        headers
      }
    );

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[STAKE] ❌ Error after ${executionTime}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    // Handle specific MongoDB errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          msg: "Database connection error. Please try again.",
          error: "Database unavailable" 
        },
        { 
          status: 503,
          headers 
        }
      );
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { 
          success: false, 
          msg: "Invalid data format",
          error: error.message 
        },
        { 
          status: 400,
          headers 
        }
      );
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        msg: "An unexpected error occurred while fetching stakes",
        error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      },
      { 
        status: 500,
        headers 
      }
    );
  }
}