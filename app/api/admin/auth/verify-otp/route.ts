import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";

// Enforce environment variables presence at build time for safety
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // This check is important, although the ! in jwt.sign suppresses the TypeScript error
  console.error("CRITICAL: JWT_SECRET environment variable is missing.");
  // It is generally safer to check this outside async functions if possible
}

// Ensure Vercel uses the Node.js runtime for JWT and Database operations
export const runtime = 'nodejs'; 

/**
 * @name POST_AdminOTPVerification
 * @description Verifies the provided OTP against the stored code and generates a long-lived JWT token.
 * @access Public (OTP required)
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    const { tempToken, otp } = await req.json();

    console.log("🔍 Verifying OTP:", { otp: otp ? "provided" : "missing", tempToken: tempToken ? "provided" : "missing" });

    if (!tempToken || !otp) {
      return NextResponse.json(
        { success: false, message: "Verification code and session token are required." },
        { status: 400 } // Bad Request
      );
    }

    // --- 1. Verify Temporary Token ---
    let decoded: { id: string, email: string, temp: boolean, purpose: string };
    try {
      if (!JWT_SECRET) throw new Error("Server configuration error.");
      
      decoded = jwt.verify(tempToken, JWT_SECRET) as any;
      
      if (!decoded.temp || decoded.purpose !== "admin-otp-verification") {
        throw new Error("Invalid token purpose or format.");
      }
      console.log("✅ Temporary token verified for:", decoded.email);

    } catch (error: any) {
      console.error("❌ Temporary Token verification failed:", error.message);
      return NextResponse.json(
        { success: false, message: "Invalid or expired session. Please start the login process again." },
        { status: 401 } // Unauthorized
      );
    }

    // --- 2. Fetch User and Check Authorization ---
    // SELECT OTP fields explicitly as they might be excluded by default in the Mongoose schema
    const user = await User.findById(decoded.id).select("+adminOTP +adminOTPExpires");

    if (!user || user.isAdmin !== true) {
      console.error("❌ User not found or not an admin.");
      return NextResponse.json(
        { success: false, message: "Unauthorized access attempt." },
        { status: 403 } // Forbidden
      );
    }

    // --- 3. OTP Presence and Expiry Check ---
    if (!user.adminOTP || !user.adminOTPExpires) {
      console.error("❌ No active OTP found in database for user.");
      return NextResponse.json(
        { success: false, message: "No active verification code found. Please request a new one." },
        { status: 401 }
      );
    }

    const now = new Date();
    const expiryTime = new Date(user.adminOTPExpires);
    
    if (now > expiryTime) {
      console.error(`❌ OTP expired.`);
      
      // Clear expired OTP immediately
      user.adminOTP = undefined;
      user.adminOTPExpires = undefined;
      await user.save();

      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new one." },
        { status: 401 }
      );
    }

    // --- 4. OTP Comparison ---
    const storedOTP = String(user.adminOTP).trim();
    const providedOTP = String(otp).trim();
    
    if (storedOTP !== providedOTP) {
      console.error("❌ OTP mismatch.");
      return NextResponse.json(
        { success: false, message: "Invalid verification code. Please check and try again." },
        { status: 401 }
      );
    }

    // --- 5. SUCCESS: Clear OTP and Generate Final Token ---
    user.adminOTP = undefined;
    user.adminOTPExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    console.log("✅ OTP verified successfully. Generating session token.");

    // Generate full access token (7 days)
    const accessToken = jwt.sign(
      {
        id: user._id?.toString(),
        email: user.email,
        role: "admin",
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: "7d" } // 7 days expiration time
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful. Welcome to Admin Portal!",
      user: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        isAdmin: true,
        role: "admin"
      }
    });

    // --- 6. Set Secure and Consistent Cookie ---
    // Settings MUST MATCH the expected cookie in the previous GET API handler
    response.cookies.set("token", accessToken, {
      httpOnly: true, // IMPORTANT: Prevents client-side JS access (security)
      secure: process.env.NODE_ENV === "production", // IMPORTANT: Only send over HTTPS in production
      sameSite: "lax", // Recommended for general use; protects against basic CSRF
      maxAge: 60 * 60 * 24 * 7, // 7 days (7d in seconds)
      path: "/", // IMPORTANT: Ensures the cookie is sent to all routes (like the /api/admin/stats GET route)
    });

    console.log("✅ Admin session token cookie set successfully.");

    return response;

  } catch (error: any) {
    console.error("❌ Internal OTP verification/Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error during login process." },
      { status: 500 }
    );
  }
}