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
  | 'stake_started'
  | 'stake_unlocked'
  | 'stake_withdrawal_completed'
  | 'stake_relocked'
  | 'referral_joined'      // ⭐ NEW
  | 'commission_earned'    // ⭐ NEW
  | 'level_income';        // ⭐ NEW

interface EmailData {
  to: string;
  type: EmailType;
  data: Record<string, any>;
}

// Base email template wrapper (Ultra-Professional - Mobile Optimized)
const getEmailTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
    }
    .email-wrapper {
      background-color: #f5f5f5;
      padding: 20px 10px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%);
      padding: 32px 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2px;
    }
    .header .subtitle {
      color: #93c5fd;
      font-size: 13px;
      margin-top: 8px;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 24px 20px;
      color: #334155;
      font-size: 14px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 16px 0;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
      font-size: 13px;
    }
    .info-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      padding: 12px 14px;
      margin: 16px 0;
      border-radius: 6px;
      font-size: 13px;
    }
    .success-box {
      background: #d1fae5;
      border-left: 3px solid #10b981;
      padding: 12px 14px;
      margin: 16px 0;
      border-radius: 6px;
      font-size: 13px;
    }
    .danger-box {
      background: #fee2e2;
      border-left: 3px solid #ef4444;
      padding: 12px 14px;
      margin: 16px 0;
      border-radius: 6px;
      font-size: 13px;
    }
    .footer {
      background: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .footer-text {
      color: #64748b;
      margin: 6px 0;
      line-height: 1.5;
    }
    .footer-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 20px 0;
    }
    .amount-highlight {
      font-size: 28px;
      font-weight: 700;
      color: #10b981;
      text-align: center;
      margin: 20px 0;
      letter-spacing: -0.5px;
    }
    p {
      margin: 0 0 12px 0;
    }
    strong {
      color: #0f172a;
    }
    @media only screen and (max-width: 600px) {
      .container {
        border-radius: 0;
      }
      .header h1 {
        font-size: 20px;
      }
      .amount-highlight {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1>STAKES VAULT</h1>
        <p class="subtitle">${title}</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p class="footer-text" style="font-weight: 600; color: #334155;">
          © ${new Date().getFullYear()} STAKES VAULT
        </p>
        <p class="footer-text">
          <a href="mailto:support@stakesvault.com" class="footer-link">support@stakesvault.com</a>
        </p>
        <p class="footer-text" style="margin-top: 12px;">
          Smart Investment & Automated Staking Platform
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Email content generators (ULTRA-PROFESSIONAL - MOBILE OPTIMIZED)
const emailContents = {
  welcome: (data: any) => ({
    subject: "Welcome to STAKES VAULT",
    title: "Welcome Aboard",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Welcome to <strong>STAKES VAULT</strong>! We're excited to have you join our smart investment platform.</p>

      ${data.referralCode ? `
      <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 8px; padding: 16px; margin: 16px 0; border: 2px solid #c4b5fd; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #5b21b6; font-size: 12px; font-weight: 600;">YOUR REFERRAL CODE</p>
        <p style="font-size: 22px; font-weight: 700; color: #6d28d9; letter-spacing: 2px; margin: 0; font-family: monospace;">${data.referralCode}</p>
        <p style="margin: 12px 0 0 0; color: #7c3aed; font-size: 11px;">Share to earn rewards!</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/auth/login" class="button">Access Account</a>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="color: #0f172a; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Quick Start</p>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>1.</strong> Complete your profile</p>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>2.</strong> Make your first deposit ($20 min)</p>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>3.</strong> Start earning with staking</p>
        <p style="font-size: 13px; color: #64748b; margin: 0;"><strong>4.</strong> Refer friends to earn more</p>
      </div>

      <p style="color: #64748b; font-size: 13px; margin-top: 20px;">
        Best regards,<br><strong>STAKES VAULT Team</strong>
      </p>
    `
  }),

  otp: (data: any) => ({
    subject: "Verification Code - STAKES VAULT",
    title: "Email Verification",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Use this code to verify your email:</p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: 700; padding: 20px; border-radius: 8px; letter-spacing: 6px; text-align: center; margin: 20px 0; font-family: monospace;">
        ${data.otp}
      </div>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
          <strong>⏰ Expires in 10 minutes.</strong> Never share this code with anyone.
        </p>
      </div>
    `
  }),

  password_reset: (data: any) => ({
    subject: "Password Reset - STAKES VAULT",
    title: "Reset Password",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          <strong>⏰ Link expires in 1 hour.</strong> If you didn't request this, ignore this email.
        </p>
      </div>
    `
  }),

  deposit_received: (data: any) => ({
    subject: "Deposit Received - Under Review",
    title: "Deposit Processing",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Your deposit request is being reviewed.</p>
      
      <div class="amount-highlight">$${data.amount}</div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Reference</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px;">#${data.transactionId.substring(0, 12)}...</td>
        </tr>
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">PENDING</span></td>
        </tr>
      </table>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          <strong>⏰ Processing within 24 hours.</strong> You'll be notified once approved.
        </p>
      </div>
    `
  }),

  deposit_approved: (data: any) => ({
    subject: "Deposit Approved - Funds Added",
    title: "Deposit Confirmed",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Your deposit has been approved!</p>
      
      <div class="amount-highlight">$${data.amount}</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">✓ Funds Successfully Added</p>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">New balance: <strong>$${data.newBalance}</strong></p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Reference</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px;">#${data.transactionId.substring(0, 12)}...</td>
        </tr>
        <tr>
          <td class="info-label">Deposited</td>
          <td class="info-value" style="color: #10b981;">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">New Balance</td>
          <td class="info-value" style="color: #10b981; font-size: 15px;">$${data.newBalance}</td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
      </div>
    `
  }),

  deposit_rejected: (data: any) => ({
    subject: "Deposit Declined - Action Required",
    title: "Deposit Update",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>We were unable to process your deposit request.</p>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Reference</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px;">#${data.transactionId.substring(0, 12)}...</td>
        </tr>
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value"><span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">DECLINED</span></td>
        </tr>
      </table>
      
      <div class="danger-box">
        <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 600; font-size: 13px;">Reason</p>
        <p style="color: #b91c1c; margin: 0; font-size: 12px; line-height: 1.5;">${data.reason}</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/deposit" class="button">Submit New Deposit</a>
      </div>
    `
  }),

  withdrawal_received: (data: any) => ({
    subject: "Withdrawal Processing",
    title: "Withdrawal Request",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Your withdrawal request is being processed.</p>
      
      <div class="amount-highlight" style="color: #ef4444;">-$${data.amount}</div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Request ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px;">#${data.requestId.substring(0, 12)}...</td>
        </tr>
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">Network</td>
          <td class="info-value">TRC20</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">PROCESSING</span></td>
        </tr>
      </table>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          <strong>⏰ Completed within 24-48 hours.</strong> You'll be notified once sent.
        </p>
      </div>
    `
  }),

  withdrawal_approved: (data: any) => ({
    subject: "Withdrawal Completed",
    title: "Payment Sent",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Your withdrawal has been completed!</p>
      
      <div class="amount-highlight" style="color: #10b981;">$${data.amount}</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">✓ Payment Sent Successfully</p>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">Funds arriving shortly</p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Request ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px;">#${data.requestId.substring(0, 12)}...</td>
        </tr>
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value" style="color: #10b981;">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">Network</td>
          <td class="info-value">TRC20</td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/withdraw" class="button">View History</a>
      </div>
    `
  }),

  withdrawal_rejected: (data: any) => ({
    subject: "Withdrawal Declined - Funds Refunded",
    title: "Withdrawal Update",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>We were unable to process your withdrawal. Funds have been refunded.</p>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Request ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px;">#${data.requestId.substring(0, 12)}...</td>
        </tr>
        <tr>
          <td class="info-label">Refunded</td>
          <td class="info-value" style="color: #10b981; font-size: 15px;">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value"><span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">DECLINED</span></td>
        </tr>
      </table>
      
      <div class="danger-box">
        <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 600; font-size: 13px;">Reason</p>
        <p style="color: #b91c1c; margin: 0; font-size: 12px; line-height: 1.5;">${data.reason || 'Invalid wallet address'}</p>
      </div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">✓ Funds Refunded</p>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">You can submit a new request</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/withdraw" class="button">Request Again</a>
      </div>
    `
  }),

  stake_started: (data: any) => ({
    subject: "Staking Activated - Growing Daily",
    title: "Stake Activated",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Your stake is now active with 1% daily compounding returns!</p>
      
      <div class="amount-highlight" style="color: #8b5cf6;">$${data.amount}</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">✓ Staking Active</p>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">Daily rewards compounding automatically</p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value" style="color: #8b5cf6;">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">Period</td>
          <td class="info-value">${data.lockPeriod} Days</td>
        </tr>
        <tr>
          <td class="info-label">Daily</td>
          <td class="info-value" style="color: #10b981;">1% Compound</td>
        </tr>
        <tr>
          <td class="info-label">Unlock</td>
          <td class="info-value">${new Date(data.unlockDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        </tr>
      </table>
      
      <div style="background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 8px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0; color: #0c4a6e; font-size: 12px; line-height: 1.6;">
          <strong style="color: #0369a1;">Expected:</strong> $${(data.amount * Math.pow(1.01, data.lockPeriod)).toFixed(2)} after ${data.lockPeriod} days
        </p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/stakes" class="button">View Stakes</a>
      </div>
    `
  }),

  stake_unlocked: (data: any) => ({
    subject: "Stake Unlocked - Withdraw Available",
    title: "Stake Unlocked",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Your stake is now unlocked and ready for withdrawal!</p>
      
      <div class="amount-highlight" style="color: #10b981;">$${data.finalAmount}</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">✓ Staking Completed</p>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">48 hours to withdraw before auto re-lock</p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Original</td>
          <td class="info-value">$${data.originalAmount}</td>
        </tr>
        <tr>
          <td class="info-label">Profit</td>
          <td class="info-value" style="color: #10b981; font-weight: 700;">+$${data.totalProfit}</td>
        </tr>
        <tr>
          <td class="info-label">Final</td>
          <td class="info-value" style="color: #10b981; font-size: 15px;">$${data.finalAmount}</td>
        </tr>
        <tr>
          <td class="info-label">Cycle</td>
          <td class="info-value">#${data.cycle}</td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/stakes" class="button">Withdraw Now</a>
      </div>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          <strong>⏰ Auto re-lock in 48 hours</strong> if not withdrawn
        </p>
      </div>
    `
  }),

  stake_withdrawal_completed: (data: any) => ({
    subject: "Stake Withdrawal Completed",
    title: "Withdrawal Done",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Your stake withdrawal is complete!</p>
      
      <div class="amount-highlight" style="color: #10b981;">$${data.amount}</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">✓ Funds Transferred</p>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">New balance: <strong>$${data.newWalletBalance}</strong></p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Withdrawn</td>
          <td class="info-value" style="color: #10b981;">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">Wallet</td>
          <td class="info-value">$${data.newWalletBalance}</td>
        </tr>
        <tr>
          <td class="info-label">Remaining</td>
          <td class="info-value" style="color: #8b5cf6;">$${data.remainingStake}</td>
        </tr>
      </table>
      
      <div class="success-box" style="background: #ede9fe; border-left-color: #8b5cf6;">
        <p style="margin: 0; color: #5b21b6; font-weight: 600; font-size: 13px;">🔄 Re-Locked for Cycle #${data.newCycle}</p>
        <p style="margin: 6px 0 0 0; color: #6d28d9; font-size: 12px;">Remaining $${data.remainingStake} continues earning!</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
      </div>
    `
  }),

  stake_relocked: (data: any) => ({
    subject: "Stake Auto Re-Locked",
    title: "Re-Locked",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Your stake has been automatically re-locked!</p>
      
      <div class="amount-highlight" style="color: #8b5cf6;">$${data.amount}</div>
      
      <div class="success-box" style="background: #ede9fe; border-left-color: #8b5cf6;">
        <p style="margin: 0; color: #5b21b6; font-weight: 600; font-size: 13px;">🔄 Re-Locked for Cycle #${data.newCycle}</p>
        <p style="margin: 6px 0 0 0; color: #6d28d9; font-size: 12px;">Daily 1% compounding continues</p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value" style="color: #8b5cf6;">$${data.amount}</td>
        </tr>
        <tr>
          <td class="info-label">Period</td>
          <td class="info-value">${data.lockPeriod} Days</td>
        </tr>
        <tr>
          <td class="info-label">Cycle</td>
          <td class="info-value">#${data.newCycle}</td>
        </tr>
        <tr>
          <td class="info-label">Unlock</td>
          <td class="info-value">${new Date(data.newUnlockDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/stakes" class="button">View Details</a>
      </div>
    `
  }),

  // ⭐ NEW: Referral Joined
  referral_joined: (data: any) => ({
    subject: `🎉 New Referral - ${data.newUserName} Joined!`,
    title: "New Referral",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>Great news! A new user joined using your referral code!</p>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">✓ Level ${data.level} Referral</p>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">Your network is growing!</p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Name</td>
          <td class="info-value">${data.newUserName}</td>
        </tr>
        <tr>
          <td class="info-label">Email</td>
          <td class="info-value" style="font-size: 11px;">${data.newUserEmail}</td>
        </tr>
        <tr>
          <td class="info-label">Level</td>
          <td class="info-value">Level ${data.level}</td>
        </tr>
      </table>
      
      <div class="alert-box" style="background: #dbeafe; border-left-color: #3b82f6;">
        <p style="margin: 0; color: #1e40af; font-size: 13px;">
          <strong>💰 Earn Commissions:</strong> ${data.level === 1 ? '10%' : data.level === 2 ? '5%' : '2%'} on their deposits!
        </p>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/referral" class="button">View Network</a>
      </div>
    `
  }),

  // ⭐ NEW: Commission Earned
  commission_earned: (data: any) => ({
    subject: `💰 Commission Earned - $${data.amount.toFixed(2)}`,
    title: "Commission Received",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>You've earned a commission from your network!</p>
      
      <div class="amount-highlight" style="color: #10b981;">+$${data.amount.toFixed(2)}</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 13px;">✓ Commission Credited</p>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">Added to your wallet balance</p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value" style="color: #10b981; font-weight: 700;">+$${data.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="info-label">From</td>
          <td class="info-value">${data.fromUser}</td>
        </tr>
        <tr>
          <td class="info-label">Level</td>
          <td class="info-value">Level ${data.level} (${data.level === 1 ? '10%' : data.level === 2 ? '5%' : '2%'})</td>
        </tr>
        <tr>
          <td class="info-label">Type</td>
          <td class="info-value">${data.transactionType}</td>
        </tr>
      </table>

      <div style="background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 8px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0; color: #0c4a6e; font-size: 12px;">
          <strong style="color: #0369a1;">💡 Earn More:</strong> Share your referral code to build a larger network!
        </p>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
      </div>
    `
  }),

  // ⭐ NEW: Level Income
  level_income: (data: any) => ({
    subject: `📈 Level Income - $${data.amount.toFixed(2)}`,
    title: "Level Income",
    content: `
      <p>Dear <strong>${data.name}</strong>,</p>
      
      <p>You've received level income from your network!</p>
      
      <div class="amount-highlight" style="color: #8b5cf6;">+$${data.amount.toFixed(2)}</div>
      
      <div class="success-box" style="background: #ede9fe; border-left-color: #8b5cf6;">
        <p style="margin: 0; color: #5b21b6; font-weight: 600; font-size: 13px;">✓ Level Income Added</p>
        <p style="margin: 6px 0 0 0; color: #6d28d9; font-size: 12px;">Credited to your level income balance</p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value" style="color: #8b5cf6; font-weight: 700;">+$${data.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="info-label">From</td>
          <td class="info-value">${data.fromUser}</td>
        </tr>
        <tr>
          <td class="info-label">Level</td>
          <td class="info-value">Level ${data.level}</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/referral" class="button">View Network</a>
      </div>
    `
  }),
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

  // Staking Emails
  sendStakeStarted: (to: string, name: string, amount: number, lockPeriod: number, unlockDate: Date, stakeId: string) =>
    sendEmail({ to, type: 'stake_started', data: { name, amount, lockPeriod, unlockDate, stakeId, startDate: new Date() } }),

  sendStakeUnlocked: (to: string, name: string, originalAmount: number, finalAmount: number, totalProfit: number, lockPeriod: number, cycle: number, stakeId: string) =>
    sendEmail({ to, type: 'stake_unlocked', data: { name, originalAmount, finalAmount, totalProfit, lockPeriod, cycle, stakeId } }),

  sendStakeWithdrawalCompleted: (to: string, name: string, amount: number, newWalletBalance: number, remainingStake: number, lockPeriod: number, newCycle: number, stakeId: string) =>
    sendEmail({ to, type: 'stake_withdrawal_completed', data: { name, amount, newWalletBalance, remainingStake, lockPeriod, newCycle, stakeId, date: new Date() } }),

  sendStakeRelocked: (to: string, name: string, amount: number, lockPeriod: number, cycle: number, unlockDate: Date, stakeId: string) =>
    sendEmail({ 
      to, 
      type: 'stake_relocked', 
      data: { 
        name, 
        amount, 
        lockPeriod, 
        newCycle: cycle,
        newStartDate: new Date(),
        newUnlockDate: unlockDate,
        stakeId 
      } 
    }),

  // ⭐ NEW: Referral Emails
  sendReferralJoined: (to: string, name: string, newUserName: string, newUserEmail: string, level: number) =>
    sendEmail({ 
      to, 
      type: 'referral_joined', 
      data: { name, newUserName, newUserEmail, level } 
    }),

  sendCommissionEarned: (to: string, name: string, amount: number, fromUser: string, level: number, transactionType: string) =>
    sendEmail({ 
      to, 
      type: 'commission_earned', 
      data: { name, amount, fromUser, level, transactionType, date: new Date() } 
    }),

  sendLevelIncome: (to: string, name: string, amount: number, fromUser: string, level: number) =>
    sendEmail({ 
      to, 
      type: 'level_income', 
      data: { name, amount, fromUser, level, date: new Date() } 
    }),
};