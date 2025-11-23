import { NextResponse } from 'next/server';
import { sendTransactionEmail } from '@/utils/sendTransactionEmail';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if it's a transaction email test
    if (body.testTransaction) {
      console.log('📧 Testing transaction email...');
      
      const result = await sendTransactionEmail(
        body.to || 'ameliawilsondhf@gmail.com',
        body.type || 'deposit',
        body.amount || 250.00
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction email sent!',
        data: result 
      });
    }
    
    // Generic email (original functionality)
    const { to, subject, message } = body;

    const data = await resend.emails.send({
      from: 'StakeVault <support@stakesvault.com>',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #9333ea;">StakeVault</h1>
          <p>${message}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from StakeVault
          </p>
        </div>
      `
    });
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('❌ Email Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}