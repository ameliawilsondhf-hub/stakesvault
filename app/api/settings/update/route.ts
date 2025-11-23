import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/lib/models/settings";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const form = await req.formData();
    const depositAddress = form.get("depositAddress") as string;

    let qrImageUrl = "";

    // 🟦 Get File
    const file = form.get("qrImage") as unknown as File;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 🟦 EXTENSION AUTO DETECT (.jpg / .png)
      const ext = file.type === "image/png" ? ".png" : ".jpg";

      // 🟦 AUTO RENAME
      const fileName = Date.now() + "-qr" + ext;

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      qrImageUrl = "/uploads/" + fileName;
    }

    let s = await Settings.findOne();

    if (!s) {
      s = await Settings.create({
        depositAddress,
        qrImage: qrImageUrl || "",
      });
    } else {
      s.depositAddress = depositAddress;
      if (qrImageUrl) s.qrImage = qrImageUrl;
      await s.save();
    }

    return Response.json({ success: true });
  } catch (err: unknown) {
    return Response.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
