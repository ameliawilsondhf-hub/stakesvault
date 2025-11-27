import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";

export async function POST() {
  try {
    await connectDB();

    // Find all deposits with /uploads/ prefix in screenshot
    const deposits = await Deposit.find({
      screenshot: { $regex: "^/uploads/" }
    });

    console.log(`Found ${deposits.length} deposits to fix`);

    let fixed = 0;
    for (const deposit of deposits) {
      if (deposit.screenshot && deposit.screenshot.startsWith('/uploads/')) {
        // Remove /uploads/ prefix
        deposit.screenshot = deposit.screenshot.replace('/uploads/', '');
        await deposit.save();
        fixed++;
        console.log(`Fixed: ${deposit._id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} deposits`,
      count: fixed
    });

  } catch (error: any) {
    console.error("Cleanup Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}