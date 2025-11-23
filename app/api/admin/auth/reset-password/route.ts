import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Admin from "@/lib/models/admin";

export async function POST(req: Request) {
  await connectDB();

  const { email, otp, newPassword } = await req.json();

  const admin = await Admin.findOne({ email });

  if (!admin)
    return NextResponse.json({ message: "Admin not found" }, { status: 404 });

  if (admin.resetOTP !== otp)
    return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });

  if (admin.resetOTPExpire < Date.now())
    return NextResponse.json({ message: "OTP expired" }, { status: 400 });

  admin.password = newPassword;
  admin.resetOTP = null;
  admin.resetOTPExpire = null;

  await admin.save();

  return NextResponse.json({ message: "Password reset successfully" });
}
