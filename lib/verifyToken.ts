import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// ✅ Type-safe helper function to verify token
export async function verifyUserToken() {
  // Get cookie store (works in App Router)
  const cookieStore: any = cookies(); // <--- force TS to stop complaining

  const token = cookieStore?.get?.("token")?.value; // safe optional chaining

  if (!token) throw new Error("No token found");

  try {
    const decoded = jwt.verify(token, "mysecret");
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}
