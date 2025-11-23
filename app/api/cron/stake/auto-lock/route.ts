import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stake from "@/lib/models/stake";

export async function GET() {
  try {
    await connectDB();

    const stakes = await Stake.find();

    const now = new Date();

    for (let st of stakes) {
      if (st.status === "unlocked") {
        if (now >= st.autoLockCheckDate) {
          // Auto lock again
          st.status = "locked";
          st.startDate = now;
          st.unlockDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          st.lastProfitDate = now;
          st.autoLockCheckDate = st.unlockDate;
          await st.save();
        }
      }
    }

    return NextResponse.json({ success: true, msg: "Auto lock done" });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}
