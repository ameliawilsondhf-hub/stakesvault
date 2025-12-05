import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stake from "@/lib/models/stake";

export async function GET() {
  try {
    await connectDB();

    console.log("🔄 Starting auto-lock checker...");

    const stakes = await Stake.find({
      status: "unlocked",
      autoRelock: true,
      autoRelockAt: { $lte: new Date() }
    });

    console.log(`📊 Found ${stakes.length} stakes ready for auto-lock`);

    const now = new Date();
    let lockedCount = 0;

    for (let st of stakes) {
      try {
        // Use the relock() method from Stake model
        st.relock();
        
        await st.save();
        
        lockedCount++;
        console.log(`✅ Auto-locked stake ${st._id} (Cycle: ${st.cycle})`);
      } catch (error) {
        console.error(`❌ Failed to lock stake ${st._id}:`, error);
      }
    }

    console.log(`🔒 Auto-locked: ${lockedCount}/${stakes.length} stakes`);

    return NextResponse.json({ 
      success: true, 
      msg: "Auto lock done",
      locked: lockedCount,
      total: stakes.length
    });
  } catch (error: any) {
    console.error("❌ Auto-lock error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}