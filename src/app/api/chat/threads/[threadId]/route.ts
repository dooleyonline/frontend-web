import { NextResponse } from 'next/server';

import { getThreadById } from '@/lib/mocks/chat-store';

type RouteParams = {
  params: {
    threadId: string;
  };
};

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const thread = getThreadById(params.threadId);
    return NextResponse.json(thread, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Thread not found';
    return NextResponse.json({ message }, { status: 404 });
  }
}