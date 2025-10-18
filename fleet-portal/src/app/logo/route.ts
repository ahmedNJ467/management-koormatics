import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to the static logo file in public directory
  return NextResponse.redirect(new URL('/logo.png', request.url));
}
