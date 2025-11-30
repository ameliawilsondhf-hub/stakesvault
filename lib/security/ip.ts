import BlockedIP from "@/lib/models/blockedIP";

/** Extract client IP from request headers (Vercel-optimized) */
export function extractIPFromHeaders(headers: Headers): string {
  // Priority order for IP detection
  const possibleHeaders = [
    'x-real-ip',
    'x-forwarded-for',
    'x-vercel-forwarded-for',      // ✅ Vercel specific
    'x-vercel-proxied-for',         // ✅ Vercel specific
    'cf-connecting-ip',             // Cloudflare
    'true-client-ip',
  ];

  for (const header of possibleHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can be comma-separated
      const ip = value.split(',')[0].trim();
      
      // Skip localhost/private IPs
      if (ip && 
          ip !== '::1' && 
          ip !== '127.0.0.1' && 
          !ip.startsWith('192.168.') && 
          !ip.startsWith('10.')) {
        return ip;
      }
    }
  }

  return "unknown";
}

/** Check if IP is blocked */
export async function isIPBlocked(ip: string) {
  // Skip check for unknown/local IPs
  if (ip === "unknown" || ip === "0.0.0.0") {
    return { blocked: false };
  }

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
    expiresAt: record.expiresAt || null,
    attempts: record.attempts || 0
  };
}

/** Increase failed attempt */
export async function increaseFailedAttempt(ip: string) {
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes

  // Skip for unknown IPs
  if (ip === "unknown" || ip === "0.0.0.0") {
    return {
      attempts: 0,
      remaining: MAX_ATTEMPTS,
      blocked: false,
      expiresAt: null
    };
  }

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

  // Block after MAX_ATTEMPTS
  if (record.attempts >= MAX_ATTEMPTS) {
    record.reason = `Too many failed login attempts (${record.attempts} attempts)`;
    record.expiresAt = new Date(Date.now() + BLOCK_DURATION);
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
  if (ip && ip !== "unknown" && ip !== "0.0.0.0") {
    await BlockedIP.deleteOne({ ip });
  }
}