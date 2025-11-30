import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/lib/models/user";
import Stake from "@/lib/models/stake";
import { emailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // ✅ Add this

// APY calculator - Daily 1% Compounding
function calculateAPY(lockPeriod: number): number {
    const apy = (Math.pow(1.01, lockPeriod) - 1) * 100;
    return parseFloat(apy.toFixed(2));
}

export async function POST(req: Request) {
  // ... rest of your code stays same

    try {
        await connectDB();

        console.log("\n" + "=".repeat(60));
        console.log("🚀 STAKE CREATE REQUEST");
        console.log("=".repeat(60));

        // ============================================
        // 1. AUTHENTICATION - Multiple Methods
        // ============================================
        let userId = null;
        let userEmail = null;

        // Method 1: Try NextAuth session
        try {
            const session = await getServerSession(authOptions);
            if (session?.user?.email) {
                const sessionUser = await User.findOne({ email: session.user.email }).select('_id email');
                if (sessionUser) {
                    userId = sessionUser._id;
                    userEmail = sessionUser.email;
                    console.log("✅ Auth via NextAuth Session");
                    console.log("   User ID:", userId);
                    console.log("   Email:", userEmail);
                }
            }
        } catch (sessionError) {
            console.log("⚠️ NextAuth session not available");
        }

        // Method 2: Try JWT token from cookie
        if (!userId) {
            try {
                const cookieStore = await cookies();
                const token = cookieStore.get("token")?.value;

                if (token && process.env.JWT_SECRET) {
                    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
                    userId = decoded.userId || decoded.id;
                    console.log("✅ Auth via JWT Token");
                    console.log("   User ID:", userId);
                }
            } catch (jwtError) {
                console.log("⚠️ JWT token not available or invalid");
            }
        }

        // Final check: No auth found
        if (!userId) {
            console.error("❌ Authentication failed - No valid session or token");
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Authentication required. Please login to continue.",
                    hint: "Try logging out and logging in again"
                },
                { status: 401 }
            );
        }

        // ============================================
        // 2. GET REQUEST BODY
        // ============================================
        const body = await req.json();
        const amount = parseFloat(body.amount);
        const lockPeriod = parseInt(body.lockPeriod || body.days);

        console.log("\n📋 Stake Request Details:");
        console.log("   Amount: $" + amount);
        console.log("   Lock Period: " + lockPeriod + " days");

        // ============================================
        // 3. VALIDATION
        // ============================================
        if (!amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json(
                { success: false, message: "Invalid amount. Must be greater than 0." },
                { status: 400 }
            );
        }

        if (!lockPeriod || ![30, 60, 90].includes(lockPeriod)) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Invalid lock period. Must be 30, 60, or 90 days.",
                    validOptions: [30, 60, 90]
                },
                { status: 400 }
            );
        }

        // ============================================
        // 4. FIND USER
        // ============================================
        const user = await User.findById(userId) as IUser;
        
        if (!user) {
            console.error("❌ User not found:", userId);
            return NextResponse.json(
                { success: false, message: "User account not found" },
                { status: 404 }
            );
        }

        console.log("\n👤 User Found:");
        console.log("   Name:", user.name);
        console.log("   Email:", user.email);
        console.log("   Wallet Balance: $" + user.walletBalance);
        console.log("   Staked Balance: $" + (user.stakedBalance || 0));

        // ============================================
        // 5. CHECK BALANCE
        // ============================================
        if (user.walletBalance < amount) {
            console.error("❌ Insufficient balance");
            console.error("   Required: $" + amount);
            console.error("   Available: $" + user.walletBalance);
            
            return NextResponse.json(
                { 
                    success: false, 
                    message: `Insufficient wallet balance. You need $${amount} but have $${user.walletBalance}.`,
                    available: user.walletBalance,
                    required: amount,
                    shortfall: amount - user.walletBalance
                },
                { status: 400 }
            );
        }

        // ============================================
        // 6. CALCULATE DATES & APY
        // ============================================
        const now = new Date();
        const unlockDate = new Date(now);
        unlockDate.setDate(unlockDate.getDate() + lockPeriod);
        const apy = calculateAPY(lockPeriod);

        console.log("\n📊 Stake Calculation:");
        console.log("   APY for " + lockPeriod + " days: " + apy + "%");
        console.log("   Start Date:", now.toISOString());
        console.log("   Unlock Date:", unlockDate.toISOString());

        // ============================================
        // 7. CREATE STAKE RECORD
        // ============================================
        let newStake;
        try {
            console.log("\n🔄 Creating stake in database...");
            
            const stakeData = {
                userId: userId,
                originalAmount: amount,
                currentAmount: amount,
                startDate: now,
                unlockDate: unlockDate,
                lastProfitDate: now,
                lockPeriod: lockPeriod,
                status: 'locked',
                totalProfit: 0,
                profitHistory: [],
                cycle: 1,
                autoRelock: true,
                autoRelockAt: null
            };

            newStake = await Stake.create(stakeData);
            console.log("✅ Stake created successfully");
            console.log("   Stake ID:", newStake._id);

        } catch (stakeError: any) {
            console.error("\n❌ STAKE CREATION FAILED:");
            console.error("   Error:", stakeError.message);
            
            if (stakeError.errors) {
                console.error("   Validation Errors:", JSON.stringify(stakeError.errors, null, 2));
            }

            return NextResponse.json(
                { 
                    success: false, 
                    message: "Failed to create stake record",
                    error: stakeError.message,
                    details: process.env.NODE_ENV === "development" ? stakeError.errors : undefined
                },
                { status: 500 }
            );
        }

        // ============================================
        // 8. UPDATE USER BALANCES
        // ============================================
        const previousWalletBalance = user.walletBalance;
        const previousStakedBalance = user.stakedBalance || 0;

        user.walletBalance -= amount;
        user.stakedBalance = previousStakedBalance + amount;

        console.log("\n💰 Balance Update:");
        console.log("   Wallet: $" + previousWalletBalance + " → $" + user.walletBalance);
        console.log("   Staked: $" + previousStakedBalance + " → $" + user.stakedBalance);

        // ============================================
        // 9. ADD TO USER.STAKES ARRAY (Backward Compatibility)
        // ============================================
        const stakeRecord = {
            amount: amount,
            stakedAt: now,
            unlockDate: unlockDate,
            lockPeriod: lockPeriod,
            status: 'active' as const,
            apy: apy,
            earnedRewards: 0
        };

        if (!user.stakes) {
            user.stakes = [];
        }
        
        (user.stakes as any).push(stakeRecord);
        console.log("✅ Stake added to user.stakes array");

        // ============================================
        // 10. SAVE USER
        // ============================================
        try {
            await user.save();
            console.log("✅ User balances saved successfully");
        } catch (saveError: any) {
            // Rollback: Delete the stake
            console.error("\n❌ USER SAVE FAILED - Rolling back...");
            await Stake.findByIdAndDelete(newStake._id);
            console.log("✅ Stake rolled back");
            
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Failed to update user balance. Please try again.",
                    error: saveError.message
                },
                { status: 500 }
            );
        }

        // ============================================
        // 11. SEND EMAIL NOTIFICATION
        // ============================================
        try {
            await emailService.sendStakeStarted(
                user.email,
                user.name || user.email,
                amount,
                lockPeriod,
                unlockDate,
                newStake._id.toString()
            );
            console.log("📧 Confirmation email sent to:", user.email);
        } catch (emailError: any) {
            console.error("⚠️ Email sending failed:", emailError.message);
            // Don't fail the stake if email fails
        }

        // ============================================
        // 12. SUCCESS RESPONSE
        // ============================================
        console.log("\n" + "=".repeat(60));
        console.log("✅ STAKE CREATED SUCCESSFULLY");
        console.log("=".repeat(60));
        console.log("   Stake ID:", newStake._id);
        console.log("   Amount: $" + amount);
        console.log("   Lock Period:", lockPeriod + " days");
        console.log("   APY:", apy + "%");
        console.log("   New Wallet Balance: $" + user.walletBalance);
        console.log("   New Staked Balance: $" + user.stakedBalance);
        console.log("=".repeat(60) + "\n");

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
                    apy: apy,
                    dailyReward: (amount * 0.01).toFixed(2)
                }
            }
        }, { status: 201 });

    } catch (err: any) {
        console.error("\n" + "=".repeat(60));
        console.error("❌ STAKE CREATE ERROR");
        console.error("=".repeat(60));
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        console.error("=".repeat(60) + "\n");

        return NextResponse.json(
            { 
                success: false, 
                message: "An unexpected error occurred. Please try again or contact support.",
                error: err.message,
                details: process.env.NODE_ENV === "development" ? err.stack : undefined
            },
            { status: 500 }
        );
    }
}