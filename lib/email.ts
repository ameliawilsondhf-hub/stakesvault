import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "StakeVault Support <noreply@stakevault.com>",
    to: email,
    subject: "🔒 Password Reset Request - StakeVault",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .logo {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .content {
            padding: 40px 30px;
            color: #333;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);
          }
          .button:hover {
            box-shadow: 0 6px 8px rgba(102, 126, 234, 0.6);
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #856404;
          }
          .security-note {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #0d47a1;
          }
          .divider {
            height: 1px;
            background: #e0e0e0;
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔒</div>
            <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 10px;">Hi <strong>${userName}</strong>,</p>
            
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset the password for your <strong>StakeVault</strong> account. 
              If you made this request, click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Your Password</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                <li>This link will <strong>expire in 1 hour</strong> for security reasons</li>
                <li>If you didn't request this reset, <strong>please ignore</strong> this email</li>
                <li>Your password will remain unchanged until you set a new one</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <div class="security-note">
              <strong>🛡️ Security Tip:</strong> Always use a strong, unique password that includes uppercase letters, 
              lowercase letters, numbers, and special characters.
            </div>
            
            <div class="divider"></div>
            
            <p style="color: #666; font-size: 13px; line-height: 1.6;">
              <strong>Having trouble with the button?</strong> Copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; color: #667eea;">
              ${resetUrl}
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0; font-weight: bold;">
              © ${new Date().getFullYear()} StakeVault. All rights reserved.
            </p>
            <p style="margin: 0 0 15px 0; color: #e74c3c; font-weight: bold;">
              ⚠️ This is an automated email. Please do not reply to this address.
            </p>
            <p style="margin: 0; color: #888;">
              Need help? Contact us at: 
              <a href="mailto:support@stakevault.com" style="color: #667eea; text-decoration: none;">support@stakevault.com</a>
            </p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 5px 0; font-size: 11px; color: #999;">
                StakeVault - Automated Staking & Smart Investment Platform
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent successfully to:", email);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to send email:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}