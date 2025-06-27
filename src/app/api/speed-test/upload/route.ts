import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Consume the stream to completion
  if (request.body) {
    const reader = request.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  }
  return NextResponse.json({ ok: true });
}
