import { NextResponse } from "next/server";

export async function GET() {
  // Google OAuth redirect
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=email profile`;
  
  return NextResponse.redirect(googleAuthUrl);
}