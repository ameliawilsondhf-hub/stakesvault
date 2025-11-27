import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send Password Reset Email
 * Automatically uses correct domain based on environment
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'StakeVault <noreply@stakesvault.com>',
      to: [email],
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
    });

    if (error) {
      console.error("❌ Resend error:", error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    console.log("✅ Password reset email sent via Resend to:", email);
    console.log("📨 Email ID:", data?.id);
    
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to send password reset email:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Send OTP Email (if needed separately)
 * Can be used for email verification
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  userName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'StakeVault <noreply@stakesvault.com>',
      to: [email],
      subject: "🔐 Email Verification - OTP Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background-color: #f4f4f4; 
              padding: 20px; 
              margin: 0; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            .header { 
              text-align: center; 
              padding-bottom: 20px; 
              border-bottom: 2px solid #8b5cf6; 
            }
            .header h1 { 
              color: #8b5cf6; 
              margin: 0; 
            }
            .content { 
              padding: 30px 0; 
              text-align: center; 
            }
            .otp-box { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              font-size: 32px; 
              font-weight: bold; 
              padding: 20px; 
              border-radius: 10px; 
              letter-spacing: 8px; 
              margin: 20px 0; 
            }
            .info { 
              color: #666; 
              font-size: 14px; 
              margin-top: 20px; 
            }
            .footer { 
              text-align: center; 
              padding-top: 20px; 
              border-top: 1px solid #eee; 
              color: #999; 
              font-size: 12px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
              <p style="color: #666;">Please use the following OTP to verify your email address:</p>
              <div class="otp-box">${otp}</div>
              <p class="info">⏰ This code will expire in <strong>10 minutes</strong></p>
              <p class="info">If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} StakeVault. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    console.log("✅ OTP email sent via Resend to:", email);
    console.log("📨 Email ID:", data?.id);
    
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to send OTP email:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}