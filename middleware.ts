import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * ============================================
 * 🔒 ROUTE PROXY & AUTHENTICATION MIDDLEWARE
 * ============================================
 * Supports:
 * ✅ Normal JWT login (token cookie)
 * ✅ Google OAuth via NextAuth
 * ✅ Vercel compatible
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Google / NextAuth Token
const nextAuthToken = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET
});

  // ✅ Custom JWT Token (your normal login)
  const customToken = request.cookies.get("token");

  // ✅ Final authentication check
  const isAuthenticated = nextAuthToken || customToken;

  // ============================================
  // 🛡️ ADMIN PROXY LAYER
  // ============================================
  if (pathname.startsWith("/admin")) {

    // ✅ Allow admin login page without authentication
    if (pathname === "/admin/login") {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // 🚨 Block all other admin routes without auth
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // ============================================
  // 🛡️ DASHBOARD PROXY LAYER
  // ============================================
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

/**
 * ============================================
 * 🎯 MATCHER CONFIGURATION
 * ============================================
 */
export const config = {
  matcher: [
    "/admin/:path*",      
    "/dashboard/:path*",  
  ],
};
