import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ✅ CRITICAL FIX: Force Node.js runtime for JWT verification
export const runtime = 'nodejs';

// -------------------------------
// 🎯 ROLE DEFINITIONS
// -------------------------------
enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  MODERATOR = "moderator",
}

// -------------------------------
// 🔐 PERMISSION LEVELS
// -------------------------------
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

// -------------------------------
// 🌍 IP EXTRACTION (Vercel Compatible)
// -------------------------------
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) return cfConnectingIP;

  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return request.ip || "unknown";
}

// -------------------------------
// 🔒 SECURITY HEADERS (✅ FIXED CSP)
// -------------------------------
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // ✅ FIXED: Allow images from external sources and data URIs
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: http: blob:; " + // ✅ Allows all images
    "font-src 'self' data: https://cdnjs.cloudflare.com; " +
    "connect-src 'self' https:; " +
    "media-src 'self' https: data:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  return response;
}

// -------------------------------
// 🚨 RATE LIMITING (Simple In-Memory)
// -------------------------------
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (rateLimitMap.size > 1000) {
    cleanupRateLimitMap();
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

function cleanupRateLimitMap() {
  const now = Date.now();
  const entries = Array.from(rateLimitMap.entries());
  for (const [ip, record] of entries) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

// -------------------------------
// 📍 ROUTE CONFIGURATION
// -------------------------------
interface RouteConfig {
  path: string;
  minRole: UserRole;
  rateLimit?: { max: number; window: number };
}

const PROTECTED_ROUTES: RouteConfig[] = [
  // User routes
  { path: "/dashboard", minRole: UserRole.USER },
  { path: "/wallet", minRole: UserRole.USER },
  { path: "/stake", minRole: UserRole.USER },
  { path: "/deposit", minRole: UserRole.USER },
  { path: "/withdraw", minRole: UserRole.USER },
  { path: "/profile", minRole: UserRole.USER },
  { path: "/referrals", minRole: UserRole.USER },
  { path: "/settings", minRole: UserRole.USER },

  // Admin routes (UI only)
  {
    path: "/admin",
    minRole: UserRole.ADMIN,
    rateLimit: { max: 50, window: 60000 },
  },

  // Super admin routes
  { path: "/super-admin", minRole: UserRole.SUPER_ADMIN },
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/admin/login",
  "/auth/forgot-password",
  "/auth/verify-otp",
  "/auth/reset-password",
  "/api/auth", // NextAuth routes
  "/terms",
  "/privacy",
  "/contact",
  "/_next",
  "/favicon.ico",
  "/api/health",
  "/api/admin", // ✅ Admin APIs handle their own auth
  "/api/super-admin",
  "/api/settings", // ✅ Settings API
];

// -------------------------------
// 🔍 HELPER FUNCTIONS
// -------------------------------
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function getRouteConfig(pathname: string): RouteConfig | null {
  return (
    PROTECTED_ROUTES.find((route) => pathname.startsWith(route.path)) || null
  );
}

function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

function createErrorResponse(
  message: string,
  status: number,
  isApiRoute: boolean,
  request: NextRequest
): NextResponse {
  if (isApiRoute) {
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: status,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  const redirectMap: Record<number, string> = {
    401: "/auth/login",
    403: "/dashboard",
    429: "/error/rate-limit",
  };

  return NextResponse.redirect(
    new URL(redirectMap[status] || "/", request.url)
  );
}

// -------------------------------
// 🛡️ MAIN MIDDLEWARE
// -------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");

  console.log("\n🔍 [MIDDLEWARE] Request:", { pathname, isApiRoute });

  // Allow public routes
  if (isPublicRoute(pathname)) {
    console.log("✅ [PUBLIC ROUTE] Allowing:", pathname);
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  const clientIP = getClientIP(request);

  const routeConfig = getRouteConfig(pathname);
  if (!routeConfig) {
    console.log("ℹ️ [NO CONFIG] No protection for:", pathname);
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  console.log("🔒 [PROTECTED ROUTE] Config:", {
    path: routeConfig.path,
    minRole: routeConfig.minRole
  });

  // Check rate limit
  const rateLimitConfig = routeConfig.rateLimit || { max: 100, window: 60000 };
  if (!checkRateLimit(clientIP, rateLimitConfig.max, rateLimitConfig.window)) {
    console.warn(`⚠️ [RATE LIMIT] IP: ${clientIP}, Path: ${pathname}`);
    return createErrorResponse(
      "Too many requests. Please try again later.",
      429,
      isApiRoute,
      request
    );
  }

  // ✅ Get user token - Check both NextAuth and manual JWT
  console.log("🔑 [TOKEN CHECK] Checking NextAuth token...");
  let token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ✅ If no NextAuth token, check for manual JWT token in cookies
  if (!token) {
    console.log("⚠️ [NO NEXTAUTH TOKEN] Checking manual JWT...");
    const manualToken = request.cookies.get("token")?.value;
    
    console.log("🍪 [COOKIES]", {
      hasManualToken: !!manualToken,
      allCookies: request.cookies.getAll().map(c => c.name)
    });
    
    if (manualToken) {
      try {
        const jwt = require("jsonwebtoken");
        
        console.log("🔓 [JWT VERIFY] Attempting to verify manual token...");
        console.log("🔐 [JWT SECRET] Using secret:", process.env.JWT_SECRET ? "SET" : "NOT SET");
        
        const decoded = jwt.verify(manualToken, process.env.JWT_SECRET) as any;
        
        console.log("✅ [JWT DECODED]", {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          isAdmin: decoded.isAdmin,
          temp: decoded.temp
        });
        
        // Convert manual JWT to token format
      token = {
  id: decoded.id,
  email: decoded.email,
  role: decoded.role || (decoded.isAdmin ? "admin" : "user"),
  isAdmin: decoded.isAdmin,
  temp: decoded.temp || false,
  status: decoded.status || "active", // ✅ real status use karo
} as any;

        
        console.log("✅ [MANUAL JWT] Token verified for:", token.email);
      } catch (error: any) {
        console.error("❌ [JWT ERROR] Verification failed:", {
          message: error.message,
          name: error.name
        });
      }
    } else {
      console.error("❌ [NO TOKEN] No manual JWT token found in cookies");
    }
  } else {
    console.log("✅ [NEXTAUTH TOKEN] Found for:", token.email);
  }

  // Check authentication
  if (!token) {
    console.warn(`❌ [UNAUTHORIZED] No valid token found for: ${pathname}`);
    console.warn(`❌ [REDIRECT] Sending to /auth/login`);
    return createErrorResponse(
      "Authentication required",
      401,
      isApiRoute,
      request
    );
  }

  console.log("✅ [AUTHENTICATED] User:", token.email);

  // Check OTP verification
if (token?.temp === true) {
  if (!pathname.startsWith("/auth/verify-otp") && !pathname.startsWith("/api")) {
    return NextResponse.redirect(
      new URL(`/auth/verify-otp?tempToken=${request.cookies.get("token")?.value || ""}`, request.url)
    );
  }
}

  // ✅ Check role permissions - Handle both manual JWT and NextAuth
  const userRole = (token.role as UserRole) || (token.isAdmin ? UserRole.ADMIN : UserRole.USER);

  console.log("👤 [ROLE CHECK]", {
    userRole,
    requiredRole: routeConfig.minRole,
    hasPermission: hasRequiredRole(userRole, routeConfig.minRole)
  });

  if (!hasRequiredRole(userRole, routeConfig.minRole)) {
    console.warn(
      `❌ [FORBIDDEN] User: ${token.email}, Role: ${userRole}, Required: ${routeConfig.minRole}, Path: ${pathname}`
    );
    return createErrorResponse(
      "Insufficient permissions to access this resource",
      403,
      isApiRoute,
      request
    );
  }

  // Check account status
  if (token.status === "suspended" || token.status === "banned") {
    console.warn(`❌ [ACCOUNT SUSPENDED] User: ${token.email}`);
    return createErrorResponse(
      "Your account has been suspended. Please contact support.",
      403,
      isApiRoute,
      request
    );
  }

  // Log admin actions
  if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
    console.log(
      `👑 [ADMIN ACCESS] User: ${token.email}, Role: ${userRole}, IP: ${clientIP}, Path: ${pathname}`
    );
  }

  console.log("✅ [ACCESS GRANTED] Proceeding to:", pathname);

  const response = NextResponse.next();
  
  if (isApiRoute) {
    response.headers.set("X-User-Id", String(token.id || ""));
    response.headers.set("X-User-Role", userRole);
    response.headers.set("X-User-Email", String(token.email || ""));
  }

  return addSecurityHeaders(response);
}

// -------------------------------
// ⚙️ MIDDLEWARE CONFIGURATION
// -------------------------------
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};