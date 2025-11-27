import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ============================================
 * 🔒 ROUTE PROXY & AUTHENTICATION MIDDLEWARE
 * ============================================
 * This proxy middleware handles:
 * - Admin route protection
 * - User authentication checks
 * - Automatic redirects
 * - Security layer for protected routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token");

  // ============================================
  // 🛡️ ADMIN PROXY LAYER
  // ============================================
  if (pathname.startsWith("/admin")) {
    
    // ✅ Allow login page without authentication
    if (pathname === "/admin/login") {
      // If already logged in, redirect to admin dashboard
      if (token) {
        console.log(`🔄 Admin Proxy: Already authenticated, redirecting to dashboard`);
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // 🚨 Block all other admin routes without token
    if (!token) {
      console.log(`🚨 Admin Proxy: Blocked unauthorized access → ${pathname}`);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // ✅ Token exists - allow access (backend APIs will verify admin role)
    console.log(`✅ Admin Proxy: Access granted → ${pathname}`);
  }

  // ============================================
  // 🛡️ DASHBOARD PROXY LAYER
  // ============================================
  if (pathname.startsWith("/dashboard")) {
    
    // 🚨 Block dashboard without authentication
    if (!token) {
      console.log(`🚨 Dashboard Proxy: Blocked unauthorized access → ${pathname}`);
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // ✅ Token exists - allow access
    console.log(`✅ Dashboard Proxy: Access granted → ${pathname}`);
  }

  return NextResponse.next();
}

/**
 * ============================================
 * 🎯 MATCHER CONFIGURATION
 * ============================================
 * Defines which routes this middleware should run on
 */
export const config = {
  matcher: [
    "/admin/:path*",      // All admin routes
    "/dashboard/:path*",  // All dashboard routes
  ],
};

