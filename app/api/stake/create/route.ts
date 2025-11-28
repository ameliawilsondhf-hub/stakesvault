import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/lib/models/user";
import Stake from "@/lib/models/stake";  // ← Try this first
import { emailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';

// APY calculator - Daily 1% Compounding
function calculateAPY(lockPeriod: number): number {
    const apy = (Math.pow(1.01, lockPeriod) - 1) * 100;
    return parseFloat(apy.toFixed(2));
}

export async function POST(req: Request) {
    try {
        await connectDB();

        console.log("🔍 Checking Stake model...");
        console.log("Stake model available:", !!Stake);
        console.log("Stake model name:", Stake?.modelName);

        // 1. Get JWT token from cookie
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        console.log("🔑 Token:", token ? "Found" : "Missing");

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Not logged in" },
                { status: 401 }
            );
        }

        // 2. Verify JWT token
        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET missing in .env");
            return NextResponse.json(
                { success: false, message: "Server configuration error" },
                { status: 500 }
            );
        }

        let userId;
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId || decoded.id;
            console.log("👤 User ID from JWT:", userId);
        } catch (jwtError: any) {
            console.error("❌ JWT Verification Error:", jwtError.message);
            return NextResponse.json(
                { success: false, message: "Invalid token" },
                { status: 401 }
            );
        }

        // 3. Get request body
        const body = await req.json();
        const amount = body.amount;
        const lockPeriod = body.lockPeriod || body.days;

        console.log("💰 Stake amount:", amount);
        console.log("🔒 Lock period:", lockPeriod);

        // 4. Validation
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, message: "Invalid amount" },
                { status: 400 }
            );
        }

        if (!lockPeriod || ![30, 60, 90].includes(parseInt(lockPeriod))) {
            return NextResponse.json(
                { success: false, message: "Invalid lock period. Must be 30, 60, or 90 days." },
                { status: 400 }
            );
        }

        // 5. Find user
        const user = await User.findById(userId) as IUser;
        
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        console.log("💵 Current wallet balance:", user.walletBalance);

        // 6. Check balance
        if (user.walletBalance < amount) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Insufficient wallet balance",
                    available: user.walletBalance,
                    required: amount
                },
                { status: 400 }
            );
        }

        // 7. Calculate dates
        const now = new Date();
        const unlockDate = new Date(now);
        unlockDate.setDate(unlockDate.getDate() + parseInt(lockPeriod));
        const apy = calculateAPY(parseInt(lockPeriod));

        console.log(`📊 Calculated APY for ${lockPeriod} days: ${apy}%`);

        // 8. Create Stake in separate collection
        let newStake;
        try {
            console.log("🔄 Creating stake in Stake collection...");
            
            const stakeData = {
                userId: userId,
                originalAmount: amount,
                currentAmount: amount,
                startDate: now,
                unlockDate: unlockDate,
                lastProfitDate: now,
                lockPeriod: parseInt(lockPeriod),
                status: 'locked',
                totalProfit: 0,
                profitHistory: [],
                cycle: 1,
                autoRelock: true,
                autoRelockAt: null
            };

            console.log("📋 Stake data to create:", stakeData);

            newStake = await Stake.create(stakeData);

            console.log("✅ Stake created in separate collection:", newStake._id);
        } catch (stakeError: any) {
            console.error("❌ STAKE CREATION FAILED:");
            console.error("Error name:", stakeError.name);
            console.error("Error message:", stakeError.message);
            console.error("Error code:", stakeError.code);
            console.error("Error stack:", stakeError.stack);
            
            if (stakeError.errors) {
                console.error("Validation errors:", JSON.stringify(stakeError.errors, null, 2));
            }

            return NextResponse.json(
                { 
                    success: false, 
                    message: "Failed to create stake record",
                    error: stakeError.message,
                    errorName: stakeError.name,
                    validationErrors: stakeError.errors
                },
                { status: 500 }
            );
        }

        // 9. Update user balances
        user.walletBalance -= amount;
        user.stakedBalance = (user.stakedBalance || 0) + amount;

        console.log("✅ Wallet deducted. New balance:", user.walletBalance);
        console.log("✅ Staked balance updated:", user.stakedBalance);

        // 10. Add to user.stakes array (backward compatibility)
        const stakeRecord = {
            amount: amount,
            stakedAt: now,
            unlockDate: unlockDate,
            lockPeriod: parseInt(lockPeriod),
            status: 'active' as const,
            apy: apy,
            earnedRewards: 0
        };

        if (!user.stakes) {
            user.stakes = [];
        }
        
        (user.stakes as any).push(stakeRecord);
        console.log("✅ Stake added to user.stakes array");

        // 11. Save user
        try {
            await user.save();
            console.log("✅ User saved successfully");
        } catch (saveError: any) {
            // Rollback: Delete the stake
            await Stake.findByIdAndDelete(newStake._id);
            console.error("❌ User save failed, stake rolled back");
            
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Failed to update user balance",
                    error: saveError.message
                },
                { status: 500 }
            );
        }

        // 12. Send email notification
        try {
            await emailService.sendStakeStarted(
                user.email,
                user.name || user.email,
                amount,
                parseInt(lockPeriod),
                unlockDate,
                newStake._id.toString()
            );
            console.log(`📧 Stake started email sent to ${user.email}`);
        } catch (emailError) {
            console.error("❌ Email sending failed:", emailError);
            // Don't fail the stake if email fails
        }

        // 13. Return success
        return NextResponse.json({
            success: true,
            message: "Staking successful! You will receive a confirmation email shortly.",
            data: {
                stakeId: newStake._id,
                walletBalance: user.walletBalance,
                stakedBalance: user.stakedBalance,
                stake: {
                    amount: newStake.currentAmount,
                    lockPeriod: newStake.lockPeriod,
                    startDate: newStake.startDate,
                    unlockDate: newStake.unlockDate,
                    status: newStake.status,
                    cycle: newStake.cycle,
                    apy: apy
                }
            }
        }, { status: 201 });

    } catch (err: any) {
        console.error("❌ STAKE CREATE ERROR:", err);
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);

        return NextResponse.json(
            { 
                success: false, 
                message: "Server error", 
                error: err.message,
                details: process.env.NODE_ENV === "development" ? err.stack : undefined
            },
            { status: 500 }
        );
    }
}