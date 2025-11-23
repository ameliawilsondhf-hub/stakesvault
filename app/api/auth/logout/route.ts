import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("🚪 Logout API called");
    
    const response = NextResponse.json({
      message: "Logout successful"
    });

    // Delete the token cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0, // ✅ Immediately expire
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