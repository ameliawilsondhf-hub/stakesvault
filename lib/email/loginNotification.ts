// ===================================================================
// 📧 EMAIL UTILITY - lib/email/loginNotification.ts
// ===================================================================

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

interface LoginEmailData {
  email: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
  loginMethod: 'manual' | 'google';
}



// Get device info from user agent
function parseUserAgent(userAgent: string) {
  let device = 'Desktop';
  let browser = 'Unknown Browser';

  // Detect device
  if (/mobile/i.test(userAgent)) {
    device = 'Mobile Device';
  } else if (/tablet/i.test(userAgent)) {
    device = 'Tablet';
  }

  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  return { device, browser };
}

// Format date nicely
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date);
}

// HTML Email Template (Binance style)
function getEmailTemplate(data: LoginEmailData): string {
  const { device, browser } = parseUserAgent(data.userAgent);
  const formattedDate = formatDate(data.timestamp);
  const loginMethodText = data.loginMethod === 'google' ? 'Google Sign-In' : 'Email & Password';

return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StakeVault Security Alert</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    .container {
      max-width: 620px;
      margin: 40px auto;
      background: #0b0f1a;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 0 40px rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .header {
      background: linear-gradient(135deg, #ff8a00, #ff2f92);
      padding: 28px;
      text-align: center;
      color: white;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 32px 26px;
      color: #e5e7eb;
    }
    .alert-box {
      background: rgba(255,138,0,0.15);
      border-left: 4px solid #ff8a00;
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 22px;
      font-weight: 600;
      color: #ffd28a;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .text {
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.6;
    }
    .info-box {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 18px;
      margin-top: 22px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #94a3b8;
    }
    .value {
      color: #e5e7eb;
      font-weight: 600;
    }
    .cta-box {
      margin-top: 34px;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 14px 34px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff8a00, #ff2f92);
      color: white !important;
      font-weight: 800;
      font-size: 15px;
      text-decoration: none;
      box-shadow: 0 0 20px rgba(255,138,0,0.6);
    }
    .footer {
      text-align: center;
      padding: 22px;
      font-size: 12px;
      color: #94a3b8;
      background: #060914;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 12px;
      }
      .header {
        font-size: 22px;
      }
      .btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">🔐 StakeVault Security Alert</div>

    <div class="content">

      <div class="alert-box">
        ⚠️ New Login Detected on Your Account
      </div>

      <div class="title">Hello ${data.userName},</div>
      <div class="text">
        We detected a new sign-in to your StakeVault account.  
        If this was you, no action is required.  
        If you don’t recognize this login, secure your account immediately.
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">📅 Date & Time</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="label">🔑 Login Method</span>
          <span class="value">${loginMethodText}</span>
        </div>
        <div class="info-row">
          <span class="label">🌐 IP Address</span>
          <span class="value">${data.ipAddress}</span>
        </div>
        <div class="info-row">
          <span class="label">💻 Device</span>
          <span class="value">${device}</span>
        </div>
        <div class="info-row">
          <span class="label">🌍 Browser</span>
          <span class="value">${browser}</span>
        </div>
        ${data.location ? `
        <div class="info-row">
          <span class="label">📍 Location</span>
          <span class="value">${data.location}</span>
        </div>
        ` : ``}
      </div>

      <div class="cta-box">
        <a href="https://stakesvault.com/auth/forgot-password" class="btn">
          🔐 Secure My Account
        </a>
      </div>

    </div>

    <div class="footer">
      This is an automated security alert from StakeVault.<br/>
      If this wasn't you, please reset your password immediately.
      <br/><br/>
      © ${new Date().getFullYear()} StakeVault. All rights reserved.
    </div>

  </div>
</body>
</html>
`;
}


// Send login notification email
export async function sendLoginNotification(data: LoginEmailData): Promise<boolean> {
  try {
    console.log("📧 Sending login notification via Resend to:", data.email);

    const html = getEmailTemplate(data);

    const { data: result, error } = await resend.emails.send({
      from: "StakeVault Security <support@stakesvault.com>", // ✅ OFFICIAL DOMAIN
      to: [data.email],
      subject: `🔐 New Login to Your StakeVault Account - ${formatDate(data.timestamp)}`,
      html,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return false;
    }

    console.log("✅ Login notification sent via Resend:", result?.id);
    return true;

  } catch (error) {
    console.error("❌ Failed to send login notification via Resend:", error);
    return false;
  }
}

// Helper to get client IP from request
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  if (cfIP) return cfIP;
  
  return '::1';
}

// ===================================================================
// 🌍 OPTIONAL: Get Location from IP (using free API)
// ===================================================================

export async function getLocationFromIP(ip: string): Promise<string> {
  try {
    // Skip localhost IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'unknown') {
      return 'Local Network';
    }

    // Using free ipapi.co service (no API key needed, 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'StakeVault/1.0'
      }
    });
    
    const data = await response.json();
    
    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    }
    return 'Unknown Location';
  } catch (error) {
    console.error('Error getting location:', error);
    return 'Unknown Location';
  }
}

// ===================================================================
// 📝 USAGE EXAMPLE WITH LOCATION:
// ===================================================================
/*
const ipAddress = getClientIP(req);
const userAgent = req.headers.get('user-agent') || 'Unknown';
const location = await getLocationFromIP(ipAddress);

await sendLoginNotification({
  email: user.email,
  userName: user.name,
  ipAddress,
  userAgent,
  location, // Optional: Add location info
  timestamp: new Date(),
  loginMethod: 'manual',
});
*/
