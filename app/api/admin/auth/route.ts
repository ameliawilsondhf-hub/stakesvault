import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Admin credentials from .env
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@stakevault.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@StakeVault2025";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log("🔐 Login attempt:", email); // Debug log

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    // Check admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      
      console.log("✅ Credentials matched!"); // Debug log

      // 🔥 JWT token with isAdmin flag (middleware ke liye ZAROORI hai)
      const token = jwt.sign(
        { 
          email: email,
          role: "admin",
          isAdmin: true,  // ✅ YE FLAG ZAROORI HAI - middleware check karega
          timestamp: Date.now()
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ✅ Response with cookie set
      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        token: token,
        admin: {
          email: email,
          role: "admin",
          isAdmin: true
        }
      });

      // 🔥 Cookie set karo (middleware "token" naam se check karta hai)
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/"
      });

      console.log("🍪 Cookie set successfully"); // Debug log

      return response;

    } else {
      console.log("❌ Invalid credentials"); // Debug log
      return NextResponse.json(
        { success: false, message: "Invalid admin credentials" },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error("💥 Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}