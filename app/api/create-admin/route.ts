import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";

export async function GET() {
  await connectDB();

  const hashed = await bcrypt.hash("Admin@StakeVault2025", 10);

  const admin = await User.create({
    name: "Admin",
    email: "admin@stakevault.com",
    password: hashed,
    role: "admin"
  });

  return NextResponse.json({ message: "Admin created successfully", admin });
}
