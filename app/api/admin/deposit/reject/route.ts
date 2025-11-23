import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ FIX: Accept 'requestId' from frontend
    const { requestId } = await req.json();
    
    if (!requestId) {
      return NextResponse.json(
        { message: "Request ID required" },
        { status: 400 }
      );
    }

    const dep = await Deposit.findById(requestId);

    if (!dep) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    if (dep.status !== "pending") {
      return NextResponse.json(
        { message: "Already processed" },
        { status: 400 }
      );
    }

    // ✅ Update deposit status
    dep.status = "rejected";
    await dep.save();

    console.log(`✅ Deposit ${requestId} rejected`);

    return NextResponse.json({
      success: true,
      message: "Deposit rejected",
    });

  } catch (error: any) {
    console.error("❌ Reject Error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}