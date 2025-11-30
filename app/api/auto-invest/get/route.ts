import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/user";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API Response Interface
 */
interface AutoInvestResponse {
  success: boolean;
  message?: string;
  data?: {
    enabled: boolean;
    settings: {
      enabled: boolean;
      lockPeriod: number;
      minAmount: number;
    };
  };
  error?: string;
}

/**
 * GET /api/auto-invest/get
 * 
 * Retrieves user's auto-invest settings
 * 
 * @authentication Required (NextAuth or JWT)
 * @returns {AutoInvestResponse} User's auto-invest configuration
 * 
 * @example Response
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "enabled": true,
 *     "settings": {
 *       "enabled": true,
 *       "lockPeriod": 30,
 *       "minAmount": 100
 *     }
 *   }
 * }
 * ```
 */
export async function GET(): Promise<NextResponse<AutoInvestResponse>> {
  const startTime = Date.now();
  
  try {
    // Connect to database
    await connectDB();
    console.log(`[AUTO-INVEST] Database connected in ${Date.now() - startTime}ms`);

    // Authenticate user
    const userId = await getAuthUserId();

    if (!userId) {
      console.log("[AUTO-INVEST] ⚠️ Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false, 
          message: "Authentication required. Please log in to continue." 
        },
        { 
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache"
          }
        }
      );
    }

    console.log(`[AUTO-INVEST] Fetching settings for user: ${userId}`);

    // Fetch user with auto-invest settings
    const user = await User.findById(userId)
      .select('autoInvestEnabled autoInvestSettings')
      .lean();

    if (!user) {
      console.error(`[AUTO-INVEST] ❌ User not found: ${userId}`);
      return NextResponse.json(
        { 
          success: false, 
          message: "User account not found" 
        },
        { status: 404 }
      );
    }

    // Prepare response with defaults
    const response: AutoInvestResponse = {
      success: true,
      data: {
        enabled: user.autoInvestEnabled || false,
        settings: user.autoInvestSettings || {
          enabled: false,
          lockPeriod: 30,
          minAmount: 100
        }
      }
    };

    const executionTime = Date.now() - startTime;
    console.log(`[AUTO-INVEST] ✅ Settings retrieved successfully in ${executionTime}ms`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      }
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[AUTO-INVEST] ❌ Error after ${executionTime}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Handle specific error types
    if (error.name === 'CastError') {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid user ID format",
          error: error.message 
        },
        { status: 400 }
      );
    }

    if (error.name === 'MongoNetworkError') {
      return NextResponse.json(
        { 
          success: false, 
          message: "Database connection error",
          error: "Unable to connect to database" 
        },
        { status: 503 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        message: "An unexpected error occurred",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}