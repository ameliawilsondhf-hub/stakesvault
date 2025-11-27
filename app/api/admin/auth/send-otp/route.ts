import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Admin from "@/lib/models/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email } = await req.json();
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.resetOTP = otp;
    admin.resetOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    // SEND EMAIL USING RESEND
    await resend.emails.send({
      from: "StakeVault Admin <no-reply@stakesvault.com>",
      to: email,
      subject: "Admin Login OTP",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Admin Login Verification</h2>
          <p>Your OTP:</p>
          <h1>${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "OTP Sent Successfully" });

  } catch (error: any) {
    console.error("OTP ERROR:", error);
    return NextResponse.json({ message: "Error Occurred", error }, { status: 500 });
  }
}
