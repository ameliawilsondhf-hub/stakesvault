import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  try {
    const data = await resend.emails.send({
      from: "StakeVault <support@stakesvault.com>",   // ✔ Branding + authenticated domain
      replyTo: "support@stakesvault.com",             // ✔ Correct camelCase
      to: userEmail,
      subject: "🎉 Welcome to StakeVault!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h1 style="color:#9333ea;">Welcome to StakeVault 🎉</h1>

          <p>Hi ${userName},</p>
          <p>We’re excited to have you at StakeVault. Start earning <strong>1.8% daily profit</strong> instantly.</p>

          <div style="background:#1f1f1f; padding:20px; border-radius:10px; margin:20px 0;">
            <h2 style="color:#10b981; margin: 0;">🔥 Your Staking Benefits</h2>
            <p style="color:#ccc;">• 1.8% daily reward<br>• Automatic crediting<br>• Zero risk, secure vault</p>
          </div>

          <a href="https://stakesvault.com/dashboard"
            style="display:inline-block; padding:12px 24px;
            background:#9333ea; color:white; text-decoration:none;
            border-radius:8px; font-weight:bold;">
            Open Dashboard
          </a>

          <p style="font-size:12px; margin-top:30px; color:#6b7280;">
            Need help? Contact us at 
            <a href="mailto:support@stakesvault.com" style="color:#9333ea;">
              support@stakesvault.com
            </a>
          </p>
        </div>
      `,
    });

    console.log("Welcome Email Sent:", data);
    return { success: true, data };

  } catch (error: any) {
    console.error("Welcome Email Error:", error);
    return { success: false, error };
  }
}
