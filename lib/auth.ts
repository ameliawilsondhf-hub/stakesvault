import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Authentication Method Types
 */
export enum AuthMethod {
  NEXT_AUTH = "next-auth",
  JWT_TOKEN = "jwt-token",
  NONE = "none"
}

/**
 * Authentication Result Interface
 */
export interface AuthResult {
  userId: string | null;
  method: AuthMethod;
  authenticated: boolean;
}

/**
 * JWT Payload Interface
 */
interface CustomJwtPayload extends JwtPayload {
  id: string;
  email?: string;
}

/**
 * Get authenticated user ID from either NextAuth session or JWT cookie
 * 
 * This function supports hybrid authentication:
 * - NextAuth (OAuth providers: Google, Facebook)
 * - Custom JWT tokens (Credentials provider)
 * 
 * @returns {Promise<string | null>} User ID if authenticated, null otherwise
 * 
 * @example
 * ```typescript
 * const userId = await getAuthUserId();
 * if (!userId) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    // Priority 1: Check NextAuth session (OAuth users)
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      const userId = (session.user as any).id;
      
      if (userId) {
        console.log(`[AUTH] ✅ NextAuth session authenticated - User ID: ${userId}`);
        return userId;
      }
    }

    // Priority 2: Check JWT token cookie (Credentials users)
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      console.log("[AUTH] ⚠️ No authentication token found");
      return null;
    }

    if (!process.env.JWT_SECRET) {
      console.error("[AUTH] ❌ JWT_SECRET environment variable not configured");
      throw new Error("Server configuration error: JWT_SECRET missing");
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as CustomJwtPayload;
    
    if (decoded?.id) {
      console.log(`[AUTH] ✅ JWT token authenticated - User ID: ${decoded.id}`);
      return decoded.id;
    }

    console.log("[AUTH] ⚠️ Invalid JWT payload structure");
    return null;

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("[AUTH] ❌ JWT verification failed:", error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error("[AUTH] ❌ JWT token expired:", error.message);
    } else {
      console.error("[AUTH] ❌ Authentication error:", error);
    }
    
    return null;
  }
}

/**
 * Get detailed authentication information
 * 
 * @returns {Promise<AuthResult>} Detailed authentication result
 * 
 * @example
 * ```typescript
 * const auth = await getAuthDetails();
 * console.log(`Authenticated via: ${auth.method}`);
 * ```
 */
export async function getAuthDetails(): Promise<AuthResult> {
  try {
    // Check NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as any).id;
      if (userId) {
        return {
          userId,
          method: AuthMethod.NEXT_AUTH,
          authenticated: true
        };
      }
    }

    // Check JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as CustomJwtPayload;
      if (decoded?.id) {
        return {
          userId: decoded.id,
          method: AuthMethod.JWT_TOKEN,
          authenticated: true
        };
      }
    }

    return {
      userId: null,
      method: AuthMethod.NONE,
      authenticated: false
    };

  } catch (error) {
    console.error("[AUTH] Error getting auth details:", error);
    return {
      userId: null,
      method: AuthMethod.NONE,
      authenticated: false
    };
  }
}

/**
 * Middleware-style authentication check
 * Throws error if not authenticated
 * 
 * @throws {Error} If user is not authenticated
 * @returns {Promise<string>} User ID
 * 
 * @example
 * ```typescript
 * try {
 *   const userId = await requireAuth();
 *   // Proceed with authenticated logic
 * } catch (error) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthUserId();
  
  if (!userId) {
    throw new Error("Authentication required");
  }
  
  return userId;
}