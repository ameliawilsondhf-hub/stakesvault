import BlockedIP from "@/lib/models/blockedIP";
import User, { IUser } from "@/lib/models/user";

/** IP extract (x-forwarded-for se) */
export function extractIPFromHeaders(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/** Check if IP is blocked */
export async function isIPBlocked(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  if (!ip || ip === "unknown") return { blocked: false };

  const record = await BlockedIP.findOne({ ip });

  if (!record) return { blocked: false };

  // temporary block with expiry
  if (record.expiresAt && record.expiresAt < new Date()) {
    await BlockedIP.deleteOne({ _id: record._id });
    return { blocked: false };
  }

  return {
    blocked: true,
    reason: record.reason || (record.permanent ? "Permanently blocked" : "Temporarily blocked"),
  };
}

/** Failed attempt handling */
export async function handleFailedLoginAttempt(
  ip: string,
  email?: string,
  maxAttempts: number = 5,
  windowMinutes: number = 5
) {
  if (!ip || ip === "unknown") return;

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  // User-side failedAttempts counter agar tum future me user.loginStats.failedAttempts se use karna chaho
  if (email) {
    const user = (await User.findOne({ email })) as IUser | null;
    if (user) {
      if (!user.loginStats) {
        user.loginStats = {
          totalLogins: 0,
          failedAttempts: 0,
          uniqueDevices: 0,
          uniqueLocations: 0,
          lastFailedLogin: now,
        };
      }
      user.loginStats.failedAttempts += 1;
      user.loginStats.lastFailedLogin = now;
      await user.save();
    }
  }

  // IP table
  let ipRecord = await BlockedIP.findOne({ ip });
  if (!ipRecord) {
    ipRecord = await BlockedIP.create({
      ip,
      attempts: 1,
      blockedAt: now,
      expiresAt: null,
      permanent: false,
      reason: "Login failed",
    });
    return;
  }

  // agar purani attempt 5 min se purani hai to counter reset
  if (ipRecord.blockedAt < windowStart) {
    ipRecord.attempts = 1;
    ipRecord.blockedAt = now;
    ipRecord.expiresAt = null;
    ipRecord.permanent = false;
    ipRecord.reason = "Login failed";
  } else {
    ipRecord.attempts += 1;
  }

  // agar threshold cross ho gaya → temp block 30 min ke liye
  if (ipRecord.attempts >= maxAttempts) {
    ipRecord.reason = `Too many failed attempts (${ipRecord.attempts})`;
    ipRecord.expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins block
  }

  await ipRecord.save();
}

/** Optional: permanently block IP (manual admin ke liye) */
export async function permanentlyBlockIP(ip: string, reason?: string) {
  if (!ip || ip === "unknown") return;
  await BlockedIP.findOneAndUpdate(
    { ip },
    {
      ip,
      reason: reason || "Manually blocked by admin",
      blockedAt: new Date(),
      expiresAt: null,
      permanent: true,
      attempts: 9999,
    },
    { upsert: true }
  );
}
