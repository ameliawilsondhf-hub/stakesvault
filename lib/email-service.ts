import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email Types
export type EmailType =
  | 'welcome'
  | 'otp'
  | 'password_reset'
  | 'deposit_received'
  | 'deposit_approved'
  | 'deposit_rejected'
  | 'withdrawal_received'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'staking_started'
  | 'staking_reward'
  | 'staking_completed'
  | 'referral_joined'
  | 'referral_earning'
  | 'security_new_device'
  | 'security_password_changed'
  | 'security_suspicious_activity'
  | 'account_updated';

interface EmailData {
  to: string;
  type: EmailType;
  data: Record<string, any>;
}

// Base email template wrapper
const getEmailTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0f172a;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
      color: #e2e8f0;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
    }
    .info-box {
      background: #334155;
      border: 2px solid #475569;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #475569;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #94a3b8;
      font-size: 14px;
    }
    .info-value {
      color: #f1f5f9;
      font-weight: 600;
      font-size: 14px;
    }
    .amount {
      font-size: 36px;
      font-weight: 700;
      color: #10b981;
      text-align: center;
      margin: 20px 0;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
      color: #92400e;
    }
    .success-box {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
      color: #065f46;
    }
    .danger-box {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
      color: #991b1b;
    }
    .footer {
      background: #0f172a;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #334155;
    }
    .footer-text {
      color: #64748b;
      font-size: 12px;
      margin: 8px 0;
    }
    .footer-link {
      color: #818cf8;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: #475569;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div style="background-color: #0f172a; padding: 40px 20px;">
    <div class="container">
      <div class="header">
        <div class="logo">🏦</div>
        <h1>${title}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p class="footer-text" style="font-weight: 600; margin-bottom: 16px;">
          © ${new Date().getFullYear()} StakeVault. All rights reserved.
        </p>
        <p class="footer-text">
          Need help? Contact us at 
          <a href="mailto:support@stakesvault.com" class="footer-link">support@stakesvault.com</a>
        </p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #334155;">
          <p class="footer-text">
            This is an automated email. Please do not reply.
          </p>
          <p class="footer-text">
            StakeVault - Automated Staking & Smart Investment Platform
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Email content generators
const emailContents = {
  welcome: (data: any) => ({
    subject: "🎉 Welcome to StakeVault - Your Account is Ready!",
    title: "Welcome to StakeVault",
    content: `
      <p style="font-size: 18px; margin-bottom: 12px;">Hi <strong>${data.name}</strong>! 👋</p>
      
      <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
        Congratulations on creating your <strong>StakeVault</strong> account! We're thrilled to have you join our community of smart investors.
      </p>

      ${data.referralCode ? `
      <div class="info-box">
        <p style="margin: 0 0 12px 0; color: #cbd5e1; font-size: 14px;">
          <strong>Your Unique Referral Code:</strong>
        </p>
        <p style="font-size: 24px; font-weight: 700; color: #818cf8; letter-spacing: 2px; margin: 0; font-family: monospace;">
          ${data.referralCode}
        </p>
        <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 12px;">
          Share this code with friends and earn rewards! 💰
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/auth/login" class="button">
          Login to Your Account
        </a>
      </div>

      <h3 style="color: #f1f5f9; margin-top: 32px; margin-bottom: 16px;">✨ What's Next?</h3>

      <div class="info-box">
        <div style="margin-bottom: 16px;">
          <strong style="color: #f1f5f9;">1️⃣ Complete Your Profile</strong>
          <p style="color: #cbd5e1; font-size: 14px; margin: 4px 0 0 0;">
            Add your details and set up two-factor authentication
          </p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <strong style="color: #f1f5f9;">2️⃣ Make Your First Deposit</strong>
          <p style="color: #cbd5e1; font-size: 14px; margin: 4px 0 0 0;">
            Start with as little as $20 USDT
          </p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <strong style="color: #f1f5f9;">3️⃣ Start Staking</strong>
          <p style="color: #cbd5e1; font-size: 14px; margin: 4px 0 0 0;">
            Choose from various plans with competitive returns
          </p>
        </div>
        
        <div>
          <strong style="color: #f1f5f9;">4️⃣ Invite Friends & Earn</strong>
          <p style="color: #cbd5e1; font-size: 14px; margin: 4px 0 0 0;">
            Use your referral code and earn up to 3 levels of commissions
          </p>
        </div>
      </div>

      <div class="alert-box">
        <strong>🎁 New User Bonus</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          Make your first deposit within 7 days and receive a special welcome bonus!
        </p>
      </div>
    `
  }),

  otp: (data: any) => ({
    subject: "🔐 Your Email Verification Code",
    title: "Email Verification",
    content: `
      <p style="font-size: 16px; margin-bottom: 12px;">Hello <strong>${data.name}</strong>,</p>
      
      <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
        Please use the following OTP to verify your email address:
      </p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 36px; font-weight: 700; padding: 24px; border-radius: 12px; letter-spacing: 12px; text-align: center; margin: 24px 0; font-family: monospace;">
        ${data.otp}
      </div>
      
      <div class="alert-box">
        <strong>⏰ Important</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          This code will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  }),

  password_reset: (data: any) => ({
    subject: "🔒 Password Reset Request - StakeVault",
    title: "Password Reset Request",
    content: `
      <p style="font-size: 16px; margin-bottom: 12px;">Hi <strong>${data.name}</strong>,</p>
      
      <p style="color: #cbd5e1; line-height: 1.6;">
        We received a request to reset the password for your <strong>StakeVault</strong> account. 
        If you made this request, click the button below to create a new password.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.resetUrl}" class="button">Reset Your Password</a>
      </div>
      
      <div class="danger-box">
        <strong>⚠️ Security Information:</strong>
        <ul style="margin: 12px 0; padding-left: 20px; line-height: 1.8;">
          <li>This link will <strong>expire in 1 hour</strong></li>
          <li>If you didn't request this, <strong>please ignore</strong> this email</li>
          <li>Your password remains unchanged until you set a new one</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #94a3b8; font-size: 13px;">
        <strong>Having trouble with the button?</strong> Copy and paste this link:
      </p>
      <p style="font-size: 12px; word-break: break-all; background: #334155; padding: 12px; border-radius: 8px; color: #818cf8; font-family: monospace;">
        ${data.resetUrl}
      </p>
    `
  }),

  deposit_received: (data: any) => ({
    subject: "✅ Deposit Request Received - Pending Review",
    title: "Deposit Received",
    content: `
      <p style="font-size: 16px; margin-bottom: 12px;">Hi <strong>${data.name}</strong>,</p>
      
      <p style="color: #cbd5e1; line-height: 1.6;">
        We've received your deposit request. Our team is reviewing it now.
      </p>
      
      <div class="amount">$${data.amount} USDT</div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Transaction ID</span>
          <span class="info-value">#${data.transactionId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value">$${data.amount} USDT</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">⏳ Pending Review</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${new Date(data.date).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="alert-box">
        <strong>⏰ What's Next?</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          Your deposit will be reviewed within <strong>24 hours</strong>. You'll receive another email once it's approved.
        </p>
      </div>
    `
  }),

  deposit_approved: (data: any) => ({
    subject: "🎉 Deposit Approved - Funds Added to Your Account",
    title: "Deposit Approved",
    content: `
      <p style="font-size: 16px; margin-bottom: 12px;">Great news, <strong>${data.name}</strong>! 🎉</p>
      
      <p style="color: #cbd5e1; line-height: 1.6;">
        Your deposit has been <strong>approved</strong> and funds have been added to your wallet.
      </p>
      
      <div class="amount">$${data.amount} USDT</div>
      
      <div class="success-box">
        <strong>✓ Funds Added Successfully</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          Your new wallet balance is <strong>$${data.newBalance} USDT</strong>
        </p>
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Transaction ID</span>
          <span class="info-value">#${data.transactionId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount Deposited</span>
          <span class="info-value">$${data.amount} USDT</span>
        </div>
        <div class="info-row">
          <span class="info-label">New Balance</span>
          <span class="info-value" style="color: #10b981;">$${data.newBalance} USDT</span>
        </div>
        <div class="info-row">
          <span class="info-label">Approved On</span>
          <span class="info-value">${new Date(data.date).toLocaleString()}</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">
          View Dashboard
        </a>
      </div>
      
      <div class="alert-box">
        <strong>💡 Ready to Start Staking?</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          Visit your dashboard to explore staking plans and start earning rewards!
        </p>
      </div>
    `
  }),

  deposit_rejected: (data: any) => ({
    subject: "❌ Deposit Request Rejected",
    title: "Deposit Rejected",
    content: `
      <p style="font-size: 16px; margin-bottom: 12px;">Hi <strong>${data.name}</strong>,</p>
      
      <p style="color: #cbd5e1; line-height: 1.6;">
        Unfortunately, your deposit request has been <strong>rejected</strong>.
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Transaction ID</span>
          <span class="info-value">#${data.transactionId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value">$${data.amount} USDT</span>
        </div>
        <div class="info-row">
          <span class="info-label">Reason</span>
          <span class="info-value">${data.reason || 'Invalid transaction proof'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${new Date(data.date).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="danger-box">
        <strong>⚠️ Why was it rejected?</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          ${data.reason || 'The transaction proof provided was invalid or unclear. Please ensure you upload a clear screenshot showing the complete transaction details.'}
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/deposit" class="button">
          Try Again
        </a>
      </div>
      
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        If you believe this was a mistake or need assistance, please contact our support team.
      </p>
    `
  }),

  withdrawal_received: (data: any) => ({
    subject: "✅ Withdrawal Request Received - Processing",
    title: "Withdrawal Received",
    content: `
      <p style="font-size: 16px; margin-bottom: 12px;">Hi <strong>${data.name}</strong>,</p>
      
      <p style="color: #cbd5e1; line-height: 1.6;">
        We've received your withdrawal request. Your funds have been deducted from your wallet and processing has begun.
      </p>
      
      <div class="amount" style="color: #ef4444;">-$${data.amount} USDT</div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Request ID</span>
          <span class="info-value">#${data.requestId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value">$${data.amount} USDT</span>
        </div>
        <div class="info-row">
          <span class="info-label">Wallet Address</span>
          <span class="info-value" style="font-size: 11px; word-break: break-all;">${data.walletAddress}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">⏳ Processing</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${new Date(data.date).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="alert-box">
        <strong>⏰ Processing Time</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          Withdrawals are typically processed within <strong>24-48 hours</strong>. You'll receive another email once the payment is sent.
        </p>
      </div>
    `
  }),

  withdrawal_approved: (data: any) => ({
    subject: "💸 Withdrawal Approved - Payment Sent",
    title: "Withdrawal Completed",
    content: `
      <p style="font-size: 16px; margin-bottom: 12px;">Good news, <strong>${data.name}</strong>! 💸</p>
      
      <p style="color: #cbd5e1; line-height: 1.6;">
        Your withdrawal has been <strong>approved</strong> and payment has been sent to your wallet.
      </p>
      
      <div class="amount" style="color: #10b981;">$${data.amount} USDT</div>
      
      <div class="success-box">
        <strong>✓ Payment Sent Successfully</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          The funds should arrive in your wallet within a few minutes.
        </p>
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Request ID</span>
          <span class="info-value">#${data.requestId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount Sent</span>
          <span class="info-value">$${data.amount} USDT</span>
        </div>
        <div class="info-row">
          <span class="info-label">Wallet Address</span>
          <span class="info-value" style="font-size: 11px; word-break: break-all;">${data.walletAddress}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Completed On</span>
          <span class="info-value">${new Date(data.date).toLocaleString()}</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/withdraw" class="button">
          View Withdrawal History
        </a>
      </div>
      
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Thank you for using StakeVault! We hope to serve you again soon.
      </p>
    `
  }),

  withdrawal_rejected: (data: any) => ({
    subject: "❌ Withdrawal Request Rejected - Funds Refunded",
    title: "Withdrawal Rejected",
    content: `
      <p style="font-size: 16px; margin-bottom: 12px;">Hi <strong>${data.name}</strong>,</p>
      
      <p style="color: #cbd5e1; line-height: 1.6;">
        Your withdrawal request has been <strong>rejected</strong>. The funds have been <strong>refunded to your wallet</strong>.
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Request ID</span>
          <span class="info-value">#${data.requestId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount Refunded</span>
          <span class="info-value" style="color: #10b981;">$${data.amount} USDT</span>
        </div>
        <div class="info-row">
          <span class="info-label">Reason</span>
          <span class="info-value">${data.reason || 'Invalid wallet address'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${new Date(data.date).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="danger-box">
        <strong>⚠️ Why was it rejected?</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          ${data.reason || 'The wallet address provided was invalid or incompatible with our system. Please verify your TRC20 wallet address and try again.'}
        </p>
      </div>
      
      <div class="success-box">
        <strong>✓ Funds Refunded</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          The full amount has been refunded to your wallet. You can request a new withdrawal anytime.
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/withdraw" class="button">
          Request New Withdrawal
        </a>
      </div>
    `
  }),

  // More email types will be added in next phases...
};

// Main email sending function
export async function sendEmail({ to, type, data }: EmailData) {
  try {
    const emailConfig = emailContents[type](data);
    const htmlContent = getEmailTemplate(emailConfig.content, emailConfig.title);

    const result = await resend.emails.send({
      from: 'StakeVault <support@stakesvault.com>',
      to: [to],
      subject: emailConfig.subject,
      html: htmlContent,
    });

    if (result.error) {
      console.error(`❌ Email send error (${type}):`, result.error);
      return { success: false, error: result.error };
    }

    console.log(`✅ Email sent successfully (${type}) to ${to}`);
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error(`❌ Email send exception (${type}):`, error);
    return { success: false, error: error.message };
  }
}

// Convenience functions for each email type
export const emailService = {
  sendWelcome: (to: string, name: string, referralCode?: string) =>
    sendEmail({ to, type: 'welcome', data: { name, referralCode } }),

  sendOTP: (to: string, name: string, otp: string) =>
    sendEmail({ to, type: 'otp', data: { name, otp } }),

  sendPasswordReset: (to: string, name: string, resetUrl: string) =>
    sendEmail({ to, type: 'password_reset', data: { name, resetUrl } }),

  sendDepositReceived: (to: string, name: string, amount: number, transactionId: string) =>
    sendEmail({ to, type: 'deposit_received', data: { name, amount, transactionId, date: new Date() } }),

  sendDepositApproved: (to: string, name: string, amount: number, newBalance: number, transactionId: string) =>
    sendEmail({ to, type: 'deposit_approved', data: { name, amount, newBalance, transactionId, date: new Date() } }),

  sendDepositRejected: (to: string, name: string, amount: number, transactionId: string, reason?: string) =>
    sendEmail({ to, type: 'deposit_rejected', data: { name, amount, transactionId, reason, date: new Date() } }),

  sendWithdrawalReceived: (to: string, name: string, amount: number, walletAddress: string, requestId: string) =>
    sendEmail({ to, type: 'withdrawal_received', data: { name, amount, walletAddress, requestId, date: new Date() } }),

  sendWithdrawalApproved: (to: string, name: string, amount: number, walletAddress: string, requestId: string) =>
    sendEmail({ to, type: 'withdrawal_approved', data: { name, amount, walletAddress, requestId, date: new Date() } }),

  sendWithdrawalRejected: (to: string, name: string, amount: number, walletAddress: string, requestId: string, reason?: string) =>
    sendEmail({ to, type: 'withdrawal_rejected', data: { name, amount, walletAddress, requestId, reason, date: new Date() } }),
};