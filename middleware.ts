import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * ============================================
 * 🔐 FINAL AUTH + 2FA AWARE MIDDLEWARE
 * ============================================
 * ✅ Supports:
 * ✅ Normal JWT login
 * ✅ Google OAuth (NextAuth)
 * ✅ 2FA Protection
 * ✅ NO MORE LOGIN LOOP
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Public Routes (NO AUTH REQUIRED)
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/admin/login",
    "/api/auth",
    "/auth/verify-otp",        // ✅ OTP verify page allow
    "/auth/forgot-password",  // ✅ password reset allow
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ✅ Get token from NextAuth / JWT
  const token: any = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ❌ If NOT logged in → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ✅ ✅ ✅ 2FA LOOP STOPPER (MOST IMPORTANT PART)
  if (token.twoFactorVerified !== true) {
    return NextResponse.redirect(new URL("/auth/verify-otp", request.url));
  }

  return NextResponse.next();
}

// ✅ ✅ FINAL MATCHER (CLEAN + SAFE)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wallet/:path*",
    "/stake/:path*",
    "/deposit/:path*",
    "/withdraw/:path*",
    "/profile/:path*",
    "/referrals/:path*",
    "/settings/:path*",
  ],
};
