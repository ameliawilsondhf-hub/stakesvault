import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -------------------------------
  // ✅ PUBLIC ROUTES (NO LOGIN NEEDED)
  // -------------------------------
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/admin/login",
    "/auth/forgot-password",
    "/auth/verify-otp",
    "/api/auth",
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // -------------------------------
  // ✅ GET USER TOKEN
  // -------------------------------
  const token: any = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // -------------------------------
  // ❌ NOT LOGGED IN → SEND TO LOGIN
  // -------------------------------
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // -------------------------------
  // 🚫 STOP LOGIN UNTIL OTP VERIFIED
  // -------------------------------
  if (token.temp === true) {
    return NextResponse.redirect(new URL("/auth/verify-otp", request.url));
  }

  return NextResponse.next();
}

// -------------------------------
// ✅ ROUTES THAT REQUIRE AUTH ONLY
// -------------------------------
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
