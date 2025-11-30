import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, deviceName } = await req.json();
    if (!userId || !deviceName) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    // --- Verify Admin ---
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const admin = await User.findById(decoded.id);

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // --- Get User ---
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // --- Toggle Device ---
    const device = targetUser.devices.find((d: any) => d.name === deviceName);
    if (!device) {
      return NextResponse.json(
        { success: false, message: "Device not found" },
        { status: 404 }
      );
    }

    device.trusted = !device.trusted;
    await targetUser.save();

    return NextResponse.json(
      {
        success: true,
        message: device.trusted
          ? "Device marked as Trusted"
          : "Device marked as Untrusted",
        updatedDevice: device,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("API Error:", e.message);
    return NextResponse.json(
      { success: false, message: "Server error", error: e.message },
      { status: 500 }
    );
  }
}
