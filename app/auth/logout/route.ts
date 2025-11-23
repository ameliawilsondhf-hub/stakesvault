import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // ✅ Delete JWT token cookie
    (await cookieStore).delete("token");
    
    // ✅ Delete NextAuth session cookies
    (await cookieStore).delete("next-auth.session-token");
    (await cookieStore).delete("__Secure-next-auth.session-token");
    (await cookieStore).delete("next-auth.csrf-token");
    (await cookieStore).delete("__Host-next-auth.csrf-token");
    
    console.log("✅ User logged out successfully");

    // ✅ Redirect to login page
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    
  } catch (error: any) {
    console.error("❌ Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed", details: error.message },
      { status: 500 }
    );
  }
}