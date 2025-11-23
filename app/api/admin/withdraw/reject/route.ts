import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Withdraw from "@/lib/models/withdraw";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { withdrawId } = await req.json();
    
    if (!withdrawId) {
      return NextResponse.json(
        { message: "Withdraw ID missing" },
        { status: 400 }
      );
    }

    // Fetch record
    const reqDoc = await Withdraw.findById(withdrawId);

    if (!reqDoc) {
      return NextResponse.json(
        { message: "Withdraw request not found" },
        { status: 404 }
      );
    }

    // Already processed?
    if (reqDoc.status !== "pending") {
      return NextResponse.json(
        { message: "Request already processed!" },
        { status: 400 }
      );
    }

    // Update status
    reqDoc.status = "rejected";
    await reqDoc.save();   // <<–– ERROR HERE FIXED

    return NextResponse.json({ message: "Withdraw rejected successfully" });

  } catch (err: any) {
    console.log("WITHDRAW REJECT ERROR:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
