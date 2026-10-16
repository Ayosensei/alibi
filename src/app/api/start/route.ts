import { NextResponse } from 'next/server';
import { startPlay } from '@/engine/play';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await startPlay(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'INTERNAL', message },
        trace: [],
      },
      { status: 500 }
    );
  }
}
