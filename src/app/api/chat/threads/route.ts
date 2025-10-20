import { NextResponse } from 'next/server';

import { listThreads } from '@/lib/mocks/chat-store';

export async function GET() {
  const threads = listThreads();
  return NextResponse.json(threads, {
    headers: { 'Cache-Control': 'no-store' },
  });
}