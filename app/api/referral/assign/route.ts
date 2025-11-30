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
  const inviter = await User.findOne({ referralCode }); // ✅ FIND UPLINE USER

  if (inviter) {
    newUser.referral = referralCode;        // ✅ Code save
    newUser.referredBy = inviter._id;       // ✅ THIS IS THE MISSING DATA SOURCE
    await newUser.save();

    console.log("✅ referredBy set:", inviter._id.toString());
  } else {
    console.log("❌ Invalid referral code, inviter not found");
  }
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
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ✅ GET: Fetch referral network WITH DETAILS
// ✅ GET: Fetch referral network WITH COMPLETE DETAILS
export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email })
      .select('referralCode referralEarnings levelIncome referralCount level1 level2 level3')
      .populate("level1", "name email createdAt walletBalance totalDeposits stakedBalance")
      .populate("level2", "name email createdAt walletBalance totalDeposits stakedBalance")
      .populate("level3", "name email createdAt walletBalance totalDeposits stakedBalance");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ✅ Calculate totals for each level
    const calculateLevelStats = (users: any[]) => {
      const totalDeposits = users.reduce((sum, u) => sum + (u.totalDeposits || 0), 0);
      const totalStaked = users.reduce((sum, u) => sum + (u.stakedBalance || 0), 0);
      return { totalDeposits, totalStaked };
    };

    const level1Stats = calculateLevelStats(user.level1 || []);
    const level2Stats = calculateLevelStats(user.level2 || []);
    const level3Stats = calculateLevelStats(user.level3 || []);

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings || 0,
        levelIncome: user.levelIncome || 0,
        referralCount: user.referralCount || 0,
        level1: {
          count: (user.level1 || []).length,
          users: user.level1 || [],
          totalDeposits: level1Stats.totalDeposits,
          totalStaked: level1Stats.totalStaked,
        },
        level2: {
          count: (user.level2 || []).length,
          users: user.level2 || [],
          totalDeposits: level2Stats.totalDeposits,
          totalStaked: level2Stats.totalStaked,
        },
        level3: {
          count: (user.level3 || []).length,
          users: user.level3 || [],
          totalDeposits: level3Stats.totalDeposits,
          totalStaked: level3Stats.totalStaked,
        },
      },
    });

  } catch (err) {
    console.error("Referral Fetch Error:", err);
    return NextResponse.json(
      { message: "Server error fetching referral network" },
      { status: 500 }
    );
  }
}