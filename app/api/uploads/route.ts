import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { filename: string } }) {
  try {
    // ✅ Add safety check for params
    if (!params || !params.filename) {
      return new NextResponse('Filename is required', { status: 400 });
    }

    const filename = params.filename;
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    
    // Security check - prevent directory traversal
    if (!filepath.startsWith(path.join(process.cwd(), 'public/uploads'))) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    const fileBuffer = fs.readFileSync(filepath);
    const ext = path.extname(filename).toLowerCase();
    
    // Set correct content type
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Upload route error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}