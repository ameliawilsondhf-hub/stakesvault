import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/user"; // ✅ IUser import kiya for better typing

// ✅ CORRECTED APY calculator - Daily 1% Compounding
function calculateAPY(lockPeriod: number): number {
    // Formula: ((1 + daily_rate)^days - 1) × 100
    // Daily rate = 1% = 0.01
    const apy = (Math.pow(1.01, lockPeriod) - 1) * 100;
    return parseFloat(apy.toFixed(2)); // Round to 2 decimal places
}

export async function POST(req: Request) {
    try {
        await connectDB();

        // Get JWT token from cookie
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        console.log("🔑 Token:", token ? "Found" : "Missing");

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Not logged in" },
                { status: 401 }
            );
        }

        // Verify JWT token
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
            userId = decoded.id;
            console.log("👤 User ID from JWT:", userId);
        } catch (jwtError: any) {
            console.error("❌ JWT Verification Error:", jwtError.message);
            return NextResponse.json(
                { success: false, message: "Invalid token" },
                { status: 401 }
            );
        }

        // Get request body
        const body = await req.json();
        
        // Support both 'days' and 'lockPeriod' for compatibility
        const amount = body.amount;
        const lockPeriod = body.lockPeriod || body.days;

        console.log("💰 Stake amount:", amount);
        console.log("🔒 Lock period:", lockPeriod);

        // Validation
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, message: "Invalid amount" },
                { status: 400 }
            );
        }

        if (!lockPeriod || lockPeriod <= 0) {
            return NextResponse.json(
                { success: false, message: "Invalid lock period" },
                { status: 400 }
            );
        }

        // User find karo
        const user = await User.findById(userId) as IUser; // Type assertion lagaya
        
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        console.log("💵 Current wallet balance:", user.walletBalance);

        // Balance check karo
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

        // Wallet se deduct karo
        user.walletBalance -= amount;
        console.log("✅ Wallet deducted. New balance:", user.walletBalance);

        // Staked balance mein add karo
        user.stakedBalance = (user.stakedBalance || 0) + amount;
        console.log("✅ Staked balance updated:", user.stakedBalance);

        // Unlock date calculate karo
        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + lockPeriod);

        // Calculate correct APY based on daily 1% compounding
        const apy = calculateAPY(lockPeriod);
        console.log(`📊 Calculated APY for ${lockPeriod} days: ${apy}%`);

        // Stake record create karo
        const stakeRecord = {
            amount: amount,
            stakedAt: new Date(),
            unlockDate: unlockDate,
            lockPeriod: lockPeriod,
            status: 'active' as const, // Type assertion 'active' to match IStake union
            apy: apy,
            earnedRewards: 0
        };

        // Stakes array mein add karo
        if (!user.stakes) {
            user.stakes = [];
        }
        
        // ⭐ FIX: Mongoose Array.push() use karein taaki change detect ho.
        // Ye line TypeScript error (red underline) ko bhi theek karegi.
        (user.stakes as any).push(stakeRecord);

        console.log("✅ Stake record created with APY:", apy);

        // Save karo
        await user.save();

        console.log("✅ User saved successfully");

        return NextResponse.json({
            success: true,
            message: "Staking successful",
            data: {
                walletBalance: user.walletBalance,
                stakedBalance: user.stakedBalance,
                stake: stakeRecord
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