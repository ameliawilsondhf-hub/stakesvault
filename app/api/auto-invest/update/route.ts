import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/user"; // ✅ IUser import kiya for typing

export async function POST(req: Request) {
    try {
        await connectDB();

        // Get JWT token
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Not logged in" },
                { status: 401 }
            );
        }

        // Verify token
        if (!process.env.JWT_SECRET) {
            return NextResponse.json(
                { success: false, message: "Server configuration error" },
                { status: 500 }
            );
        }

        let userId;
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
        } catch (jwtError: any) {
            return NextResponse.json(
                { success: false, message: "Invalid token" },
                { status: 401 }
            );
        }

        // Get request body
        const body = await req.json();
        const { enabled, lockPeriod, minAmount } = body;

        console.log("📝 Updating auto-invest settings:", { enabled, lockPeriod, minAmount });

        // Validation
        if (enabled !== undefined && typeof enabled !== 'boolean') {
            return NextResponse.json(
                { success: false, message: "Invalid enabled value" },
                { status: 400 }
            );
        }

        if (lockPeriod !== undefined && (lockPeriod < 30 || lockPeriod > 365)) {
            return NextResponse.json(
                { success: false, message: "Lock period must be between 30 and 365 days" },
                { status: 400 }
            );
        }

        if (minAmount !== undefined && minAmount < 10) {
            return NextResponse.json(
                { success: false, message: "Minimum amount must be at least $10" },
                { status: 400 }
            );
        }

        // Update user settings
        const user = await User.findById(userId) as IUser; // Type assertion lagaya

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }
        
        // --- FIX: Update fields ---
        
        // Helper function to initialize settings with defaults if missing
        const ensureSettings = () => {
            if (!user.autoInvestSettings) {
                // ⭐ FIX: TypeScript error ko hal karne ke liye Type Assertion use kiya
                // Aur Mongoose defaults ko follow karte hue properties set ki.
                user.autoInvestSettings = {
                    enabled: false,
                    lockPeriod: 30,
                    minAmount: 100,
                } as any; 
            }
        }


        if (enabled !== undefined) {
            user.autoInvestEnabled = enabled;
            ensureSettings();
            user.autoInvestSettings.enabled = enabled;
        }

        if (lockPeriod !== undefined) {
            ensureSettings();
            user.autoInvestSettings.lockPeriod = lockPeriod;
        }

        if (minAmount !== undefined) {
            ensureSettings();
            user.autoInvestSettings.minAmount = minAmount;          
        }

        await user.save();

        console.log("✅ Auto-invest settings updated successfully");

        return NextResponse.json({
            success: true,
            message: "Settings updated successfully",
            data: {
                enabled: user.autoInvestEnabled,
                settings: user.autoInvestSettings
            }
        });

    } catch (error: any) {
        console.error("❌ Auto-invest update error:", error);
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}