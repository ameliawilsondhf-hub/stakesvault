import { NextResponse } from "next/server";

export async function GET() {
  // Facebook OAuth redirect
  const facebookAuthUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT_URI&scope=email`;
  
  return NextResponse.redirect(facebookAuthUrl);
}