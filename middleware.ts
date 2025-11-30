import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * ============================================
 * 🔐 ROUTE PROXY & AUTHENTICATION MIDDLEWARE
 * ============================================
 * ✅ Supports:
 * ✅ Normal JWT login (token cookie)
 * ✅ Google OAuth via NextAuth
 * ✅ Vercel compatible
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
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ✅ Get token from NextAuth / JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ❌ If NOT logged in → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// ✅ IMPORTANT: Matcher config (Vercel safe)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wallet/:path*",
    "/stake/:path*",
    "/deposit/:path*",
    "/withdraw/:path*",
    "/profile/:path*",
    "/referrals/:path*",
  ],
};
