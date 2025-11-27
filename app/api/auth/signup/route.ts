import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name, email, password, referralCode } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code
    const generateReferralCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    let userReferralCode = generateReferralCode();

    // Ensure referral code is unique
    let codeExists = await User.findOne({ referralCode: userReferralCode });
    while (codeExists) {
      userReferralCode = generateReferralCode();
      codeExists = await User.findOne({ referralCode: userReferralCode });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      referralCode: userReferralCode,
      referredBy: referralCode || null,
    });

    // Save user
    await newUser.save();

    // If user was referred, update referrer
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await referrer.save();
      }
    }

    // 🎉 Send welcome email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/send-welcome-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          referralCode: newUser.referralCode,
        }),
      });
      console.log("✅ Welcome email sent to:", newUser.email);
    } catch (emailError) {
      console.error("❌ Failed to send welcome email:", emailError);
      // Don't fail signup if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully! Check your email for welcome message.",
      user: {
        name: newUser.name,
        email: newUser.email,
        referralCode: newUser.referralCode,
      },
    });

  } catch (error: any) {
    console.error("❌ Signup error:", error);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again.", error: error.message },
      { status: 500 }
    );
  }
}