import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, name, otp } = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"StakeVault Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Admin Login Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-center; }
            .header h1 { color: white; margin: 0; }
            .content { padding: 40px; }
            .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { background: #f8f9fa; padding: 20px; text-center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Admin Verification</h1>
            </div>
            <div class="content">
              <h2>Hello ${name || "Admin"},</h2>
              <p>You've requested to login to the Admin Portal. Please use the verification code below:</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 10 minutes</p>
              </div>

              <p><strong>Security Tips:</strong></p>
              <ul style="color: #666;">
                <li>Never share this code with anyone</li>
                <li>StakeVault staff will never ask for this code</li>
                <li>If you didn't request this, please secure your account immediately</li>
              </ul>

              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                This is an automated security email. Please do not reply.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} StakeVault. All rights reserved.</p>
              <p>Secure Admin Authentication System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}