import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";

// ✅ Add these lines at top
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    // ✅ Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@stakevault.com" });
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: "Admin already exists",
        email: existingAdmin.email 
      }, { status: 200 });
    }

    const hashed = await bcrypt.hash("Admin@StakeVault2025", 10);

    const admin = await User.create({
      name: "Admin",
      email: "admin@stakevault.com",
      password: hashed,
      isAdmin: true, // ✅ Set isAdmin field
      emailVerified: true,
      referralCode: "ADMIN001",
      walletBalance: 0,
      totalDeposits: 0,
      levelIncome: 0,
      referralEarnings: 0,
      referralCount: 0,
      level1: [],
      level2: [],
      level3: []
    });

    return NextResponse.json({ 
      success: true,
      message: "Admin created successfully", 
      admin: {
        email: admin.email,
        name: admin.name
      }
    });

  } catch (error: any) {
    console.error("❌ Create admin error:", error);
    return NextResponse.json({ 
      success: false,
      message: "Failed to create admin",
      error: error.message 
    }, { status: 500 });
  }
}