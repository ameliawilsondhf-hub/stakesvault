import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTransactionEmail(
  userEmail: string,
  type: 'deposit' | 'withdrawal' | 'profit',
  amount: number
) {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev', // ✅ CHANGED - Testing ke liye
      to: userEmail,
      subject: `${type.toUpperCase()} Confirmed - StakeVault`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Transaction Successful</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px;">✓ Confirmed</h2>
            </div>
            
            <div style="margin: 20px 0;">
              <p style="margin: 10px 0; font-size: 16px; color: #374151;">
                <strong style="color: #1f2937;">Transaction Type:</strong> 
                <span style="color: #10b981; text-transform: uppercase; font-weight: bold;">${type}</span>
              </p>
              <p style="margin: 10px 0; font-size: 16px; color: #374151;">
                <strong style="color: #1f2937;">Amount:</strong> 
                <span style="color: #10b981; font-size: 20px; font-weight: bold;">$${amount.toFixed(2)}</span>
              </p>
              <p style="margin: 10px 0; font-size: 16px; color: #374151;">
                <strong style="color: #1f2937;">Date:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                Your transaction has been processed successfully and will reflect in your account shortly.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://stakesvault.com/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; 
                        font-weight: bold;">
                View Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 StakeVault. All rights reserved.</p>
            <p>If you have any questions, contact us at support@stakesvault.com</p>
          </div>
        </div>
      `
    });

    console.log('✅ Email sent successfully:', result);
    return result;

  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}