import connectDB from "@/lib/mongodb";
import Settings from "@/lib/models/settings";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const settings = await Settings.findOne();

    // Auto-detect LATEST QR image from public/uploads folder
    let qrImagePath = "";
    
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      
      // Check if uploads directory exists
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        
        // Find all image files
        const imageFiles = files.filter(file => 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );
        
        if (imageFiles.length > 0) {
          // Get file stats with modification time
          const filesWithStats = imageFiles.map(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              mtime: stats.mtime.getTime() // modification time in milliseconds
            };
          });
          
          // Sort by modification time (newest first)
          filesWithStats.sort((a, b) => b.mtime - a.mtime);
          
          // Get the latest (most recently modified) image
          const latestImage = filesWithStats[0].name;
          qrImagePath = `/uploads/${latestImage}`;
          
          console.log("✅ Latest QR Image detected:", latestImage);
          console.log("📁 Total images in folder:", imageFiles.length);
        } else {
          console.log("⚠️ No image found in /public/uploads");
        }
      } else {
        console.log("⚠️ /public/uploads folder does not exist");
      }
    } catch (fsError) {
      console.log("File system read error:", fsError);
    }

    // Use database image if exists, otherwise use auto-detected latest
    const finalQrImage = settings?.qrImage 
      ? `/uploads/${settings.qrImage}` 
      : qrImagePath;

    return NextResponse.json({
      success: true,
      settings: {
        depositAddress: settings?.depositAddress || "we are checking server details",
        qrImage: finalQrImage,
        minDeposit: settings?.minDeposit || 20,
        maxDeposit: settings?.maxDeposit || "Unlimited",
      }
    });

  } catch (err: any) {
    console.error("❌ SETTINGS GET ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch settings",
      error: err.message,
      settings: { 
        depositAddress: "", 
        qrImage: "",
        minDeposit: 20,
        maxDeposit: "Unlimited"
      }
    }, { status: 500 });
  }
}