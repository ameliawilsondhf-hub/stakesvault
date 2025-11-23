import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/admin/login"];
  const adminRoutes = ["/admin"];
  const protectedRoutes = [
    "/dashboard",
    "/wallet",
    "/stake",
    "/deposit",
    "/withdraw",
    "/profile",
    "/referrals",
  ];

  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r));
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));
  const isProtectedRoute = protectedRoutes.some((r) =>
    pathname.startsWith(r)
  );

  // Allow admin login page
  if (pathname === "/admin/login") return NextResponse.next();

  // Allow public pages
  if (isPublicRoute) return NextResponse.next();

  // ---- READ ALL TOKENS ----
  const cookieToken =
    request.cookies.get("token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    null;

  // If no auth token → redirect
  if (!cookieToken) {
    return NextResponse.redirect(
      new URL(isAdminRoute ? "/admin/login" : "/auth/login", request.url)
    );
  }

  // ---- Decode JWT (normal login users) ----
  let decoded: JwtPayload | null = null;
  try {
    decoded = jwt.verify(cookieToken, process.env.JWT_SECRET!) as JwtPayload;
  } catch {}

  // ---- Get Google OAuth / NextAuth session ----
  const session: any = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ---- Extract correct email (JWT or OAuth) ----
  const userEmail =
    decoded?.email || session?.email || session?.user?.email || null;

  const userId = decoded?.id || session?.id || null;

  // ---- BAN CHECK ----
  if (userEmail) {
    try {
      const banRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/check-ban`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            userId,
          }),
        }
      );

      const banData = await banRes.json();

      if (banData.isBanned) {
        // ⭐ FIXED: Proper URL construction
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("error", "banned");
        loginUrl.searchParams.set("reason", banData.banReason || "Account banned");

        const redirect = NextResponse.redirect(loginUrl);

        // Delete ALL sessions
        redirect.cookies.delete("token");
        redirect.cookies.delete("next-auth.session-token");
        redirect.cookies.delete("__Secure-next-auth.session-token");

        return redirect;
      }
    } catch (err) {
      console.log("⚠️ BAN CHECK ERROR:", err);
    }
  }

  // ---- ADMIN PROTECTION ----
  if (isAdminRoute) {
    if (decoded?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // User protected pages
  if (isProtectedRoute) return NextResponse.next();

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)"],
};