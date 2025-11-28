import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Deposit from "@/lib/models/deposit";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { emailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';

// Cloudinary upload function
async function uploadToCloudinary(base64Image: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";

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

export async function POST(request: NextRequest) {
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
    const { amount, proofImage } = body;

    // --- 3. Validation ---
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!proofImage) {
      return NextResponse.json(
        { success: false, message: "Payment proof is required" },
        { status: 400 }
      );
    }

    // --- 4. Get deposit settings ---
    const settings = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settings/get`);
    const settingsData = await settings.json();
    
    if (settingsData.success && amount < settingsData.settings.minDeposit) {
      return NextResponse.json(
        { success: false, message: `Minimum deposit is ${settingsData.settings.minDeposit} USDT` },
        { status: 400 }
      );
    }

    // --- 5. Upload Image to Cloudinary ---
    let imageUrl: string;
    try {
      imageUrl = await uploadToCloudinary(proofImage);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to upload image" },
        { status: 500 }
      );
    }

    // --- 6. Create Deposit Record ---
    const deposit = await Deposit.create({
      userId,
      amount: parseFloat(amount),
      screenshot: imageUrl,
      status: "pending",
    });

    // --- 7. Get User for Email ---
    const user = await User.findById(userId);

    // --- 8. Send Email Notification ---
    if (user) {
      try {
        await emailService.sendDepositReceived(
          user.email,
          user.name || user.email,
          parseFloat(amount),
          deposit._id.toString()
        );
        console.log(`📧 Deposit received email sent to ${user.email}`);
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        // Don't fail the deposit submission if email fails
      }
    }

    // --- 9. Return Success ---
    return NextResponse.json(
      {
        success: true,
        message: "Deposit request submitted successfully. You will receive a confirmation email shortly.",
        depositId: deposit._id,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ Deposit Submit Error:", error);
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