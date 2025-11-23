import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import Stake from "@/lib/models/stake";

export async function GET() {
  try {
    await connectDB();

    const stakes = await Stake.find();

    for (let st of stakes) {
      if (st.status === "locked") {
        const today = new Date();
        const last = new Date(st.lastProfitDate);

        const diff =
          today.getDate() !== last.getDate() ||
          today.getMonth() !== last.getMonth() ||
          today.getFullYear() !== last.getFullYear();

        if (diff) {
          let profit = st.amount * 0.01;
          st.amount += profit;
          st.totalProfit += profit;
          st.lastProfitDate = today;
          await st.save();
        }
      }
    }

    return NextResponse.json({ success: true, msg: "Daily profit added" });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}
