import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/user"; // ✅ IUser import kiya for typing

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// APY calculator
function calculateAPY(lockPeriod: number): number {
    const apy = (Math.pow(1.01, lockPeriod) - 1) * 100;
    return parseFloat(apy.toFixed(2));
}

export async function GET(req: Request) {
    try {
        // 🔒 Security: Check for authorization header (optional but recommended)
        const authHeader = req.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET || "your-secret-key";
        
        // Uncomment this in production:
        // if (authHeader !== `Bearer ${cronSecret}`) {
        //   return NextResponse.json(
        //     { success: false, message: "Unauthorized" },
        //     { status: 401 }
        //   );
        // }

        await connectDB();

        console.log("🔄 Starting auto-invest cron job...");

        // Find all users with auto-invest enabled
        const users = await User.find({
            autoInvestEnabled: true,
            "autoInvestSettings.enabled": true,
        }) as IUser[]; // Type assertion for the array of users

        console.log(`📊 Found ${users.length} users with auto-invest enabled`);

        let processedCount = 0;
        let errorCount = 0;
        const now = new Date();

        for (const user of users) {
            try {
                // Find unlocked stakes
                const unlockedStakes = user.stakes?.filter(
                    (stake) =>
                        stake.status === "active" &&
                        new Date(stake.unlockDate) <= now
                ) || [];

                if (unlockedStakes.length === 0) {
                    continue;
                }

                console.log(`👤 User ${user._id}: Found ${unlockedStakes.length} unlocked stakes`);

                for (const stake of unlockedStakes) {
                    // Check minimum amount threshold
                    const minAmount = user.autoInvestSettings?.minAmount || 100;
                    
                    if (stake.amount < minAmount) {
                        console.log(`⚠️ Stake amount $${stake.amount} is below minimum $${minAmount}, skipping`);
                        
                        // Just mark as completed, don't reinvest
                        stake.status = "completed" as const; // Added 'as const'
                        continue;
                    }

                    // Calculate final amount (original + rewards if any)
                    const finalAmount = stake.amount + (stake.earnedRewards || 0);

                    // Check if user has enough balance (should be in staked balance)
                    // Note: This check might be redundant if the logic assumes the money is still linked to the old stake
                    if (user.stakedBalance < finalAmount) {
                        console.log(`⚠️ Insufficient staked balance for reinvestment`);
                        stake.status = "completed" as const;
                        continue;
                    }

                    // Get lock period from settings
                    const lockPeriod = user.autoInvestSettings?.lockPeriod || 30;

                    // Create new stake
                    const unlockDate = new Date();
                    unlockDate.setDate(unlockDate.getDate() + lockPeriod);

                    const newStake = {
                        amount: finalAmount,
                        stakedAt: new Date(),
                        unlockDate: unlockDate,
                        lockPeriod: lockPeriod,
                        // Fix: status must match IStake enum
                        status: "active" as const, 
                        apy: calculateAPY(lockPeriod),
                        earnedRewards: 0,
                        // Agar aap cycle use karte hain, toh isko add karein:
                        // cycle: (stake as any).cycle, 
                    };

                    // Add new stake
                    // ⭐ FIX: Use Mongoose array push method with type assertion to remove the error
                    (user.stakes as any).push(newStake);

                    // Mark old stake as completed
                    stake.status = "completed" as const;

                    console.log(`✅ Auto-invested $${finalAmount} for ${lockPeriod} days (APY: ${newStake.apy}%)`);
                    processedCount++;
                }

                // Save user
                // user.save() will now track the array changes because of the push fix.
                await user.save();

            } catch (error: any) {
                console.error(`❌ Error processing user ${user._id}:`, error.message);
                errorCount++;
            }
        }

        const summary = {
            success: true,
            message: "Auto-invest cron job completed",
            stats: {
                totalUsers: users.length,
                stakesProcessed: processedCount,
                errors: errorCount,
                timestamp: new Date().toISOString(),
            },
        };

        console.log("📊 Cron job summary:", summary);

        return NextResponse.json(summary);

    } catch (error: any) {
        console.error("❌ Auto-invest cron error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Cron job failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
