import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";
import { 
  getClientIP, 
  getLocationFromIP, 
  generateDeviceFingerprint,
  isSuspiciousLogin,
  createSecurityAlert
} from "@/lib/security";

// 🔥 UPDATED: Track login with optional client device info
async function trackUserLogin(
  user: any, 
  provider: string = 'credentials',
  clientDeviceInfo?: { browser?: string; os?: string; device?: string }
) {
  try {
    const currentIP = await getClientIP();
    const currentLocation = await getLocationFromIP(currentIP);
    
    // 🔥 Use client info if available, otherwise use generic
    const browser = clientDeviceInfo?.browser || `${provider} Browser`;
    const os = clientDeviceInfo?.os || `${provider} OS`;
    const device = clientDeviceInfo?.device || `${os} ${browser}`;
    
    const userAgent = device;
    const deviceFingerprint = generateDeviceFingerprint(currentIP, userAgent);

    const previousIP = user.ipAddress || "";
    const previousLocation = user.currentLocation || "";

    // Initialize arrays
    user.loginHistory = user.loginHistory || [];
    user.devices = user.devices || [];
    user.loginIPs = user.loginIPs || [];
    user.securityAlerts = user.securityAlerts || [];

    // Check suspicious activity
    const suspiciousCheck = isSuspiciousLogin({
      currentIP,
      previousIP,
      currentLocation,
      previousLocation,
      loginHistory: user.loginHistory,
      devices: user.devices
    });

    // Add login history
    (user.loginHistory as any).push({
      ip: currentIP,
      location: currentLocation,
      device: device,
      browser: browser,
      os: os,
      date: new Date(),
      timestamp: new Date(),
      suspicious: suspiciousCheck.suspicious
    });

    // Keep last 50 records
    if (user.loginHistory.length > 50) {
      user.loginHistory = user.loginHistory.slice(-50);
    }

    // Check if device exists
    const existingDevice = user.devices.find(d => d.deviceId === deviceFingerprint);

    if (existingDevice) {
      existingDevice.lastUsed = new Date();
      existingDevice.ipAddress = currentIP;
      existingDevice.location = currentLocation;
      existingDevice.browser = browser;
      existingDevice.os = os;
      existingDevice.name = device;
    } else {
      // New device
      (user.devices as any).push({
        name: device,
        deviceId: deviceFingerprint,
        browser: browser,
        os: os,
        lastUsed: new Date(),
        firstSeen: new Date(),
        trusted: provider !== 'credentials', // OAuth auto-trusted
        ipAddress: currentIP,
        location: currentLocation
      });

      // Alert for new device
      const alert = createSecurityAlert({
        type: 'new_device',
        ip: currentIP,
        location: currentLocation,
        device: device,
        severity: provider === 'credentials' ? 'medium' : 'low'
      });
      
      (user.securityAlerts as any).push(alert);
    }

    // Update IP tracking
    const existingIP = user.loginIPs.find(i => i.ip === currentIP);
    if (existingIP) {
      existingIP.count += 1;
      existingIP.lastLogin = new Date();
    } else {
      (user.loginIPs as any).push({
        ip: currentIP,
        lastLogin: new Date(),
        count: 1
      });

      // Alert for new IP
      if (previousIP) {
        const alert = createSecurityAlert({
          type: 'ip_change',
          ip: currentIP,
          location: currentLocation,
          device: device,
          severity: 'low'
        });
        (user.securityAlerts as any).push(alert);
      }
    }

    // Check location change
    if (previousLocation && currentLocation !== previousLocation) {
      const prevCountry = previousLocation.split(',')[1]?.trim();
      const currCountry = currentLocation.split(',')[1]?.trim();
      
      if (prevCountry !== currCountry) {
        const alert = createSecurityAlert({
          type: 'new_location',
          ip: currentIP,
          location: currentLocation,
          device: device,
          severity: 'medium'
        });
        (user.securityAlerts as any).push(alert);
      }
    }

    // Check multiple devices
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentLogins = user.loginHistory.filter(
      (login: any) => new Date(login.timestamp) > fiveMinutesAgo
    );
    
    if (recentLogins.length > 1) {
      const uniqueDevices = new Set(recentLogins.map((l: any) => l.device)).size;
      if (uniqueDevices > 1) {
        const alert = createSecurityAlert({
          type: 'multiple_devices',
          ip: currentIP,
          location: currentLocation,
          device: device,
          severity: 'high'
        });
        (user.securityAlerts as any).push(alert);
      }
    }

    // Update registration info (first time)
    if (!user.registrationIP) {
      user.registrationIP = currentIP;
      user.registrationLocation = currentLocation;
    }

    // Update current status
    user.previousIP = previousIP;
    user.previousLocation = previousLocation;
    user.ipAddress = currentIP;
    user.currentLocation = currentLocation;
    user.lastLogin = new Date();

    // Update login stats
    user.loginStats = user.loginStats || {
      totalLogins: 0,
      failedAttempts: 0,
      uniqueDevices: 0,
      uniqueLocations: 0
    };
    
    user.loginStats.totalLogins += 1;
    user.loginStats.uniqueDevices = user.devices.length;
    user.loginStats.uniqueLocations = new Set(user.loginHistory.map((l: any) => l.location)).size;

    // Add security log if suspicious
    if (suspiciousCheck.suspicious) {
      user.securityLogs = user.securityLogs || [];
      (user.securityLogs as any).push({
        type: suspiciousCheck.reasons.join(", "),
        ip: currentIP,
        device: device,
        location: currentLocation,
        risk: suspiciousCheck.severity === 'high' ? 3 : suspiciousCheck.severity === 'medium' ? 2 : 1,
        date: new Date()
      });
    }

    // Keep last 100 alerts
    if (user.securityAlerts.length > 100) {
      user.securityAlerts = user.securityAlerts.slice(-100);
    }

    await user.save();
    console.log(`✅ Security tracking updated for ${provider} login - Device: ${device}`);
    
  } catch (error) {
    console.error("⚠️ Security tracking error (non-blocking):", error);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();
        
        const user = await User.findOne({ email: credentials.email }).select("+password");
        
        if (!user || !user.password) {
          return null;
        }

        if (user.isBanned) {
          throw new Error(`banned::${user.banReason || "Account banned"}`);
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          return null;
        }

        await trackUserLogin(user, 'credentials');

        return {
          id: user._id?.toString() || String(user._id),
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin || false,
        };
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      try {
        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          const currentIP = await getClientIP();
          const currentLocation = await getLocationFromIP(currentIP);
          
          existingUser = await User.create({
            name: user.name,
            email: user.email,
            emailVerified: true,
            referralCode,
            walletBalance: 0,
            totalDeposits: 0,
            levelIncome: 0,
            referralEarnings: 0,
            referralCount: 0,
            level1: [],
            level2: [],
            level3: [],
            registrationIP: currentIP,
            registrationLocation: currentLocation,
            ipAddress: currentIP,
            currentLocation: currentLocation,
            loginHistory: [],
            devices: [],
            securityAlerts: [],
            loginStats: {
              totalLogins: 1,
              failedAttempts: 0,
              uniqueDevices: 1,
              uniqueLocations: 1
            }
          });

          console.log(`✅ New OAuth user created (${account?.provider}):`, user.email);
        } else {
          if (existingUser.isBanned) {
            console.log(`🚫 Banned user OAuth login attempt: ${user.email}`);
            throw new Error(`banned::${existingUser.banReason || "Account banned"}`);
          }

          if (account?.provider) {
            await trackUserLogin(existingUser, account.provider);
          }

          if (!existingUser.emailVerified) {
            existingUser.emailVerified = true;
            await existingUser.save();
            console.log("✅ Email auto-verified for OAuth user");
          }
        }

        return true;
      } catch (error: any) {
        console.error("❌ Sign in error:", error);
        
        if (error.message?.includes("banned::")) {
          throw error;
        }
        
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id?.toString() || String(dbUser._id);
          token.sub = dbUser._id?.toString() || String(dbUser._id);
          token.email = dbUser.email;
          token.role = dbUser.isAdmin ? "admin" : "user";
          token.isAdmin = dbUser.isAdmin || false;
          token.provider = account?.provider || 'credentials';
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
        (session.user as any).role = token.role as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
        (session.user as any).provider = token.provider as string;
      }
      return session;
    },

    // 🔥 FIXED REDIRECT CALLBACK
    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect:", { url, baseUrl });
      
      // ✅ Handle relative URLs (like "/dashboard")
      if (url.startsWith("/")) {
        console.log("✅ Relative URL detected, redirecting to:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      
      // ✅ Check if URL is from same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        if (urlObj.origin === baseUrlObj.origin) {
          console.log("✅ Same origin, allowing:", url);
          return url;
        }
      } catch (e) {
        console.log("⚠️ Invalid URL, using default");
      }
      
      // ✅ Default: redirect to dashboard
      console.log("✅ Default redirect to dashboard");
      return `${baseUrl}/dashboard`;
    }
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };