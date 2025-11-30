import { headers } from 'next/headers';

// 🔍 Get Client IP Address (Enhanced for Vercel)
export async function getClientIP(): Promise<string> {
  try {
    const headersList = await headers();
    
    // Priority order for IP detection (Vercel-optimized)
    const possibleHeaders = [
      'x-real-ip',
      'x-forwarded-for',
      'x-vercel-forwarded-for',      // ✅ Vercel specific
      'x-vercel-proxied-for',         // ✅ Vercel specific
      'cf-connecting-ip',             // Cloudflare
      'true-client-ip',
      'x-client-ip',
    ];

    for (const header of possibleHeaders) {
      const value = headersList.get(header);
      if (value) {
        // x-forwarded-for can be comma-separated
        const ip = value.split(',')[0].trim();
        
        // Skip localhost/private IPs
        if (ip && 
            ip !== '::1' && 
            ip !== '127.0.0.1' && 
            !ip.startsWith('192.168.') && 
            !ip.startsWith('10.')) {
          console.log(`✅ IP detected from ${header}:`, ip);
          return ip;
        }
      }
    }
    
    return '0.0.0.0'; // Fallback
  } catch (error) {
    console.error('Error getting IP:', error);
    return '0.0.0.0';
  }
}

// 🌍 Get Location from IP (Free API - ipapi.co)
export async function getLocationFromIP(ip: string): Promise<string> {
  try {
    // Skip for localhost/private IPs
    if (ip === '0.0.0.0' || 
        ip === '127.0.0.1' || 
        ip === '::1' ||
        ip.startsWith('192.168.') || 
        ip.startsWith('10.')) {
      return 'Local Network';
    }

    // Using ipapi.co (free tier: 1000 requests/day, no API key)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'StakeVault-App/1.0'
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      console.warn(`IP API returned ${response.status} for ${ip}`);
      return 'Unknown Location';
    }

    const data = await response.json();
    
    if (data.error) {
      console.warn('IP API error:', data.reason);
      return 'Unknown Location';
    }
    
    // Format: "City, Country"
    const city = data.city || 'Unknown City';
    const country = data.country_name || 'Unknown Country';
    
    console.log(`✅ Location for ${ip}: ${city}, ${country}`);
    return `${city}, ${country}`;
    
  } catch (error: any) {
    console.error('Error getting location:', error.message);
    return 'Unknown Location';
  }
}

// 📱 Get Device Info from User Agent
export async function getDeviceInfo(userAgent?: string): Promise<{
  device: string;
  browser: string;
  os: string;
}> {
  try {
    const headersList = await headers();
    const ua = userAgent || headersList.get('user-agent') || '';

    // Detect Browser
    let browser = 'Unknown Browser';
    if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    // Detect OS
    let os = 'Unknown OS';
    if (ua.includes('Windows NT 10.0')) os = 'Windows 10';
    else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const device = `${os} ${browser}`;

    return { device, browser, os };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      device: 'Unknown Device',
      browser: 'Unknown Browser',
      os: 'Unknown OS'
    };
  }
}

// 🔐 Generate Device Fingerprint
export function generateDeviceFingerprint(ip: string, userAgent: string): string {
  const str = `${ip}-${userAgent}`;
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `device_${Math.abs(hash).toString(36)}`;
}

// ⚠️ Detect Suspicious Activity
export function isSuspiciousLogin(params: {
  currentIP: string;
  previousIP: string;
  currentLocation: string;
  previousLocation: string;
  loginHistory: any[];
  devices: any[];
}): {
  suspicious: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
} {
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Check 1: IP changed
  if (params.previousIP && params.currentIP !== params.previousIP) {
    reasons.push('IP address changed');
    severity = 'low';
  }

  // Check 2: Location changed
  if (params.previousLocation && params.currentLocation !== params.previousLocation) {
    const prevCountry = params.previousLocation.split(',')[1]?.trim();
    const currCountry = params.currentLocation.split(',')[1]?.trim();
    
    if (prevCountry !== currCountry) {
      reasons.push('Country changed');
      severity = 'medium';
    }
  }

  // Check 3: Multiple devices
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentLogins = params.loginHistory.filter(
    login => new Date(login.timestamp) > fiveMinutesAgo
  );
  
  if (recentLogins.length > 1) {
    const uniqueDevices = new Set(recentLogins.map(l => l.device)).size;
    if (uniqueDevices > 1) {
      reasons.push('Multiple devices detected');
      severity = 'high';
    }
  }

  // Check 4: Too many logins
  const lastHour = new Date(Date.now() - 60 * 60 * 1000);
  const loginsLastHour = params.loginHistory.filter(
    login => new Date(login.timestamp) > lastHour
  ).length;
  
  if (loginsLastHour > 5) {
    reasons.push('Unusual login frequency');
    severity = 'high';
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
    severity
  };
}

// 📊 Get Login Statistics
export function calculateLoginStats(loginHistory: any[], devices: any[]) {
  const uniqueIPs = new Set(loginHistory.map(l => l.ip));
  const uniqueLocations = new Set(loginHistory.map(l => l.location));
  
  return {
    totalLogins: loginHistory.length,
    uniqueDevices: devices.length,
    uniqueLocations: uniqueLocations.size,
    uniqueIPs: uniqueIPs.size,
    lastLogin: loginHistory[0]?.timestamp || null
  };
}

// 🔔 Create Security Alert
export function createSecurityAlert(params: {
  type: 'new_device' | 'new_location' | 'multiple_devices' | 'ip_change';
  ip: string;
  location: string;
  device: string;
  severity?: 'low' | 'medium' | 'high';
}) {
  const messages = {
    new_device: `New device detected: ${params.device}`,
    new_location: `Login from new location: ${params.location}`,
    multiple_devices: `Multiple devices active simultaneously`,
    ip_change: `IP address changed to: ${params.ip}`
  };

  return {
    type: params.type,
    message: messages[params.type],
    severity: params.severity || 'low',
    ip: params.ip,
    location: params.location,
    device: params.device,
    timestamp: new Date(),
    acknowledged: false
  };
}