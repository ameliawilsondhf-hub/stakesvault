import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Deposit from "@/lib/models/deposit";
import { writeFile } from "fs/promises";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Read form-data from Request
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const amount = Number(formData.get("amount"));
    const screenshotFile = formData.get("screenshot") as File;

    console.log("📥 Deposit Request:", { userId, amount, hasFile: !!screenshotFile });

    // -----------------------------
    // VALIDATIONS
    // -----------------------------
    if (!userId) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!screenshotFile) {
      return NextResponse.json(
        { message: "Screenshot is required" },
        { status: 400 }
      );
    }

    // -----------------------------
    // FILE VALIDATION
    // -----------------------------
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    
    if (!allowedTypes.includes(screenshotFile.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only PNG, JPG, JPEG, WEBP allowed." },
        { status: 400 }
      );
    }

    // Max size 5MB
    if (screenshotFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File too large. Maximum 5MB allowed." },
        { status: 400 }
      );
    }

    // -----------------------------
    // SAVE FILE TO PUBLIC/UPLOADS
    // -----------------------------
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure upload folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = screenshotFile.name.split(".").pop();
    const filename = `deposit_${userId}_${timestamp}.${fileExt}`;
    const filepath = path.join(uploadDir, filename);

    // Convert File to Buffer and save
    const bytes = await screenshotFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log("✅ File saved:", filename);

    // ✅ FULL URL PATH - Ab frontend se proper load hoga
    const screenshotUrl = `/uploads/${filename}`;

    // -----------------------------
    // CREATE DEPOSIT ENTRY
    // -----------------------------
    const deposit = await Deposit.create({
      userId,
      amount,
      screenshot: screenshotUrl,  // ✅ Full path save karo - CHANGED
      status: "pending",
    });

    console.log("✅ Deposit created:", deposit._id);

    return NextResponse.json(
      {
        success: true,
        message: "Deposit request submitted successfully",
        depositId: deposit._id,
        file: screenshotUrl,  // ✅ CHANGED
      },
      { status: 201 }
    );
    
  } catch (err: any) {
    console.error("❌ Deposit error:", err);

    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}