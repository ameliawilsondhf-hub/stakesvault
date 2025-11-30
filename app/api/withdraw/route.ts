import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Withdraw from "@/lib/models/withdraw";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { emailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';

// ⭐ SMART WITHDRAWAL CONFIGURATION
const MIN_STAKE_PERCENT = 80; // User must have 80% of deposits staked
const MIN_WITHDRAWAL = 10;

// Cloudinary upload function
async function uploadToCloudinary(base64Image: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dkpsdkbpq";
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "deposit_proofs";

  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * POST /api/withdraw
 * 
 * Submit a withdrawal request with SMART RULES
 * 
 * WITHDRAWAL RULES:
 * 1. Must have stake ≥ 80% of total deposits
 * 2. If stake ACTIVE → Can withdraw ONLY remaining wallet balance (not staked amount)
 * 3. If stake COMPLETED → Can withdraw everything (stake + profit + wallet)
 * 
 * EXAMPLE:
 * - Deposit: $100
 * - Required stake (80%): $80
 * - User stakes: $80 (ACTIVE)
 * - Wallet remaining: $20
 * - Result: ✅ Can withdraw $20, ❌ Cannot withdraw $80 (locked)
 * 
 * @requires Authentication (NextAuth or JWT)
 * @body { amount: number, walletAddress: string, qrImage?: string }
 * @returns { success, message, withdrawalId, newBalance }
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    await connectDB();

    // ============================================
    // 1. AUTHENTICATION
    // ============================================
    let userId: string | null = null;

    // Try NextAuth first
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        userId = (session.user as any).id || (await User.findOne({ email: session.user.email }))?._id.toString();
      }
    } catch (err) {
      console.log("⚠️ NextAuth session check failed.");
    }

    // Fallback to JWT
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id || decoded.userId;
        }
      } catch (err) {
        console.log("⚠️ JWT verification failed.");
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    // ============================================
    // 2. PARSE REQUEST
    // ============================================
    const body = await request.json();
    const { amount, walletAddress, qrImage } = body;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`💸 SMART WITHDRAWAL REQUEST`);
    console.log(`${'='.repeat(60)}`);

    // ============================================
    // 3. VALIDATION
    // ============================================
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    if (parseFloat(amount) < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, message: `Minimum withdrawal is $${MIN_WITHDRAWAL} USDT` },
        { status: 400 }
      );
    }

    if (!walletAddress || !walletAddress.trim()) {
      return NextResponse.json(
        { success: false, message: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate TRC20 address format
    const trimmedAddress = walletAddress.trim();
    if (!trimmedAddress.startsWith('T') || trimmedAddress.length !== 34) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid TRC20 wallet address. Address must start with 'T' and be 34 characters long." 
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. FETCH USER
    // ============================================
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Requested Amount: $${parseFloat(amount).toFixed(2)}`);
    console.log(`Current Wallet Balance: $${user.walletBalance.toFixed(2)}`);

    // ============================================
    // 5. 🎯 SMART WITHDRAWAL CHECK
    // ============================================
    const totalDeposits = user.totalDeposits || 0;
    const requiredStake = totalDeposits * (MIN_STAKE_PERCENT / 100);

    // Get ALL stakes
    const allStakes = user.stakes || [];
    const activeStakes = allStakes.filter((stake: any) => stake.status === 'active');
    const completedStakes = allStakes.filter((stake: any) => stake.status === 'completed' || stake.status === 'unlocked');
    
    const totalActiveStake = activeStakes.reduce((sum: number, stake: any) => sum + (stake.amount || 0), 0);
    const totalCompletedStake = completedStakes.reduce((sum: number, stake: any) => sum + (stake.amount || 0), 0);
    const totalStake = totalActiveStake + totalCompletedStake;

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🎯 SMART WITHDRAWAL ELIGIBILITY`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`Total Deposits: $${totalDeposits.toFixed(2)}`);
    console.log(`Required Stake (${MIN_STAKE_PERCENT}%): $${requiredStake.toFixed(2)}`);
    console.log(`\nStake Status:`);
    console.log(`  Active (Locked): $${totalActiveStake.toFixed(2)}`);
    console.log(`  Completed: $${totalCompletedStake.toFixed(2)}`);
    console.log(`  Total: $${totalStake.toFixed(2)}`);
    console.log(`\nWallet:`);
    console.log(`  Balance: $${user.walletBalance.toFixed(2)}`);
    console.log(`  Withdrawal Request: $${parseFloat(amount).toFixed(2)}`);
    console.log(`${'─'.repeat(60)}\n`);

    // ⚠️ CHECK 1: Must have stake requirement met
    if (totalStake < requiredStake) {
      const deficit = requiredStake - totalStake;
      
      console.log(`❌ BLOCKED - Insufficient Stake`);
      console.log(`   Need $${deficit.toFixed(2)} more stake\n`);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `You must stake at least $${requiredStake.toFixed(2)} (${MIN_STAKE_PERCENT}% of deposits) to enable withdrawals. Current stake: $${totalStake.toFixed(2)}. Please stake $${deficit.toFixed(2)} more.`,
          details: {
            reason: "INSUFFICIENT_STAKE",
            totalDeposits: totalDeposits.toFixed(2),
            requiredStake: requiredStake.toFixed(2),
            currentStake: totalStake.toFixed(2),
            deficit: deficit.toFixed(2)
          }
        },
        { status: 403 }
      );
    }

    // ⚠️ CHECK 2: No stakes at all
    if (allStakes.length === 0) {
      console.log(`❌ BLOCKED - No Stakes Found\n`);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `You must create a stake plan before withdrawing. Please stake at least $${requiredStake.toFixed(2)}.`,
          details: {
            reason: "NO_STAKE",
            requiredStake: requiredStake.toFixed(2)
          }
        },
        { status: 403 }
      );
    }

    // ✅ CHECK 3: Balance check
    if (user.walletBalance < parseFloat(amount)) {
      console.log(`❌ BLOCKED - Insufficient Wallet Balance\n`);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient wallet balance. Available: $${user.walletBalance.toFixed(2)}`,
          details: {
            reason: "INSUFFICIENT_BALANCE",
            available: user.walletBalance.toFixed(2),
            requested: parseFloat(amount).toFixed(2)
          }
        },
        { status: 400 }
      );
    }

    // 🎯 SMART RULE: If stake is ACTIVE, explain limits
    if (activeStakes.length > 0) {
      console.log(`⚠️ ACTIVE STAKE DETECTED`);
      console.log(`   Locked Amount: $${totalActiveStake.toFixed(2)}`);
      console.log(`   Available (Wallet Only): $${user.walletBalance.toFixed(2)}`);
      console.log(`   Note: Staked amount will be available after lock period\n`);
      
      // This is just informational - wallet balance check already done above
      // User can withdraw up to their wallet balance
    }

    // ✅ If stake COMPLETED, full access
    if (completedStakes.length > 0 && activeStakes.length === 0) {
      console.log(`✅ COMPLETED STAKE - Full withdrawal access\n`);
    }

    console.log(`✅ Withdrawal approved!\n`);

    // ============================================
    // 6. DEDUCT WALLET BALANCE
    // ============================================
    const previousBalance = user.walletBalance;
    user.walletBalance -= parseFloat(amount);
    await user.save();

    console.log(`💰 Balance Updated:`);
    console.log(`   Previous: $${previousBalance.toFixed(2)}`);
    console.log(`   Deducted: -$${parseFloat(amount).toFixed(2)}`);
    console.log(`   New: $${user.walletBalance.toFixed(2)}\n`);

    // ============================================
    // 7. UPLOAD QR IMAGE (if provided)
    // ============================================
    let qrImageUrl: string | null = null;
    if (qrImage) {
      try {
        qrImageUrl = await uploadToCloudinary(qrImage);
        console.log(`📸 QR image uploaded\n`);
      } catch (error) {
        console.error("⚠️ Cloudinary upload error:", error);
      }
    }

    // ============================================
    // 8. CREATE WITHDRAWAL RECORD
    // ============================================
    const withdrawal = await Withdraw.create({
      userId,
      amount: parseFloat(amount),
      walletAddress: trimmedAddress,
      qrImage: qrImageUrl,
      status: "pending",
    });

    console.log(`✅ Withdrawal record created: ${withdrawal._id}\n`);

    // ============================================
    // 9. SEND EMAIL NOTIFICATION
    // ============================================
    try {
      await emailService.sendWithdrawalReceived(
        user.email,
        user.name || user.email,
        parseFloat(amount),
        trimmedAddress,
        withdrawal._id.toString()
      );
      console.log(`📧 Email sent to ${user.email}\n`);
    } catch (emailError) {
      console.error("❌ Email failed:", emailError);
    }

    // ============================================
    // 10. RETURN SUCCESS
    // ============================================
    const processingTime = Date.now() - startTime;

    console.log(`${'='.repeat(60)}`);
    console.log(`✅ WITHDRAWAL SUCCESSFUL`);
    console.log(`${'='.repeat(60)}`);
    console.log(`ID: ${withdrawal._id}`);
    console.log(`Amount: $${parseFloat(amount).toFixed(2)}`);
    console.log(`New Balance: $${user.walletBalance.toFixed(2)}`);
    console.log(`Time: ${processingTime}ms`);
    console.log(`${'='.repeat(60)}\n`);

    return NextResponse.json(
      {
        success: true,
        message: activeStakes.length > 0 
          ? `Withdrawal of $${parseFloat(amount).toFixed(2)} successful! Note: Your $${totalActiveStake.toFixed(2)} staked amount is locked and will be available after the lock period completes.`
          : `Withdrawal of $${parseFloat(amount).toFixed(2)} successful!`,
        data: {
          withdrawalId: withdrawal._id,
          amount: parseFloat(amount),
          previousBalance: previousBalance,
          newBalance: user.walletBalance,
          walletAddress: trimmedAddress,
          status: "pending",
          lockedStake: totalActiveStake,
          hasActiveStake: activeStakes.length > 0,
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ WITHDRAWAL ERROR`);
    console.error(`${'='.repeat(60)}`);
    console.error(`Error: ${error.message}`);
    console.error(`${'='.repeat(60)}\n`);

    return NextResponse.json(
      {
        success: false,
        message: "Server error while processing withdrawal",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}