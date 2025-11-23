import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name, email, password, referral } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }

    // Generate unique referral code
    const referralCode = `REF${Math.floor(100000 + Math.random() * 900000)}`;

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashed,
      referral,        // Upline referral code
      referralCode,    // new generated code
    });

    //-----------------------------------------
    //            REFERRAL LEVEL SYSTEM
    //-----------------------------------------
    if (referral) {
      const level1User = await User.findOne({ referralCode: referral });

      if (level1User) {
        // LEVEL 1 USER
        level1User.level1.push(newUser._id);
        level1User.referralCount += 1;
        await level1User.save();

        // LEVEL 2
        if (level1User.referral) {
          const level2User = await User.findOne({
            referralCode: level1User.referral,
          });

          if (level2User) {
            level2User.level2.push(newUser._id);
            await level2User.save();

            // LEVEL 3
            if (level2User.referral) {
              const level3User = await User.findOne({
                referralCode: level2User.referral,
              });

              if (level3User) {
                level3User.level3.push(newUser._id);
                await level3User.save();
              }
            }
          }
        }
      }
    }

    //-----------------------------------------
    //  RETURN NEW USER + REFERRAL CODE
    //-----------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          referralCode: newUser.referralCode,  // ⭐ SUPER IMPORTANT
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
