import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Withdraw from "@/lib/models/withdraw";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();

    // -------------------------------
    //  GET LOGGED IN USER
    // -------------------------------
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Not logged in" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(token)) {
      return NextResponse.json(
        { message: "Invalid session token" },
        { status: 401 }
      );
    }

    const user = await User.findById(token);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // -------------------------------
    //  READ FORM DATA
    // -------------------------------
    const formData = await req.formData();
    const amount = Number(formData.get("amount"));
    const walletAddress = (formData.get("walletAddress") || "").toString();
    const qrFile = formData.get("qrImage");

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Invalid withdraw amount" },
        { status: 400 }
      );
    }

    if (!walletAddress || walletAddress.length < 5) {
      return NextResponse.json(
        { message: "Invalid wallet address" },
        { status: 400 }
      );
    }

    if (user.walletBalance < amount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // -------------------------------
    //  CONVERT QR IMAGE → BASE64
    // -------------------------------
    let qrImage: string | null = null;

    // Only convert if actual file uploaded
    if (qrFile && typeof qrFile !== "string") {
      const fileData = qrFile as File;
      const buffer = Buffer.from(await fileData.arrayBuffer());

      qrImage = `data:${fileData.type};base64,${buffer.toString("base64")}`;
    }

    // -------------------------------
    //  CREATE WITHDRAW REQUEST
    // -------------------------------
    await Withdraw.create({
      userId: user._id,
      amount,
      walletAddress,
      qrImage, // <-- Base64 stored correctly
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Withdraw request submitted successfully" },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ WITHDRAW API ERROR:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
