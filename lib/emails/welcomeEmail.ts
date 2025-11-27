import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailProps {
  name: string;
  email: string;
  referralCode?: string;
}

export function generateWelcomeEmail({ name, email, referralCode }: WelcomeEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to StakeVault</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f7fa;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .header-subtitle {
      color: #e0e7ff;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .welcome-title {
      font-size: 28px;
      font-weight: bold;
      color: #1a202c;
      margin-bottom: 20px;
    }
    .welcome-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .feature-box {
      background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .feature-item:last-child {
      margin-bottom: 0;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 15px;
      min-width: 30px;
    }
    .feature-content h3 {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 5px;
    }
    .feature-content p {
      font-size: 14px;
      color: #718096;
      margin: 0;
    }
    .cta-section {
      text-align: center;
      margin: 35px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transition: transform 0.2s;
    }
    .referral-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .referral-box h3 {
      font-size: 18px;
      color: #92400e;
      margin-bottom: 10px;
    }
    .referral-code {
      font-size: 24px;
      font-weight: bold;
      color: #b45309;
      letter-spacing: 2px;
      margin: 10px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 25px 0;
    }
    .stat-card {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px 15px;
      text-align: center;
    }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      display: block;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
    }
    .security-notice {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .security-notice h3 {
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .security-notice ul {
      margin-left: 20px;
      color: #4b5563;
      font-size: 14px;
    }
    .security-notice li {
      margin-bottom: 8px;
    }
    .footer {
      background-color: #1a202c;
      padding: 30px;
      text-align: center;
      color: #a0aec0;
      font-size: 14px;
    }
    .footer-links {
      margin: 20px 0;
    }
    .footer-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 15px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #a0aec0;
      text-decoration: none;
      font-size: 20px;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .welcome-title {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    
    <!-- HEADER -->
    <div class="header">
      <div class="logo">🏦 StakeVault</div>
      <div class="header-subtitle">Your Trusted Staking Platform</div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="content">
      
      <h1 class="welcome-title">Welcome to StakesVault, ${name}! 🎉</h1> 
      
      <p class="welcome-text">
        We're thrilled to have you join our community of smart investors! Your account has been successfully created, and you're now ready to start earning passive income through our secure staking platform.
      </p>

      <!-- CTA BUTTON -->
      <div class="cta-section">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://stakesvault.com'}/dashboard" class="cta-button"> 
          Go to Dashboard →
        </a>
      </div>

      <!-- STATS -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-number">50K+</span>
          <span class="stat-label">Active Users</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">$10M+</span>
          <span class="stat-label">Total Staked</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">99.9%</span>
          <span class="stat-label">Uptime</span>
        </div>
      </div>

      <!-- FEATURES -->
      <div class="feature-box">
        <div class="feature-item">
          <div class="feature-icon">💰</div>
          <div class="feature-content">
            <h3>High Returns</h3>
            <p>Earn competitive APY on your staked assets with daily rewards</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🔒</div>
          <div class="feature-content">
            <h3>Bank-Grade Security</h3>
            <p>Your funds are protected with military-grade encryption</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <div class="feature-content">
            <h3>Instant Withdrawals</h3>
            <p>Access your funds anytime with fast processing</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🎁</div>
          <div class="feature-content">
            <h3>Referral Rewards</h3>
            <p>Earn up to 10% commission on referral earnings</p>
          </div>
        </div>
      </div>

      ${referralCode ? `
      <!-- REFERRAL CODE -->
      <div class="referral-box">
        <h3>🎁 Your Referral Code</h3>
        <p style="color: #78350f; font-size: 14px; margin-bottom: 10px;">
          Share your code and earn 10% commission on every referral's earnings!
        </p>
        <div class="referral-code">${referralCode}</div>
        <p style="color: #92400e; font-size: 13px; margin-top: 10px;">
          Share this code with friends and family to start earning passive income!
        </p>
      </div>
      ` : ''}

      <!-- SECURITY TIPS -->
      <div class="security-notice">
        <h3>🔐 Security Tips</h3>
        <ul>
          <li>Never share your password or 2FA codes with anyone</li>
          <li>Enable Two-Factor Authentication in your settings</li>
          <li>Beware of phishing emails - we'll never ask for your password</li>
          <li>Use a strong, unique password for your account</li>
        </ul>
      </div>

      <p class="welcome-text">
        <strong>Need Help?</strong><br>
        Our support team is available 24/7 to assist you. Feel free to reach out anytime at 
        <a href="mailto:support@stakevault.com" style="color: #667eea;">support@stakevault.com</a>
      </p>

      <p class="welcome-text">
        Happy Staking! 🚀<br>
        <strong>The StakesVault Team</strong> 
      </p>

    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-links">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/about">About Us</a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/support">Support</a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/terms">Terms</a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/privacy">Privacy</a>
      </div>

      <div class="social-links">
        <a href="https://twitter.com/stakevault">𝕏</a>
        <a href="https://t.me/stakevault">📱</a>
        <a href="https://discord.gg/stakevault">💬</a>
      </div>

      <p style="margin-top: 20px; font-size: 12px;">
        © ${new Date().getFullYear()} StakesVault. All rights reserved.<br> 
        You're receiving this email because you created an account on StakeVault.
      </p>

      <p style="margin-top: 15px; font-size: 11px; color: #718096;">
        StakeVault | Secure Staking Platform<br>
        Email: support@stakesvault.com 
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

// 🔥 SEND WELCOME EMAIL FUNCTION
export async function sendWelcomeEmail({ name, email, referralCode }: WelcomeEmailProps) {
  try {
    const html = generateWelcomeEmail({ name, email, referralCode });

    const { data, error } = await resend.emails.send({
      from: 'StakeVault <support@stakesvault.com>', 
      to: [email],
      subject: "🎉 Welcome to StakeVault - Your Account is Ready!",
      html: html,
    });

    if (error) {
      console.error("❌ Welcome email error:", error);
      throw error;
    }

    console.log("✅ Welcome email sent to:", email);
    console.log("📨 Email ID:", data?.id);
    
    return { success: true, emailId: data?.id };
  } catch (error: any) {
    console.error("❌ Failed to send welcome email:", error);
    throw error;
  }
}