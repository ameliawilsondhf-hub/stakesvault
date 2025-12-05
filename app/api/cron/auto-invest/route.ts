import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/user";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ✅ FIXED: Simple Interest Calculator
function calculateTotalReturn(lockPeriod: number): number {
    // Simple Interest: 1% per day × number of days
    const totalReturn = lockPeriod * 1.0;
    return parseFloat(totalReturn.toFixed(2));
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

        console.log("🔄 Starting auto-invest cron job (SIMPLE INTEREST)...");

        // Find all users with auto-invest enabled
        const users = await User.find({
            autoInvestEnabled: true,
            "autoInvestSettings.enabled": true,
        }) as IUser[];

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
                        stake.status = "completed" as const;
                        continue;
                    }

                    // Calculate final amount (original + rewards if any)
                    const finalAmount = stake.amount + (stake.earnedRewards || 0);

                    // Check if user has enough balance (should be in staked balance)
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

                    // ✅ Calculate simple interest return
                    const totalReturn = calculateTotalReturn(lockPeriod);

                    const newStake = {
                        amount: finalAmount,
                        stakedAt: new Date(),
                        unlockDate: unlockDate,
                        lockPeriod: lockPeriod,
                        status: "active" as const, 
                        apy: totalReturn, // ✅ Using simple interest total return
                        earnedRewards: 0,
                    };

                    // Add new stake
                    (user.stakes as any).push(newStake);

                    // Mark old stake as completed
                    stake.status = "completed" as const;

                    console.log(`✅ Auto-invested $${finalAmount} for ${lockPeriod} days (Total Return: ${totalReturn}%)`);
                    processedCount++;
                }

                // Save user
                await user.save();

            } catch (error: any) {
                console.error(`❌ Error processing user ${user._id}:`, error.message);
                errorCount++;
            }
        }

        const summary = {
            success: true,
            message: "Auto-invest cron job completed (SIMPLE INTEREST)",
            stats: {
                totalUsers: users.length,
                stakesProcessed: processedCount,
                errors: errorCount,
                timestamp: new Date().toISOString(),
                interestType: "simple" // ✅ Indicate simple interest
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