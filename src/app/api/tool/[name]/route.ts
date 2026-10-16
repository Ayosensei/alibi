import { NextResponse } from 'next/server';
import { TOOLS } from '@/engine/contract';
import { TOOL_DISPATCH } from '@/engine/inspector';

export async function POST(
  req: Request,
  context: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await context.params;
    const toolName = name as keyof typeof TOOLS;

    const schema = TOOLS[toolName];
    const fn = TOOL_DISPATCH[toolName];

    if (!schema || !fn) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: 'BAD_ARGS', message: `Unknown tool: ${name}` },
          trace: [],
        },
        { status: 200 }
      );
    }

    const body = await req.json();
    const parsed = schema.input.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'BAD_ARGS',
            message: `Invalid arguments for ${name}`,
            hint: parsed.error.message,
          },
          trace: [],
        },
        { status: 200 }
      );
    }

    const result = await fn(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'INTERNAL', message },
        trace: [],
      },
      { status: 200 }
    );
  }
}
