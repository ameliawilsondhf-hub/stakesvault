import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "Support chat endpoint" 
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    return NextResponse.json({ 
      success: true, 
      message: "Support chat message received",
      data: body
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}