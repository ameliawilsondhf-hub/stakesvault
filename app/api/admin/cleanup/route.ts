import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../lib/models/user";

export async function POST() {
  try {
    await connectDB();

    const users = await User.updateMany(
      {},
      {
        $unset: {
          walletbalance: "",
          withdrawhistory: "",
          incomehistory: "",
          directcommissiongiven: "",
          directincome: "",
          depositamount: "",
          levelincome: "",
          referralcount: "",
          referralearnings: "",
          totaldeposits: "",
          lastcommissiondeposit: ""
        }
      }
    );

    return NextResponse.json(
      { message: "Duplicate fields cleaned!", users },
      { status: 200 }
    );
  } catch (e) {
    console.log(e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
