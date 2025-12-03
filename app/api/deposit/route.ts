import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Deposit from "@/lib/models/deposit";
import { writeFile } from "fs/promises";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ Read form-data
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const amount = Number(formData.get("amount"));
    const screenshotFile = formData.get("screenshot") as File;

    console.log("📥 Deposit Request:", { userId, amount, hasFile: !!screenshotFile });

    // -----------------------------
    // ✅ VALIDATIONS
    // -----------------------------
    if (!userId) {
      return NextResponse.json(
        { message: "User not authenticated" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Invalid amount" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    if (!screenshotFile) {
      return NextResponse.json(
        { message: "Screenshot is required" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // -----------------------------
    // ✅ FILE VALIDATION
    // -----------------------------
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    
    if (!allowedTypes.includes(screenshotFile.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only PNG, JPG, JPEG, WEBP allowed." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // ✅ Max 5MB
    if (screenshotFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File too large. Maximum 5MB allowed." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // -----------------------------
    // ✅ SAVE FILE TO public/uploads
    // -----------------------------
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileExt = screenshotFile.name.split(".").pop();
    const filename = `deposit_${userId}_${timestamp}.${fileExt}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await screenshotFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log("✅ File saved:", filename);

    // ✅ Public URL
    const screenshotUrl = `/uploads/${filename}`;

    // -----------------------------
    // ✅ CREATE DEPOSIT ENTRY
    // -----------------------------
    const deposit = await Deposit.create({
      userId,
      amount,
      screenshot: screenshotUrl,
      status: "pending",
    });

    console.log("✅ Deposit created:", deposit._id);

    return NextResponse.json(
      {
        success: true,
        message: "Deposit request submitted successfully",
        depositId: deposit._id,
        file: screenshotUrl,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );

  } catch (err: any) {
    console.error("❌ Deposit error:", err);

    return NextResponse.json(
      { message: "Server error", error: err.message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}