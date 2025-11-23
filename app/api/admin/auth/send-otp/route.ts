import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Admin from "@/lib/models/admin";

export async function POST(req: Request) {
  await connectDB();

  const { email } = await req.json();
  const admin = await Admin.findOne({ email });

  if (!admin)
    return NextResponse.json({ message: "Admin email not found" }, { status: 404 });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  admin.resetOTP = otp;
  admin.resetOTPExpire = Date.now() + 10 * 60 * 1000; // 10 mins

  await admin.save();

  console.log("OTP SENT:", otp); // You can replace with email API

  return NextResponse.json({ message: "OTP sent" });
}
