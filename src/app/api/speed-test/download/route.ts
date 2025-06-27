import { NextResponse } from 'next/server';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET() {
  const size = 10 * 1024 * 1024; // 10 MB
  let bytesSent = 0;

  const stream = new Readable({
    read() {
      if (bytesSent < size) {
        const chunkSize = Math.min(65536, size - bytesSent);
        this.push(Buffer.alloc(chunkSize)); // Pushing zero-filled buffer
        bytesSent += chunkSize;
      } else {
        this.push(null);
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': size.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
