import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../lib/models/user";

export async function POST(req: Request) {
  await connectDB();

  const { newUserId, referralCode } = await req.json();

  const newUser = await User.findById(newUserId);
  if (!newUser) return NextResponse.json({ message: "User not found" });

  const inviter = await User.findOne({ referralCode });
  if (!inviter)
    return NextResponse.json({ message: "Inviter not found" });

  // LEVEL 1
  inviter.level1.push(newUser._id);
  inviter.referralCount += 1;
  await inviter.save();

  // LEVEL 2
  if (inviter.referredBy) {
    const level2 = await User.findOne({ referralCode: inviter.referredBy });
    if (level2) {
      level2.level2.push(newUser._id);
      await level2.save();

      // LEVEL 3
      if (level2.referredBy) {
        const level3 = await User.findOne({ referralCode: level2.referredBy });
        if (level3) {
          level3.level3.push(newUser._id);
          await level3.save();
        }
      }
    }
  }

  return NextResponse.json({ message: "Referral levels assigned" });
}
