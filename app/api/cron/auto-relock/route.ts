import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Stake from "@/lib/models/stake";
import User from "@/lib/models/user";
import { emailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    console.log("🔄 Starting auto re-lock checker...");

    const now = new Date();

    // Find all unlocked stakes where:
    // 1. autoRelock is enabled
    // 2. autoRelockAt time has passed
    const stakesToRelock = await Stake.find({
      status: "unlocked",
      autoRelock: true,
      autoRelockAt: { $lte: now }
    });

    console.log(`📊 Found ${stakesToRelock.length} stakes ready to auto re-lock`);

    let relockedCount = 0;

    for (const stake of stakesToRelock) {
      try {
        // Re-lock the stake using helper method
        stake.relock();
        
        await stake.save();

        // Get user for email
        const user = await User.findById(stake.userId);

        if (user) {
          // Send re-lock email
          try {
            await emailService.sendStakeRelocked(
              user.email,
              user.name || user.email,
              stake.currentAmount,
              stake.lockPeriod,
              stake.cycle,
              stake.unlockDate,
              stake._id.toString()
            );
            console.log(`📧 Re-lock email sent to ${user.email} for stake ${stake._id}`);
          } catch (emailError) {
            console.error("❌ Email sending failed:", emailError);
            // Don't fail the re-lock if email fails
          }
        }

        relockedCount++;
        console.log(`✅ Re-locked stake ${stake._id} (User: ${stake.userId})`);
        console.log(`   Cycle: ${stake.cycle} | New unlock: ${stake.unlockDate}`);
      } catch (stakeError) {
        console.error(`❌ Failed to re-lock stake ${stake._id}:`, stakeError);
      }
    }

    console.log("✅ Auto re-lock checker completed");
    console.log(`🔒 Re-locked: ${relockedCount} stakes`);

    return NextResponse.json({
      success: true,
      message: "Auto re-lock checker completed",
      data: {
        totalChecked: stakesToRelock.length,
        relocked: relockedCount,
        timestamp: new Date()
      }
    });

  } catch (error: any) {
    console.error("❌ Auto Re-Lock Checker Error:", error);
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