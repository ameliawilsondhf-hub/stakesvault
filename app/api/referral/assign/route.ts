import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../lib/models/user";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { newUserId, referralCode } = await req.json();

    // Get new user
    const newUser = await User.findById(newUserId);
    if (!newUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ************************************************
    // 🔥 NEW ADDITION: Save the inviter's code to the new user.
    // Isse naye user ko pata hoga ki usne kiski link se join kiya.
    // ************************************************
    if (referralCode) {
        newUser.referral = referralCode; 
        await newUser.save(); 
    }
    
    // Check if the user was invited by someone
    if (!referralCode) {
        return NextResponse.json({ message: "User registered without referral code." });
    }

    // LEVEL 1 --- Direct Inviter
    const inviter = await User.findOne({ referralCode });
    if (!inviter) {
      return NextResponse.json({ message: "Inviter not found" }, { status: 404 });
    }

    inviter.level1.push(newUser._id);
    inviter.referralCount = (inviter.referralCount || 0) + 1; // Safety check
    await inviter.save();

    // LEVEL 2
    let level2 = null;
    if (inviter.referral) {
      level2 = await User.findOne({ referralCode: inviter.referral });

      if (level2) {
        level2.level2.push(newUser._id);
        await level2.save();
      }
    }

    // LEVEL 3
    if (level2 && level2.referral) {
      const level3 = await User.findOne({
        referralCode: level2.referral,
      });

      if (level3) {
        level3.level3.push(newUser._id);
        await level3.save();
      }
    }

    return NextResponse.json({
      message: "Referral levels assigned successfully",
    });

  } catch (error) {
    console.log("REFERRAL ASSIGN ERROR:", error);
    return NextResponse.json(
      { message: "Server error during referral assignment" },
      { status: 500 }
    );
  }
}