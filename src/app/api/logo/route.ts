import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'images', 'Koormatics-logo.png'),
      path.join(process.cwd(), 'public', 'Koormatics-logo.png'),
      path.join(process.cwd(), 'Koormatics-logo.png'),
    ];

    let logoBuffer: Buffer | null = null;
    let usedPath = '';

    for (const logoPath of possiblePaths) {
      try {
        if (fs.existsSync(logoPath)) {
          logoBuffer = fs.readFileSync(logoPath);
          usedPath = logoPath;
          break;
        }
      } catch (err) {
        console.log(`Failed to read ${logoPath}:`, err);
      }
    }

    if (!logoBuffer) {
      console.error('Logo file not found in any of the expected locations');
      return new NextResponse('Logo not found', { status: 404 });
    }

    console.log(`Serving logo from: ${usedPath}`);

    const arrayBuffer = new ArrayBuffer(logoBuffer.byteLength);
    const view = new Uint8Array(arrayBuffer);
    view.set(logoBuffer);

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving logo:', error);
    return new NextResponse('Logo not found', { status: 404 });
  }
}
