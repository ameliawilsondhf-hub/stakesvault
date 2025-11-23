import { headers } from 'next/headers';

// 🔍 Get Client IP Address
export async function getClientIP(): Promise<string> {
  try {
    const headersList = await headers();
    
    // Try multiple headers in order of preference
    const forwarded = headersList.get('x-forwarded-for');
    const real = headersList.get('x-real-ip');
    const cfConnecting = headersList.get('cf-connecting-ip'); // Cloudflare
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, get the first one
      return forwarded.split(',')[0].trim();
    }
    
    if (real) {
      return real;
    }
    
    if (cfConnecting) {
      return cfConnecting;
    }
    
    return '0.0.0.0'; // Fallback
  } catch (error) {
    console.error('Error getting IP:', error);
    return '0.0.0.0';
  }
}

// 🌍 Get Location from IP
export async function getLocationFromIP(ip: string): Promise<string> {
  try {
    // Skip for localhost/private IPs
    if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'Local Network';
    }

    // Using ip-api.com (Free, 45 requests per minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      return `${data.city}, ${data.country}`;
    }
    
    return 'Unknown Location';
  } catch (error) {
    console.error('Error getting location:', error);
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
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
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

    // Device name
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
  // Simple hash function for device fingerprint
  const str = `${ip}-${userAgent}`;
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
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

  // Check 2: Location changed significantly
  if (params.previousLocation && params.currentLocation !== params.previousLocation) {
    // Extract countries
    const prevCountry = params.previousLocation.split(',')[1]?.trim();
    const currCountry = params.currentLocation.split(',')[1]?.trim();
    
    if (prevCountry !== currCountry) {
      reasons.push('Country changed');
      severity = 'medium';
    }
  }

  // Check 3: Multiple devices in short time (last 5 minutes)
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

  // Check 4: New device (not in trusted devices)
  const { device, browser, os } = params.devices[0] || {};
  const isKnownDevice = params.devices.some(d => 
    d.browser === browser && d.os === os && d.trusted
  );
  
  if (!isKnownDevice && params.devices.length > 0) {
    reasons.push('New device detected');
    if (severity === 'low') severity = 'medium';
  }

  // Check 5: Too many logins (potential brute force)
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