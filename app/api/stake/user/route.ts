import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Stake from "@/lib/models/stake";
import connectDB from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, msg: "No cookie token" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, msg: "JWT SECRET missing" },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return NextResponse.json(
        { success: false, msg: "Invalid token" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    const stakes = await Stake.find({ userId: decoded.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      {
        success: true,
        stakes,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, msg: "Server error", error: err.message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
