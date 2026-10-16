import { runInspector } from '@/engine/inspector';
import { type InspectorEventType } from '@/engine/contract';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: InspectorEventType) => {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        };

        try {
          await runInspector(body, sendEvent);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          sendEvent({ type: 'message', text: `Internal error: ${message}` });
          sendEvent({ type: 'done', steps: 0, source: 'deterministic' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`data: ${JSON.stringify({ type: 'message', text: message })}\n\n`, {
      headers: { 'Content-Type': 'text/event-stream' },
      status: 400,
    });
  }
}
