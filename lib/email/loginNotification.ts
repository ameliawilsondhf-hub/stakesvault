// File: lib/email/loginNotification.ts

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface LoginNotificationParams {
  email: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  timestamp: Date;
  loginMethod: 'manual' | 'google' | 'facebook';
}
// ✅ ADD THIS FUNCTION AFTER LINE 15
function shouldSkipEmail(email: string): boolean {
  // Skip custom domains that might have delivery issues
  const problematicDomains = ['stakevault.com'];
  const domain = email.split('@')[1];
  
  if (problematicDomains.includes(domain)) {
    console.log(`⚠️ Skipping email to custom domain: ${email}`);
    return true;
  }
  
  return false;
}

export async function sendLoginNotification({
  email,
  userName,
  ipAddress,
  userAgent,
  location,
  timestamp,
  loginMethod,
}: LoginNotificationParams) {
  try {
    // ✅ NEW: Skip problematic domains
    if (shouldSkipEmail(email)) {
      console.log(`⏭️ Email skipped for: ${email}`);
      return { success: true, skipped: true };
    }

    console.log(`📧 Sending login notification to ${email}`);

    // Format login method
    const methodText = loginMethod === 'manual' 
      ? 'Email & Password' 
      : loginMethod === 'google' 
      ? 'Google Account' 
      : 'Facebook Account';

    // Format timestamp
    const formattedTime = timestamp.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Parse browser and OS from user agent
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    
    if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    const { data, error } = await resend.emails.send({
      from: 'StakeVault Security <onboarding@resend.dev>',
      to: [email],
      subject: `🔐 New Login Alert - ${new Date().toLocaleDateString()}`,
      
      // ✅ NEW: Add plain text version for better deliverability
      text: `
StakeVault Security Alert - New Login Detected

Account Information:
- Name: ${userName}
- Email: ${email}

Login Details:
- Time: ${formattedTime}
- Method: ${methodText}
- Location: ${location}
- IP Address: ${ipAddress}
- Browser: ${browser}
- System: ${os}

Was This You?
If this login was authorized by you, no action is needed.

If you don't recognize this activity, please secure your account immediately.

---
StakeVault Security Team
© ${new Date().getFullYear()} StakeVault. All rights reserved.
      `.trim(),
      
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #F0B90B 0%, #F8D12F 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header-icon {
      width: 70px;
      height: 70px;
      background: white;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 35px;
      margin-bottom: 15px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .header h1 {
      margin: 0;
      color: #000;
      font-size: 24px;
      font-weight: 700;
    }
    .header p {
      margin: 8px 0 0 0;
      color: rgba(0,0,0,0.7);
      font-size: 13px;
    }
    .alert-banner {
      background: #FFF3CD;
      border-bottom: 3px solid #FFC107;
      padding: 20px;
    }
    .alert-content {
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    .alert-icon {
      font-size: 40px;
      flex-shrink: 0;
    }
    .alert-text h2 {
      margin: 0 0 8px 0;
      color: #856404;
      font-size: 18px;
    }
    .alert-text p {
      margin: 0;
      color: #856404;
      font-size: 13px;
      line-height: 1.5;
    }
    .content {
      padding: 30px 20px;
    }
    .section-title {
      color: #333;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 15px 0;
      border-bottom: 2px solid #F0B90B;
      padding-bottom: 8px;
    }
    .info-table {
      width: 100%;
      background: #F8F9FA;
      border-radius: 8px;
      overflow: hidden;
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      padding: 12px 15px;
      border-bottom: 1px solid #E2E8F0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #666;
      font-size: 13px;
      font-weight: 500;
      flex: 0 0 120px;
    }
    .info-value {
      color: #333;
      font-size: 13px;
      font-weight: 600;
      flex: 1;
      text-align: right;
    }
    .security-notice {
      background: #E3F2FD;
      border-left: 4px solid #2196F3;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .security-notice-title {
      color: #1565C0;
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 10px 0;
    }
    .security-notice p {
      color: #0D47A1;
      font-size: 13px;
      line-height: 1.6;
      margin: 0 0 12px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #F0B90B 0%, #F8D12F 100%);
      color: #000 !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 25px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(240, 185, 11, 0.4);
      margin: 20px 0;
    }
    .footer {
      background: #2C3E50;
      padding: 25px 20px;
      text-align: center;
      color: #ECF0F1;
    }
    .footer-title {
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 600;
    }
    .footer-text {
      margin: 8px 0;
      font-size: 12px;
      opacity: 0.8;
      line-height: 1.5;
    }
    .footer-divider {
      margin: 15px 0;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .footer-copyright {
      margin: 12px 0 0 0;
      font-size: 11px;
      opacity: 0.5;
    }
    @media only screen and (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content { padding: 20px 15px; }
      .info-label { flex: 0 0 100px; font-size: 12px; }
      .info-value { font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Header -->
    <div class="header">
      <div class="header-icon">🔐</div>
      <h1>StakeVault</h1>
      <p>Security Alert</p>
    </div>

    <!-- Alert Banner -->
    <div class="alert-banner">
      <div class="alert-content">
        <div class="alert-icon">🛡️</div>
        <div class="alert-text">
          <h2>New Login Detected</h2>
          <p>A new login to your account was detected. Please review the details below.</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      
      <!-- User Info -->
      <h3 class="section-title">Account Information</h3>
      <div class="info-table">
        <div class="info-row">
          <div class="info-label">👤 Account</div>
          <div class="info-value">${userName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">📧 Email</div>
          <div class="info-value">${email}</div>
        </div>
      </div>

      <!-- Login Details -->
      <h3 class="section-title">Login Details</h3>
      <div class="info-table">
        <div class="info-row">
          <div class="info-label">🕐 Time</div>
          <div class="info-value">${formattedTime}</div>
        </div>
        <div class="info-row">
          <div class="info-label">🔑 Method</div>
          <div class="info-value"><span style="background: #28a745; color: white; padding: 4px 10px; border-radius: 10px; font-size: 11px;">${methodText}</span></div>
        </div>
        <div class="info-row">
          <div class="info-label">🌍 Location</div>
          <div class="info-value">${location}</div>
        </div>
        <div class="info-row">
          <div class="info-label">📍 IP Address</div>
          <div class="info-value" style="font-family: monospace; font-size: 12px;">${ipAddress}</div>
        </div>
        <div class="info-row">
          <div class="info-label">💻 Browser</div>
          <div class="info-value">${browser}</div>
        </div>
        <div class="info-row">
          <div class="info-label">⚙️ System</div>
          <div class="info-value">${os}</div>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="security-notice">
        <h3 class="security-notice-title">Was This You?</h3>
        <p>If this login was authorized by you, no action is needed. Your account remains secure.</p>
        <p><strong>If you don't recognize this activity:</strong> Please secure your account immediately by changing your password and enabling two-factor authentication.</p>
      </div>

      <!-- Action Button -->
      <div style="text-align: center;">
<a href="${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://stakesvault.com'}/dashboard/security" class="button">

        </a>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-title">StakeVault Security Team</p>
      <p class="footer-text">
        Protecting your investments with advanced security monitoring
      </p>
      <div class="footer-divider"></div>
      <p class="footer-text">
        This is an automated security notification. Please do not reply to this email.<br>
        For support, contact us at support@stakesvault.com
      </p>
      <p class="footer-copyright">
        © ${new Date().getFullYear()} StakeVault. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
      `,
    });

   if (error) {
      console.error(`❌ Email error for ${email}:`, error);
      // ✅ NEW: Don't throw error - just return failure
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent successfully to ${email}`);
    console.log("📨 Email ID:", data?.id);
    
    return { success: true, messageId: data?.id };

  } catch (error: any) {
    console.error(`❌ Failed to send to ${email}:`, error.message);
    // ✅ NEW: Don't throw - return error gracefully
    return { success: false, error: error.message };
  }
}