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
  | 'stake_relocked';

interface EmailData {
  to: string;
  type: EmailType;
  data: Record<string, any>;
}

// Base email template wrapper (Ultra-Professional - NO LOGO)
const getEmailTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%);
      padding: 60px 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .header .subtitle {
      color: #93c5fd;
      font-size: 16px;
      font-weight: 400;
      margin-top: 12px;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      color: #334155;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      background: #f8fafc;
      border-radius: 12px;
      overflow: hidden;
    }
    .info-table td {
      padding: 14px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
      font-size: 14px;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .success-box {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .danger-box {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .footer {
      background: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      color: #64748b;
      font-size: 13px;
      margin: 8px 0;
      line-height: 1.6;
    }
    .footer-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 32px 0;
    }
    .amount-highlight {
      font-size: 32px;
      font-weight: 700;
      color: #10b981;
      text-align: center;
      margin: 24px 0;
      letter-spacing: -1px;
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
        <p class="footer-text" style="font-weight: 600; color: #334155; margin-bottom: 12px;">
          © ${new Date().getFullYear()} STAKES VAULT. All rights reserved.
        </p>
        <p class="footer-text">
          Questions? Contact us at 
          <a href="mailto:support@stakesvault.com" class="footer-link">support@stakesvault.com</a>
        </p>
        <div class="divider" style="margin: 20px auto; max-width: 200px;"></div>
        <p class="footer-text" style="font-size: 12px;">
          This is an automated notification. Please do not reply to this email.
        </p>
        <p class="footer-text" style="font-size: 12px; margin-top: 8px;">
          STAKES VAULT - Smart Investment & Automated Staking Platform
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Email content generators (ULTRA-PROFESSIONAL)
const emailContents = {
  welcome: (data: any) => ({
    subject: "Welcome to STAKES VAULT - Account Successfully Created",
    title: "Welcome to STAKES VAULT",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        Thank you for creating an account with <strong>STAKES VAULT</strong>. We're excited to have you join our platform 
        for smart investing and automated staking solutions.
      </p>

      ${data.referralCode ? `
      <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border: 2px solid #c4b5fd;">
        <p style="margin: 0 0 12px 0; color: #5b21b6; font-size: 14px; font-weight: 600;">
          YOUR REFERRAL CODE
        </p>
        <p style="font-size: 28px; font-weight: 700; color: #6d28d9; letter-spacing: 3px; margin: 0; font-family: monospace;">
          ${data.referralCode}
        </p>
        <p style="margin: 16px 0 0 0; color: #7c3aed; font-size: 13px;">
          Share this code with friends to earn rewards on their deposits!
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/auth/login" class="button">
          Access Your Account
        </a>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #0f172a; margin: 0 0 20px 0; font-size: 17px; font-weight: 600;">Getting Started</h3>
        
        <div style="margin-bottom: 16px;">
          <strong style="color: #334155; font-size: 15px;">1. Complete Your Profile</strong>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0; line-height: 1.6;">
            Add your information and enable two-factor authentication for enhanced security.
          </p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <strong style="color: #334155; font-size: 15px;">2. Make Your First Deposit</strong>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0; line-height: 1.6;">
            Fund your account securely using USDT (TRC20). Minimum deposit: $20.
          </p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <strong style="color: #334155; font-size: 15px;">3. Start Earning</strong>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0; line-height: 1.6;">
            Choose from our staking plans and start earning competitive returns.
          </p>
        </div>
        
        <div>
          <strong style="color: #334155; font-size: 15px;">4. Refer & Earn More</strong>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0; line-height: 1.6;">
            Use your referral code to earn commissions on up to 3 levels.
          </p>
        </div>
      </div>

      <div class="alert-box" style="background: #dbeafe; border-left-color: #3b82f6;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
          <strong>New User Bonus:</strong> Make your first deposit within 7 days to qualify for a special welcome bonus!
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin-top: 32px;">
        Best regards,<br>
        <strong style="color: #334155;">The STAKES VAULT Team</strong>
      </p>
    `
  }),

  otp: (data: any) => ({
    subject: "Email Verification Code - STAKES VAULT",
    title: "Email Verification",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        To complete your email verification, please use the following one-time password (OTP):
      </p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 36px; font-weight: 700; padding: 28px; border-radius: 12px; letter-spacing: 8px; text-align: center; margin: 28px 0; font-family: monospace; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);">
        ${data.otp}
      </div>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong>⏰ Time Sensitive:</strong> This code will expire in <strong>10 minutes</strong>. 
          If you didn't request this verification, please disregard this email.
        </p>
      </div>

      <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
          <strong style="color: #334155;">Security Tip:</strong> Never share this code with anyone. STAKES VAULT staff will never ask for your OTP.
        </p>
      </div>
    `
  }),

  password_reset: (data: any) => ({
    subject: "Password Reset Request - STAKES VAULT",
    title: "Reset Your Password",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        We received a request to reset the password for your STAKES VAULT account. Click the button below to create a new password.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>
      
      <div class="danger-box">
        <p style="margin: 0 0 12px 0; color: #991b1b; font-weight: 600; font-size: 15px;">🔒 Security Information</p>
        <ul style="margin: 0; padding-left: 20px; color: #b91c1c; line-height: 1.8; font-size: 14px;">
          <li>This link expires in <strong>1 hour</strong></li>
          <li>If you didn't request this, please ignore this email</li>
          <li>Your password remains unchanged until you set a new one</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">
        <strong>Having trouble with the button?</strong> Copy and paste this URL:
      </p>
      <p style="font-size: 12px; word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 8px; color: #667eea; font-family: monospace; border: 1px solid #e2e8f0;">
        ${data.resetUrl}
      </p>
    `
  }),

  deposit_received: (data: any) => ({
    subject: "Deposit Request Received - Under Review",
    title: "Deposit Processing",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        We have successfully received your deposit request and it is currently under review by our team.
      </p>
      
      <div class="amount-highlight">$${data.amount} USDT</div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Reference ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.transactionId}</td>
        </tr>
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value">
            <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">PENDING REVIEW</span>
          </td>
        </tr>
        <tr>
          <td class="info-label">Submitted On</td>
          <td class="info-value">${new Date(data.date).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong>⏰ Processing Time:</strong> Your deposit will be reviewed within <strong>24 hours</strong>. 
          You'll receive another notification once it's processed.
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin-top: 32px;">
        Thank you for choosing STAKES VAULT.
      </p>
    `
  }),

  deposit_approved: (data: any) => ({
    subject: "Deposit Approved - Funds Added Successfully",
    title: "Deposit Confirmed",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        Excellent news! Your deposit has been approved and the funds have been successfully credited to your account.
      </p>
      
      <div class="amount-highlight">$${data.amount} USDT</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 15px;">✓ Funds Successfully Added</p>
        <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">
          Your new wallet balance: <strong>$${data.newBalance} USDT</strong>
        </p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Reference ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.transactionId}</td>
        </tr>
        <tr>
          <td class="info-label">Amount Deposited</td>
          <td class="info-value" style="color: #10b981;">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">New Balance</td>
          <td class="info-value" style="color: #10b981; font-size: 16px;">$${data.newBalance} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Approved On</td>
          <td class="info-value">${new Date(data.date).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">
          View Dashboard
        </a>
      </div>
      
      <div class="alert-box" style="background: #dbeafe; border-left-color: #3b82f6;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
          <strong>💡 Ready to Invest?</strong> Your funds are now available. 
          Explore our staking plans to start earning competitive returns!
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin-top: 32px;">
        Thank you for your trust in STAKES VAULT.
      </p>
    `
  }),

  deposit_rejected: (data: any) => ({
    subject: "Important: Action Required - Your STAKES VAULT Deposit Request Has Been Declined",
    title: "Deposit Review Update",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        Thank you for your recent deposit request with STAKES VAULT. We have reviewed your transaction details and, 
        regrettably, we are unable to process it at this time due to the issue outlined below.
      </p>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Reference ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.transactionId}</td>
        </tr>
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value">
            <span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">DECLINED</span>
          </td>
        </tr>
        <tr>
          <td class="info-label">Reviewed On</td>
          <td class="info-value">${new Date(data.date).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
      
      <div class="danger-box">
        <div style="display: flex; align-items: start; gap: 16px;">
          <div style="width: 48px; height: 48px; background: #fee2e2; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span style="font-size: 28px;">⚠️</span>
          </div>
          <div style="flex: 1;">
            <p style="color: #991b1b; margin: 0 0 12px 0; font-weight: 600; font-size: 15px;">Reason for Declining</p>
            <p style="color: #b91c1c; margin: 0; font-size: 14px; line-height: 1.7;">
              ${data.reason}
            </p>
          </div>
        </div>
      </div>
      
      <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📋 How to Resolve This</h3>
        <ol style="margin: 0; padding-left: 20px; color: #1e40af; line-height: 2; font-size: 14px;">
          <li><strong>Review</strong> the decline reason carefully above</li>
          <li><strong>Capture</strong> a clear, high-resolution screenshot showing:
            <ul style="margin-top: 8px; padding-left: 20px; list-style-type: circle;">
              <li>Complete transaction amount</li>
              <li>Full transaction ID/hash</li>
              <li>Transaction date and time</li>
              <li>Wallet addresses (sender & recipient)</li>
            </ul>
          </li>
          <li><strong>Resubmit:</strong> Initiate a new deposit request using the correct wallet address as provided on the STAKES VAULT platform.</li>
          <li><strong>Verify</strong> all details match your actual transaction</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/deposit" class="button">
          Submit New Deposit
        </a>
      </div>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
          <strong style="color: #334155;">Need Assistance?</strong> Our support team is available 24/7. 
          Contact us at <a href="mailto:support@stakesvault.com" class="footer-link">support@stakesvault.com</a> 
          for help with this deposit.
        </p>
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">
        <strong style="color: #475569;">Security Notice:</strong> For your protection, please ensure you're submitting 
        proof from your own wallet. Third-party transactions cannot be accepted.
      </p>
    `
  }),

  withdrawal_received: (data: any) => ({
    subject: "Withdrawal Request Received - Processing",
    title: "Withdrawal Processing",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        We have received your withdrawal request. The requested amount has been deducted from your wallet 
        and is now being processed by our team.
      </p>
      
      <div class="amount-highlight" style="color: #ef4444;">-$${data.amount} USDT</div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Request ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.requestId}</td>
        </tr>
        <tr>
          <td class="info-label">Amount</td>
          <td class="info-value">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Destination</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px; word-break: break-all;">${data.walletAddress}</td>
        </tr>
        <tr>
          <td class="info-label">Network</td>
          <td class="info-value">TRC20 (TRON)</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value">
            <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">PROCESSING</span>
          </td>
        </tr>
        <tr>
          <td class="info-label">Submitted On</td>
          <td class="info-value">${new Date(data.date).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong>⏰ Processing Time:</strong> Withdrawals are typically completed within <strong>24-48 hours</strong>. 
          You'll receive a confirmation email once the payment is sent.
        </p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
          <strong style="color: #334155;">Security Check:</strong> Please verify the wallet address above matches your intended destination. 
          Cryptocurrency transactions are irreversible.
        </p>
      </div>
    `
  }),

  withdrawal_approved: (data: any) => ({
    subject: "Withdrawal Completed - Payment Sent Successfully",
    title: "Withdrawal Confirmed",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        Great news! Your withdrawal has been approved and the payment has been successfully sent to your wallet.
      </p>
      
      <div class="amount-highlight" style="color: #10b981;">$${data.amount} USDT</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 15px;">✓ Payment Sent Successfully</p>
        <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">
          The funds should arrive in your wallet within a few minutes.
        </p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Request ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.requestId}</td>
        </tr>
        <tr>
          <td class="info-label">Amount Sent</td>
          <td class="info-value" style="color: #10b981;">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Destination</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px; word-break: break-all;">${data.walletAddress}</td>
        </tr>
        <tr>
          <td class="info-label">Network</td>
          <td class="info-value">TRC20 (TRON)</td>
        </tr>
        <tr>
          <td class="info-label">Completed On</td>
          <td class="info-value">${new Date(data.date).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/withdraw" class="button">
          View Withdrawal History
        </a>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
          <strong style="color: #334155;">Transaction Note:</strong> You can track this transaction on the TRON blockchain 
          using a block explorer. The funds should be visible in your wallet shortly.
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin-top: 32px;">
        Thank you for using STAKES VAULT. We look forward to serving you again.
      </p>
    `
  }),

  withdrawal_rejected: (data: any) => ({
    subject: "Withdrawal Request Declined - Funds Refunded",
    title: "Withdrawal Update",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        We have reviewed your withdrawal request and unfortunately, we are unable to process it. 
        The full amount has been refunded to your wallet.
      </p>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Request ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.requestId}</td>
        </tr>
        <tr>
          <td class="info-label">Amount Refunded</td>
          <td class="info-value" style="color: #10b981; font-size: 16px;">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Original Destination</td>
          <td class="info-value" style="font-family: monospace; font-size: 11px; word-break: break-all;">${data.walletAddress}</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value">
            <span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">DECLINED</span>
          </td>
        </tr>
        <tr>
          <td class="info-label">Reviewed On</td>
          <td class="info-value">${new Date(data.date).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
      
      <div class="danger-box">
        <div style="display: flex; align-items: start; gap: 16px;">
          <div style="width: 48px; height: 48px; background: #fee2e2; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span style="font-size: 28px;">⚠️</span>
          </div>
          <div style="flex: 1;">
            <p style="color: #991b1b; margin: 0 0 12px 0; font-weight: 600; font-size: 15px;">Reason for Declining</p>
            <p style="color: #b91c1c; margin: 0; font-size: 14px; line-height: 1.7;">
              ${data.reason || 'The wallet address provided was invalid or incompatible with the TRC20 network. Please verify your address and try again.'}
            </p>
          </div>
        </div>
      </div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 15px;">✓ Funds Refunded to Your Account</p>
        <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">
          The full amount has been credited back to your wallet. You can request a new withdrawal anytime.
        </p>
      </div>
      
      <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📋 How to Submit a Valid Request</h3>
        <ol style="margin: 0; padding-left: 20px; color: #1e40af; line-height: 2; font-size: 14px;">
          <li><strong>Verify</strong> your wallet address is correct and supports TRC20 (TRON) network</li>
          <li><strong>Double-check</strong> the address format - it should start with "T" and be 34 characters long</li>
          <li><strong>Test</strong> with a small amount first if you're using this address for the first time</li>
          <li><strong>Submit</strong> a new withdrawal request with the verified address</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/withdraw" class="button">
          Request New Withdrawal
        </a>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
          <strong style="color: #334155;">Need Help?</strong> If you're unsure about your wallet address, 
          contact our support team at <a href="mailto:support@stakesvault.com" class="footer-link">support@stakesvault.com</a>
        </p>
      </div>
    `
  }),

  stake_started: (data: any) => ({
    subject: "Staking Activated - Your Investment is Now Growing",
    title: "Stake Activated",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        Congratulations! Your staking plan has been successfully activated. Your funds are now locked and will earn 
        <strong>1% daily compounding returns</strong> throughout the lock period.
      </p>
      
      <div class="amount-highlight" style="color: #8b5cf6;">$${data.amount} USDT</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 15px;">✓ Staking Successfully Activated</p>
        <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">
          Your daily rewards will be automatically compounded and added to your stake balance.
        </p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Stake ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.stakeId}</td>
        </tr>
        <tr>
          <td class="info-label">Amount Staked</td>
          <td class="info-value" style="color: #8b5cf6; font-weight: 700;">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Lock Period</td>
          <td class="info-value">${data.lockPeriod} Days</td>
        </tr>
        <tr>
          <td class="info-label">Daily Return</td>
          <td class="info-value" style="color: #10b981;">1% (Compounding)</td>
        </tr>
        <tr>
          <td class="info-label">Start Date</td>
          <td class="info-value">${new Date(data.startDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          })}</td>
        </tr>
        <tr>
          <td class="info-label">Unlock Date</td>
          <td class="info-value" style="color: #8b5cf6; font-weight: 600;">${new Date(data.unlockDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          })}</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value">
            <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">LOCKED</span>
          </td>
        </tr>
      </table>
      
      <div style="background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="color: #0369a1; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📊 Expected Returns</h3>
        <p style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.8;">
          With <strong>1% daily compounding</strong>, your ${data.amount} USDT stake will grow to approximately 
          <strong style="color: #8b5cf6;">$${(data.amount * Math.pow(1.01, data.lockPeriod)).toFixed(2)} USDT</strong> 
          by the end of the ${data.lockPeriod}-day period.
        </p>
      </div>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong>⏰ Important:</strong> Your funds will remain locked until ${new Date(data.unlockDate).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
          })}. 
          You'll receive an email notification when your stake is unlocked and ready for withdrawal.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/stakes" class="button">
          View Your Stakes
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin-top: 32px;">
        Thank you for staking with STAKES VAULT. Your daily rewards will be automatically calculated and compounded!
      </p>
    `
  }),

  stake_unlocked: (data: any) => ({
    subject: "Stake Unlocked - Withdrawal Now Available",
    title: "Stake Unlocked",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        Great news! Your ${data.lockPeriod}-day staking period has been completed. Your stake is now unlocked and 
        available for withdrawal.
      </p>
      
      <div class="amount-highlight" style="color: #10b981;">$${data.finalAmount} USDT</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 15px;">✓ Staking Period Completed</p>
        <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">
          Your funds are now unlocked and ready for withdrawal. You have 48 hours to withdraw before auto re-lock.
        </p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Stake ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.stakeId}</td>
        </tr>
        <tr>
          <td class="info-label">Original Amount</td>
          <td class="info-value">$${data.originalAmount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Total Profit Earned</td>
          <td class="info-value" style="color: #10b981; font-weight: 700;">+$${data.totalProfit} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Final Amount</td>
          <td class="info-value" style="color: #10b981; font-size: 16px; font-weight: 700;">$${data.finalAmount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Lock Period</td>
          <td class="info-value">${data.lockPeriod} Days</td>
        </tr>
        <tr>
          <td class="info-label">Cycle</td>
          <td class="info-value">Cycle #${data.cycle}</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value">
            <span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">UNLOCKED</span>
          </td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/stakes" class="button">
          Withdraw Now
        </a>
      </div>
      
      <div class="alert-box" style="background: #fef3c7; border-left-color: #f59e0b;">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong>⏰ Auto Re-Lock Notice:</strong> If you don't withdraw within <strong>48 hours</strong>, 
          your stake will be automatically re-locked for another ${data.lockPeriod}-day period to continue earning rewards.
        </p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
          <strong style="color: #334155;">Want to continue earning?</strong> Simply leave your funds staked 
          and they will automatically re-lock after 48 hours with the same ${data.lockPeriod}-day plan.
        </p>
      </div>
    `
  }),

  stake_withdrawal_completed: (data: any) => ({
    subject: "Stake Withdrawal Completed - Funds Transferred",
    title: "Withdrawal Completed",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        Your stake withdrawal has been successfully processed. The funds have been transferred to your wallet 
        and your stake has been automatically re-locked for the next cycle.
      </p>
      
      <div class="amount-highlight" style="color: #10b981;">$${data.amount} USDT</div>
      
      <div class="success-box">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 15px;">✓ Withdrawal Successful</p>
        <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">
          Funds transferred to your wallet. New wallet balance: <strong>$${data.newWalletBalance} USDT</strong>
        </p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Stake ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.stakeId}</td>
        </tr>
        <tr>
          <td class="info-label">Withdrawn Amount</td>
          <td class="info-value" style="color: #10b981; font-weight: 700;">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">New Wallet Balance</td>
          <td class="info-value" style="color: #10b981; font-size: 16px;">$${data.newWalletBalance} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Remaining Stake</td>
          <td class="info-value" style="color: #8b5cf6;">$${data.remainingStake} USDT</td>
        </tr>
        <tr>
          <td class="info-label">Withdrawal Date</td>
          <td class="info-value">${new Date(data.date).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
      
      <div class="success-box" style="background: #ede9fe; border-left-color: #8b5cf6;">
        <p style="margin: 0; color: #5b21b6; font-weight: 600; font-size: 15px;">🔄 Stake Automatically Re-Locked</p>
        <p style="margin: 8px 0 0 0; color: #6d28d9; font-size: 14px;">
          Your remaining stake of <strong>$${data.remainingStake} USDT</strong> has been re-locked for 
          another ${data.lockPeriod}-day period (Cycle #${data.newCycle}). Daily rewards will continue!
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">
          View Dashboard
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin-top: 32px;">
        Thank you for continuing to stake with STAKES VAULT!
      </p>
    `
  }),

  stake_relocked: (data: any) => ({
    subject: "Stake Automatically Re-Locked - New Cycle Started",
    title: "Stake Re-Locked",
    content: `
      <p style="font-size: 16px; margin-bottom: 20px; color: #334155;">Dear <strong>${data.name}</strong>,</p>
      
      <p style="color: #475569; line-height: 1.8; margin-bottom: 24px;">
        Your stake has been automatically re-locked for another ${data.lockPeriod}-day period as you did not 
        withdraw within the 48-hour window. Your daily rewards will continue to compound!
      </p>
      
      <div class="amount-highlight" style="color: #8b5cf6;">$${data.amount} USDT</div>
      
      <div class="success-box" style="background: #ede9fe; border-left-color: #8b5cf6;">
        <p style="margin: 0; color: #5b21b6; font-weight: 600; font-size: 15px;">🔄 Stake Re-Locked Successfully</p>
        <p style="margin: 8px 0 0 0; color: #6d28d9; font-size: 14px;">
          Your stake is now locked for Cycle #${data.newCycle}. Daily 1% compounding continues!
        </p>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Stake ID</td>
          <td class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">#${data.stakeId}</td>
        </tr>
        <tr>
          <td class="info-label">Current Amount</td>
          <td class="info-value" style="color: #8b5cf6; font-weight: 700;">$${data.amount} USDT</td>
        </tr>
        <tr>
          <td class="info-label">New Lock Period</td>
          <td class="info-value">${data.lockPeriod} Days</td>
        </tr>
        <tr>
          <td class="info-label">Cycle</td>
          <td class="info-value">Cycle #${data.newCycle}</td>
        </tr>
        <tr>
          <td class="info-label">Daily Return</td>
          <td class="info-value" style="color: #10b981;">1% (Compounding)</td>
        </tr>
        <tr>
          <td class="info-label">New Start Date</td>
          <td class="info-value">${new Date(data.newStartDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          })}</td>
        </tr>
        <tr>
          <td class="info-label">New Unlock Date</td>
          <td class="info-value" style="color: #8b5cf6; font-weight: 600;">${new Date(data.newUnlockDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          })}</td>
        </tr>
        <tr>
          <td class="info-label">Status</td>
          <td class="info-value">
            <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">LOCKED</span>
          </td>
        </tr>
      </table>
      
      <div style="background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 12px; padding: 24px; margin: 32px 0;">
        <h3 style="color: #0369a1; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📈 Continuous Growth</h3>
        <p style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.8;">
          Your stake continues to grow with <strong>1% daily compounding</strong>. The longer you keep your funds staked, 
          the more you earn through the power of compound interest!
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/stakes" class="button">
          View Stake Details
        </a>
      </div>

      <div class="alert-box" style="background: #dbeafe; border-left-color: #3b82f6;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
          <strong>💡 Reminder:</strong> You'll be notified again when this cycle completes in ${data.lockPeriod} days. 
          You'll have another 48-hour window to withdraw if desired.
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin-top: 32px;">
        Thank you for your continued trust in STAKES VAULT!
      </p>
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
};