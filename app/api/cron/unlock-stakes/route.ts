import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Stake from "@/lib/models/stake";
import User from "@/lib/models/user";
import { emailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    console.log("🔓 Starting unlock checker...");

    const now = new Date();

    // Find all locked stakes where unlock date has passed
    const stakesToUnlock = await Stake.find({
      status: "locked",
      unlockDate: { $lte: now }
    });

    console.log(`📊 Found ${stakesToUnlock.length} stakes ready to unlock`);

    let unlockedCount = 0;

    for (const stake of stakesToUnlock) {
      // Unlock the stake using helper method
      stake.unlock();
      
      await stake.save();

      // Get user for email
      const user = await User.findById(stake.userId);

      if (user) {
        // Send unlock email
        try {
          await emailService.sendStakeUnlocked(
            user.email,
            user.name || user.email,
            stake.originalAmount,
            stake.currentAmount,
            stake.totalProfit,
            stake.lockPeriod,
            stake.cycle,
            stake._id.toString()
          );
          console.log(`📧 Unlock email sent to ${user.email} for stake ${stake._id}`);
        } catch (emailError) {
          console.error("❌ Email sending failed:", emailError);
          // Don't fail the unlock if email fails
        }
      }

      unlockedCount++;
      console.log(`✅ Unlocked stake ${stake._id} (User: ${stake.userId})`);
      console.log(`   Amount: $${stake.currentAmount} | Auto re-lock at: ${stake.autoRelockAt}`);
    }

    console.log("✅ Unlock checker completed");
    console.log(`🔓 Unlocked: ${unlockedCount} stakes`);

    return NextResponse.json({
      success: true,
      message: "Unlock checker completed",
      data: {
        totalChecked: stakesToUnlock.length,
        unlocked: unlockedCount,
        timestamp: new Date()
      }
    });

  } catch (error: any) {
    console.error("❌ Unlock Checker Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message
      },
      { status: 500 }
    );
  }
}