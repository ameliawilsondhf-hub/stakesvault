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

export async function POST(request: Request) {
  try {
    await connectDB();

    // --- 1. Authentication Check ---
    let userId: string | null = null;

    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        userId = (session.user as any).id || (await User.findOne({ email: session.user.email }))?._id.toString();
      }
    } catch (err) {
      console.log("⚠️ NextAuth session check failed.");
    }

    if (!userId) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        if (token && token.value) {
          const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET!);
          userId = decoded.id;
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

    // --- 2. Get Request Body ---
    const body = await request.json();
    const { amount, walletAddress, qrImage } = body;

    // --- 3. Validation ---
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Minimum withdrawal check
    const MIN_WITHDRAWAL = 10;
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

    // --- 4. Check User Balance & Deduct ---
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.walletBalance < amount) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 🔥 DEDUCT WALLET BALANCE IMMEDIATELY
    user.walletBalance -= parseFloat(amount);
    await user.save();

    console.log(`✅ Deducted $${amount} from user ${user.email}. New balance: $${user.walletBalance}`);

    // --- 5. Upload QR Image to Cloudinary (if provided) ---
    let qrImageUrl: string | null = null;
    if (qrImage) {
      try {
        qrImageUrl = await uploadToCloudinary(qrImage);
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        // Continue without image if upload fails
      }
    }

    // --- 6. Create Withdrawal Record ---
    const withdrawal = await Withdraw.create({
      userId,
      amount: parseFloat(amount),
      walletAddress: walletAddress.trim(),
      qrImage: qrImageUrl,
      status: "pending",
    });

    // --- 7. Send Email Notification ---
    try {
      await emailService.sendWithdrawalReceived(
        user.email,
        user.name || user.email,
        parseFloat(amount),
        walletAddress.trim(),
        withdrawal._id.toString()
      );
      console.log(`📧 Withdrawal received email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      // Don't fail the withdrawal submission if email fails
    }

    // --- 8. Return Success ---
    return NextResponse.json(
      {
        success: true,
        message: "Withdrawal request submitted successfully. Amount deducted from wallet. You will receive a confirmation email shortly.",
        withdrawalId: withdrawal._id,
        newBalance: user.walletBalance
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ Withdrawal Submit Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}