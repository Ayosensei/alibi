import { NextResponse } from 'next/server';
import { accuse } from '@/engine/verdict';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await accuse(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message },
      trace: [],
    });
  }
}
