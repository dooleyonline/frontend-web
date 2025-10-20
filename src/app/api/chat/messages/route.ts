import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { appendMessage } from '@/lib/mocks/chat-store';
import { sendMessageInputSchema } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = sendMessageInputSchema.parse(body);
    const message = appendMessage(payload);

    return NextResponse.json(message, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        { message: issue?.message ?? 'Invalid request payload' },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}