import BlockedIP from "@/lib/models/blockedIP";

/** Extract client IP from request headers */
export function extractIPFromHeaders(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/** Check if IP is blocked */
export async function isIPBlocked(ip: string) {
  const record = await BlockedIP.findOne({ ip });

  if (!record) return { blocked: false };

  // Auto-unblock when expired
  if (record.expiresAt && record.expiresAt < new Date()) {
    await BlockedIP.deleteOne({ ip });
    return { blocked: false };
  }

  return {
    blocked: true,
    reason: record.reason || "Too many failed login attempts",
    expiresAt: record.expiresAt || null
  };
}

/** Increase failed attempt */
export async function increaseFailedAttempt(ip: string) {
  const MAX_ATTEMPTS = 5;

  let record = await BlockedIP.findOne({ ip });

  if (!record) {
    record = await BlockedIP.create({
      ip,
      attempts: 1,
      blockedAt: new Date(),
      expiresAt: null,
      reason: "",
      permanent: false
    });
  } else {
    record.attempts += 1;
    record.blockedAt = new Date();
  }

  // Block after 5 failed attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    record.reason = "Too many failed login attempts";
    record.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  await record.save();

  return {
    attempts: record.attempts,
    remaining: Math.max(0, MAX_ATTEMPTS - record.attempts),
    blocked: record.attempts >= MAX_ATTEMPTS,
    expiresAt: record.expiresAt
  };
}

/** Clear attempts after successful login */
export async function clearFailedAttempts(ip: string) {
  await BlockedIP.deleteOne({ ip });
}
