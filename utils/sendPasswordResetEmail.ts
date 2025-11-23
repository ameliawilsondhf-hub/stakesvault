// utils/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// 🌟 Reusable HTML Layout
function emailLayout(title: string, content: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto; padding: 20px; background-color:#f9fafb;">
      
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                  padding: 30px; border-radius: 10px 10px 0 0; text-align:center;">
          <h1 style="color: white; margin: 0; font-size: 26px;">
              ${title}
          </h1>
      </div>

      <div style="background:#fff; padding:30px; border-radius:0 0 10px 10px;">
        ${content}
      </div>

      <div style="text-align:center; margin-top:20px; color:#9ca3af; font-size:12px;">
        <p>© ${new Date().getFullYear()} StakeVault. All rights reserved.</p>
        <p>Need help? Contact: 
            <a href="mailto:support@stakesvault.com" style="color:#9333ea;">
              support@stakesvault.com
            </a>
        </p>
      </div>
    </div>
  `;
}


// ======================================================================
// 1️⃣ SEND PASSWORD RESET EMAIL
// ======================================================================
export async function sendPasswordResetEmail(userEmail: string, resetToken: string) {
  const resetLink = `https://stakesvault.com/reset-password?token=${resetToken}`;

  const content = `
      <p style="font-size:15px; color:#374151;">
         We received a request to reset your StakeVault account password.
      </p>

      <p style="font-size:15px; color:#374151;">
        Click the button below to create a new password:
      </p>

      <div style="text-align:center; margin:35px 0;">
        <a href="${resetLink}"
           style="display:inline-block; background:linear-gradient(135deg,#dc2626,#991b1b);
                  color:white; padding:14px 35px; border-radius:8px; text-decoration:none; 
                  font-weight:bold; font-size:16px;">
          Reset Password
        </a>
      </div>

      <div style="background:#fef2f2; border-left:4px solid #dc2626; padding:15px; border-radius:6px;">
          <p style="margin:0; color:#991b1b; font-size:14px;">
            <strong>⚠️ Security Notice:</strong><br>
            • This link expires in <strong>1 hour</strong><br>
            • Ignore this email if you didn’t request it<br>
            • Your password will not change until you click the button
          </p>
      </div>

      <p style="color:#6b7280; font-size:13px; margin-top:25px;">
         <strong>Or copy this link:</strong><br>
         <a href="${resetLink}" style="color:#9333ea; word-break:break-all;">
           ${resetLink}
         </a>
      </p>
  `;

  try {
    const res = await resend.emails.send({
      from: "StakeVault <support@stakesvault.com>",   // ⭐ Best Format
      to: userEmail,
      subject: "Reset Your Password – StakeVault",
      html: emailLayout("🔐 Password Reset Request", content),
    });

    console.log("✅ Password reset email sent:", res);
    return { success: true, res };

  } catch (err: any) {
    console.error("❌ Email Send Error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}
