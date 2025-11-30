import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ✅ GET method bhi implement karo (same as POST)
export async function GET() {
  try {
    console.log("🚪 Logout API called (GET)");
    
    const response = NextResponse.json({
      message: "Logout successful"
    });

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    console.log("✅ Cookie cleared");
    
    return response;
  } catch (error) {
    console.error("❌ Logout error:", error);
    return NextResponse.json(
      { message: "Logout failed" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log("🚪 Logout API called (POST)");
    
    const response = NextResponse.json({
      message: "Logout successful"
    });

    // Delete the token cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ Production mein secure
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    console.log("✅ Cookie cleared");
    
    return response;
  } catch (error) {
    console.error("❌ Logout error:", error);
    return NextResponse.json(
      { message: "Logout failed" },
      { status: 500 }
    );
  }
}