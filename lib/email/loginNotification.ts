// ===================================================================
// 📧 EMAIL UTILITY - lib/email/loginNotification.ts
// ===================================================================

import nodemailer from 'nodemailer';

interface LoginEmailData {
  email: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
  loginMethod: 'manual' | 'google';
}

// ✅ Email transporter setup using YOUR Gmail credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER, // ameliawilsondhf@gmail.com
    pass: process.env.EMAIL_PASSWORD, // Your app password
  },
});

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
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-bottom: 25px;
      border-radius: 4px;
    }
    .alert-title {
      color: #856404;
      font-weight: bold;
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    .alert-text {
      color: #856404;
      margin: 0;
      font-size: 14px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #6c757d;
      font-size: 14px;
      min-width: 140px;
      font-weight: 500;
    }
    .info-value {
      color: #212529;
      font-size: 14px;
      font-weight: 600;
      word-break: break-all;
    }
    .security-notice {
      background-color: #e7f3ff;
      border-left: 4px solid #2196F3;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .security-title {
      color: #1976D2;
      font-weight: bold;
      margin: 0 0 8px 0;
      font-size: 15px;
    }
    .security-text {
      color: #1976D2;
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 12px;
      line-height: 1.6;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 20px 15px;
      }
      .info-row {
        flex-direction: column;
      }
      .info-label {
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="logo">🔐 StakeVault Security Alert</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="alert-box">
        <p class="alert-title">⚠️ New Login Detected</p>
        <p class="alert-text">We detected a new sign-in to your StakeVault account.</p>
      </div>

      <p class="greeting">Hello <strong>${data.userName}</strong>,</p>
      
      <p style="color: #666; line-height: 1.6; font-size: 15px;">
        Your account was just accessed. If this was you, you can safely ignore this email. 
        If you don't recognize this activity, please secure your account immediately.
      </p>

      <!-- Login Details -->
      <div class="info-box">
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Login Details</h3>
        
        <div class="info-row">
          <span class="info-label">📅 Date & Time:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">🔑 Login Method:</span>
          <span class="info-value">${loginMethodText}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">🌐 IP Address:</span>
          <span class="info-value">${data.ipAddress}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">💻 Device:</span>
          <span class="info-value">${device}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">🌍 Browser:</span>
          <span class="info-value">${browser}</span>
        </div>
        
        ${data.location ? `
        <div class="info-row">
          <span class="info-label">📍 Location:</span>
          <span class="info-value">${data.location}</span>
        </div>
        ` : ''}
      </div>

      <!-- Security Notice -->
      <div class="security-notice">
        <p class="security-title">🛡️ Wasn't You?</p>
        <p class="security-text">
          If you didn't sign in, someone else might have access to your account. 
          Please change your password immediately and enable two-factor authentication.
        </p>
      </div>

      <center>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/settings/security" class="button">
          Secure My Account
        </a>
      </center>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        <strong>This is an automated security notification</strong>
      </p>
      <p style="margin: 0 0 10px 0;">
        You're receiving this because login notifications are enabled for your account.
      </p>
      <p style="margin: 0;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/settings">Manage Settings</a> • 
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/support">Contact Support</a>
      </p>
      <p style="margin: 15px 0 0 0; color: #adb5bd;">
        © ${new Date().getFullYear()} StakeVault. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send login notification email
export async function sendLoginNotification(data: LoginEmailData): Promise<boolean> {
  try {
    console.log('📧 Sending login notification to:', data.email);

    const mailOptions = {
      from: `"StakeVault Security" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: `🔐 New Login to Your StakeVault Account - ${formatDate(data.timestamp)}`,
      html: getEmailTemplate(data),
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Login notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send login notification:', error);
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